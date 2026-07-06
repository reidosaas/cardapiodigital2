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
