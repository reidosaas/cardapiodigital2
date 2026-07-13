import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PedidoStatus } from '@prisma/client';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { CuponsService } from '../cupons/cupons.service';
import { LeadsService } from '../leads/leads.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMADO: 'Seu pedido foi confirmado! Ja estamos preparando tudo com muito carinho.',
  PREPARANDO: 'Seu pedido esta sendo preparado. Em breve estara pronto!',
  SAIU_PARA_ENTREGA: 'Seu pedido saiu para entrega! Fique atento.',
  ENTREGUE: 'Seu pedido foi entregue! Obrigado pela preferencia. Volte sempre!',
  CANCELADO: 'Seu pedido foi cancelado. Se tiver duvidas, entre em contato conosco.',
};

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    private prisma: PrismaService,
    private assinaturasService: AssinaturasService,
    private cuponsService: CuponsService,
    private leadsService: LeadsService,
    @Inject(forwardRef(() => WhatsAppService)) private whatsappService: WhatsAppService,
  ) {}

  async findAll(vendedorId: string, params?: { status?: string; clienteId?: string }) {
    const where: any = { vendedorId };
    if (params?.status) where.status = params.status;
    if (params?.clienteId) where.clienteId = params.clienteId;

    return this.prisma.pedido.findMany({
      where,
      include: {
        itens: true,
        pagamento: true,
        cliente: { select: { id: true, nome: true, telefone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: true,
        pagamento: true,
        cliente: true,
        cupom: true,
        entregas: true,
        agendamento: true,
      },
    });
    if (!pedido) throw new NotFoundException('Pedido nao encontrado');
    return pedido;
  }

  async create(data: {
    vendedorId: string;
    clienteId?: string;
    clienteNome?: string;
    clienteTelefone?: string;
    items: any[];
    total: number;
    taxaEntrega?: number;
    observacao?: string;
    tipoEntrega?: string;
    enderecoEntrega?: string;
    origem?: string;
    conversationId?: string;
    mesaId?: string;
    cupomId?: string;
  }) {
    await this.assinaturasService.verificarLimites(data.vendedorId, 'pedido');

    if (data.clienteNome && data.clienteTelefone) {
      try {
        await this.leadsService.upsert({
          vendedorId: data.vendedorId,
          nome: data.clienteNome,
          telefone: data.clienteTelefone,
          origem: data.origem || 'catalogo',
          ultimaMensagem: `Pedido realizado via ${data.origem || 'catalogo'}`,
        });
      } catch (e) {
        this.logger.error(`Erro ao criar lead para pedido: ${e.message}`);
      }
    }

    const pedido = await this.prisma.$transaction(async (tx) => {
      const vendedor = await tx.vendedor.update({
        where: { id: data.vendedorId },
        data: { ultimoCodigoPedido: { increment: 1 } },
      });
      return tx.pedido.create({
        data: {
          codigo: vendedor.ultimoCodigoPedido,
          vendedorId: data.vendedorId,
          clienteId: data.clienteId,
          clienteNome: data.clienteNome,
          clienteTelefone: data.clienteTelefone,
          total: data.total,
          taxaEntrega: data.taxaEntrega || 0,
          observacao: data.observacao,
          tipoEntrega: data.tipoEntrega as any || 'ENTREGA',
          enderecoEntrega: data.enderecoEntrega,
          origem: data.origem || 'catalogo',
          conversationId: data.conversationId,
          mesaId: data.mesaId,
          cupomId: data.cupomId,
          itens: {
            create: data.items.map((item: any) => ({
              produtoId: item.produtoId,
              nome: item.nome,
              quantidade: item.quantidade || 1,
              precoUnitario: item.precoUnitario,
              total: item.total || item.precoUnitario * (item.quantidade || 1),
              observacao: item.observacao,
              variacao: item.variacao,
            })),
          },
        },
        include: {
          itens: true,
          pagamento: true,
        },
      });
    });

    if (data.cupomId) {
      try {
        await this.cuponsService.usarCupom(data.cupomId);
      } catch (e) {
        this.logger.error(`Erro ao incrementar uso do cupom ${data.cupomId}: ${e.message}`);
      }
    }

    return pedido;
  }

  async updateStatus(id: string, status: PedidoStatus, entregadorId?: string, entregadorNome?: string) {
    const pedido = await this.findById(id);
    const updated = await this.prisma.pedido.update({
      where: { id },
      data: { status },
      include: { itens: true, pagamento: true },
    });

    if (status === 'SAIU_PARA_ENTREGA') {
      await this.prisma.entrega.create({
        data: {
          pedidoId: id,
          status: 'EM_ROTA',
          entregadorId: entregadorId || null,
          entregadorNome: entregadorNome || null,
          endereco: pedido.enderecoEntrega,
        },
      });
    }

    const msg = STATUS_MESSAGES[status];
    const telefone = pedido.clienteTelefone;
    if (msg && telefone) {
      try {
        const prefixo = `*${pedido.clienteNome || 'Cliente'}*`;
        const numPedido = pedido.codigo ? `#${String(pedido.codigo).padStart(8, '0')}` : `#${pedido.id.slice(0, 8)}`;
        await this.whatsappService.enviarMensagem(
          telefone,
          `${prefixo}, ${msg}\n\nPedido ${numPedido}`,
          pedido.vendedorId,
        );
        this.logger.log(`Notificacao de ${status} enviada para ${telefone}`);
      } catch (err) {
        this.logger.error(`Erro ao enviar notificacao de ${status} para ${telefone}: ${err.message}`);
      }
    }

    return updated;
  }

  async getFaturamento(vendedorId: string, dataInicio: Date, dataFim: Date) {
    const result = await this.prisma.pedido.aggregate({
      where: {
        vendedorId,
        createdAt: { gte: dataInicio, lte: dataFim },
        status: { not: 'CANCELADO' },
      },
      _sum: { total: true },
      _count: true,
    });

    return {
      total: result._sum.total || 0,
      quantidade: result._count,
    };
  }
}
