import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CaixaService {
  constructor(private prisma: PrismaService) {}

  async fechar(vendedorId: string) {
    const ultimoCaixa = await this.prisma.caixa.findFirst({
      where: { vendedorId },
      orderBy: { dataFim: 'desc' },
    });

    const dataInicio = ultimoCaixa?.dataFim || new Date(new Date().setHours(0, 0, 0, 0));

    const pedidos = await this.prisma.pedido.findMany({
      where: {
        vendedorId,
        createdAt: { gte: dataInicio },
      },
      include: {
        itens: true,
        pagamento: true,
        entregas: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const entregas = await this.prisma.entrega.findMany({
      where: {
        pedido: { vendedorId },
        createdAt: { gte: dataInicio },
      },
      include: {
        entregador: { select: { id: true, nome: true, valorPorEntrega: true } },
      },
    });

    const despesas = await this.prisma.despesa.findMany({
      where: {
        vendedorId,
        data: { gte: dataInicio },
      },
    });

    const pedidosFinalizados = pedidos.filter(
      (p) => p.status === 'ENTREGUE' || p.status === 'CANCELADO',
    );

    const pedidosAtivos = pedidos.filter(
      (p) => p.status !== 'ENTREGUE' && p.status !== 'CANCELADO',
    );

    const totalVendas = pedidosFinalizados
      .filter((p) => p.status === 'ENTREGUE')
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    const totalDespesas = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);

    const totalGanhosEntregas = entregas
      .filter((e) => e.status === 'ENTREGUE')
      .reduce((acc, e) => acc + Number(e.entregador?.valorPorEntrega || 0), 0);

    const totalPedidos = pedidosFinalizados.filter((p) => p.status === 'ENTREGUE').length;
    const totalEntregas = entregas.filter((e) => e.status === 'ENTREGUE').length;
    const totalCancelados = pedidos.filter((p) => p.status === 'CANCELADO').length;

    const resumo = {
      vendas: pedidosFinalizados
        .filter((p) => p.status === 'ENTREGUE')
        .map((p) => ({
          id: p.id,
          codigo: p.codigo,
          cliente: p.clienteNome || 'Anonimo',
          total: Number(p.total),
          pagamento: p.pagamento?.forma || 'N/A',
        })),
      entregas: entregas
        .filter((e) => e.status === 'ENTREGUE')
        .map((e) => ({
          id: e.id,
          entregador: e.entregador?.nome || e.entregadorNome || 'Terceirizado',
          ganho: Number(e.entregador?.valorPorEntrega || 0),
        })),
      despesas: despesas.map((d) => ({
        id: d.id,
        descricao: d.descricao,
        valor: Number(d.valor),
        categoria: d.categoria || 'Sem categoria',
      })),
    };

    const caixa = await this.prisma.caixa.create({
      data: {
        vendedorId,
        dataInicio,
        dataFim: new Date(),
        totalVendas,
        totalDespesas,
        totalGanhos: totalGanhosEntregas,
        totalPedidos,
        totalEntregas,
        totalCancelados,
        pedidosIds: pedidosFinalizados.map((p) => p.id),
        resumo,
      },
    });

    return {
      caixa,
      pedidosAtivos: pedidosAtivos.length,
      mensagem: `Caixa fechado com ${totalPedidos} pedidos, ${totalEntregas} entregas e ${totalCancelados} cancelados.`,
    };
  }

  async historico(vendedorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.caixa.findMany({
        where: { vendedorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.caixa.count({ where: { vendedorId } }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async ultimo(vendedorId: string) {
    return this.prisma.caixa.findFirst({
      where: { vendedorId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
