import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PedidoStatus } from '@prisma/client';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    private prisma: PrismaService,
    private assinaturasService: AssinaturasService,
    private leadsService: LeadsService,
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

    return this.prisma.pedido.create({
      data: {
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
  }

  async updateStatus(id: string, status: PedidoStatus) {
    await this.findById(id);
    return this.prisma.pedido.update({
      where: { id },
      data: { status },
      include: { itens: true, pagamento: true },
    });
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
