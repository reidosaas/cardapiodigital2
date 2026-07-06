import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceiroService {
  constructor(private prisma: PrismaService) {}

  async getResumo(vendedorId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

    const [faturamentoHoje, faturamentoMes, faturamentoMesPassado, pedidosMes, totalComissoes] =
      await Promise.all([
        this.prisma.pedido.aggregate({
          where: { vendedorId, createdAt: { gte: hoje }, status: { not: 'CANCELADO' } },
          _sum: { total: true },
        }),
        this.prisma.pedido.aggregate({
          where: { vendedorId, createdAt: { gte: mesAtual }, status: { not: 'CANCELADO' } },
          _sum: { total: true },
        }),
        this.prisma.pedido.aggregate({
          where: { vendedorId, createdAt: { gte: mesPassado, lt: mesAtual }, status: { not: 'CANCELADO' } },
          _sum: { total: true },
        }),
        this.prisma.pedido.groupBy({
          by: ['status'],
          where: { vendedorId, createdAt: { gte: mesAtual } },
          _count: true,
        }),
        this.prisma.assinatura.findUnique({ where: { vendedorId }, select: { preco: true } }),
      ]);

    return {
      faturamentoHoje: faturamentoHoje._sum.total || 0,
      faturamentoMes: faturamentoMes._sum.total || 0,
      faturamentoMesPassado: faturamentoMesPassado._sum.total || 0,
      pedidosPorStatus: pedidosMes,
      comissao: totalComissoes?.preco || 0,
    };
  }

  async getExtrato(vendedorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where: { vendedorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { pagamento: { select: { status: true, metodo: true } } },
      }),
      this.prisma.pedido.count({ where: { vendedorId } }),
    ]);

    return {
      data: pedidos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMetodosPagamento(vendedorId: string) {
    const pagamentos = await this.prisma.pagamento.findMany({
      where: { pedido: { vendedorId }, status: 'APROVADO' },
      select: { metodo: true, valor: true },
    });

    const metodos: Record<string, number> = {};
    for (const p of pagamentos) {
      metodos[p.metodo] = (metodos[p.metodo] || 0) + Number(p.valor);
    }

    return metodos;
  }
}
