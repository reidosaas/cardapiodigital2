import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private prisma: PrismaService) {}

  async listar(vendedorId: string) {
    return this.prisma.lead.findMany({
      where: { vendedorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarPorTelefone(vendedorId: string, telefone: string) {
    return this.prisma.lead.findFirst({
      where: { vendedorId, telefone },
    });
  }

  async upsert(data: {
    vendedorId: string;
    nome: string;
    telefone: string;
    origem?: string;
    mensagemInicial?: string;
    ultimaMensagem?: string;
    conversaId?: string;
    metadata?: any;
  }) {
    const existente = await this.buscarPorTelefone(data.vendedorId, data.telefone);
    if (existente) {
      return this.prisma.lead.update({
        where: { id: existente.id },
        data: {
          ultimaMensagem: data.ultimaMensagem,
          conversaId: data.conversaId || existente.conversaId,
          metadata: data.metadata ? { ...(existente.metadata as any || {}), ...data.metadata } : existente.metadata,
        },
      });
    }
    return this.prisma.lead.create({ data });
  }

  async stats(vendedorId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { vendedorId },
      select: { id: true, telefone: true, origem: true, converted: true, createdAt: true },
    });

    const totalLeads = leads.length;
    const convertidos = leads.filter((l) => l.converted).length;

    const porOrigem: Record<string, number> = {};
    for (const l of leads) {
      const o = l.origem || 'outro';
      porOrigem[o] = (porOrigem[o] || 0) + 1;
    }

    const pedidos = await this.prisma.pedido.groupBy({
      by: ['clienteTelefone', 'tipoEntrega'],
      where: {
        vendedorId,
        clienteTelefone: { not: null },
      },
      _count: { _all: true },
    });

    const telefonesLead = new Set(leads.map((l) => l.telefone));

    const leadsEntrega = new Set<string>();
    const leadsMesa = new Set<string>();
    const leadsRetirada = new Set<string>();
    let pedidosEntrega = 0;
    let pedidosMesa = 0;
    let pedidosRetirada = 0;

    for (const p of pedidos) {
      const tel = p.clienteTelefone as string;
      const qtd = p._count._all;
      if (p.tipoEntrega === 'ENTREGA') {
        pedidosEntrega += qtd;
        if (telefonesLead.has(tel)) leadsEntrega.add(tel);
      } else if (p.tipoEntrega === 'LOCAL') {
        pedidosMesa += qtd;
        if (telefonesLead.has(tel)) leadsMesa.add(tel);
      } else if (p.tipoEntrega === 'RETIRADA') {
        pedidosRetirada += qtd;
        if (telefonesLead.has(tel)) leadsRetirada.add(tel);
      }
    }

    return {
      totalLeads,
      convertidos,
      naoConvertidos: totalLeads - convertidos,
      taxaConversao: totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0,
      porOrigem,
      entrega: {
        leads: leadsEntrega.size,
        pedidos: pedidosEntrega,
      },
      mesa: {
        leads: leadsMesa.size,
        pedidos: pedidosMesa,
      },
      retirada: {
        leads: leadsRetirada.size,
        pedidos: pedidosRetirada,
      },
    };
  }

  async marcarConvertido(leadId: string) {
    return this.prisma.lead.update({
      where: { id: leadId },
      data: { converted: true, convertedAt: new Date() },
    });
  }

  async remover(id: string) {
    return this.prisma.lead.delete({ where: { id } });
  }
}
