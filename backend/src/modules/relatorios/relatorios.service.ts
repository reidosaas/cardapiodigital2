import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  async getVendasPorPeriodo(vendedorId: string, inicio: Date, fim: Date) {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        vendedorId,
        createdAt: { gte: inicio, lte: fim },
        status: { not: 'CANCELADO' },
      },
      include: { itens: true, pagamento: true },
      orderBy: { createdAt: 'asc' },
    });

    const total = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
    const totalPedidos = pedidos.length;
    const ticketMedio = totalPedidos > 0 ? total / totalPedidos : 0;

    const vendasPorDia: Record<string, number> = {};
    for (const p of pedidos) {
      const dia = p.createdAt.toISOString().split('T')[0];
      vendasPorDia[dia] = (vendasPorDia[dia] || 0) + Number(p.total);
    }

    return { total, totalPedidos, ticketMedio, vendasPorDia, pedidos };
  }

  async getProdutosMaisVendidos(vendedorId: string, inicio: Date, fim: Date, limit = 10) {
    const itens = await this.prisma.itemPedido.groupBy({
      by: ['produtoId', 'nome'],
      where: {
        pedido: {
          vendedorId,
          createdAt: { gte: inicio, lte: fim },
          status: { not: 'CANCELADO' },
        },
      },
      _sum: { quantidade: true, total: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: limit,
    });

    return itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item._sum.quantidade || 0,
      total: item._sum.total || 0,
    }));
  }

  async getDashboardAdmin() {
    const [totalUsers, totalVendedores, totalPedidos, totalFaturamento, usersPorMes, pedidosPorStatus] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.vendedor.count(),
        this.prisma.pedido.count(),
        this.prisma.pedido.aggregate({
          where: { status: { not: 'CANCELADO' } },
          _sum: { total: true },
        }),
        this.prisma.user.groupBy({
          by: ['createdAt'],
          _count: true,
        }),
        this.prisma.pedido.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

    return {
      totalUsers,
      totalVendedores,
      totalPedidos,
      totalFaturamento: totalFaturamento._sum.total || 0,
      usersPorMes,
      pedidosPorStatus,
    };
  }
}
