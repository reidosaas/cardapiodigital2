import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminEntregadoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const entregadores = await this.prisma.entregador.findMany({
      include: {
        lojas: {
          where: { ativo: true },
          include: {
            vendedor: { select: { id: true, nomeLoja: true, slug: true } },
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    const result = await Promise.all(
      entregadores.map(async (e) => {
        const lojasStats = await Promise.all(
          e.lojas.map(async (l) => {
            const entregasMes = await this.prisma.entrega.count({
              where: {
                entregadorId: e.id,
                pedido: { vendedorId: l.vendedorId },
                createdAt: { gte: inicioMes },
              },
            });
            const entreguesMes = await this.prisma.entrega.count({
              where: {
                entregadorId: e.id,
                pedido: { vendedorId: l.vendedorId },
                status: 'ENTREGUE',
                createdAt: { gte: inicioMes },
              },
            });
            const ganhoMes = entreguesMes * Number(l.valorPorEntrega);

            return {
              lojaId: l.vendedorId,
              nomeLoja: l.vendedor.nomeLoja,
              slug: l.vendedor.slug,
              diaria: l.diaria,
              valorPorEntrega: l.valorPorEntrega,
              entregasMes,
              entreguesMes,
              ganhoMes,
            };
          }),
        );

        const totalEntregasMes = lojasStats.reduce((s, l) => s + l.entregasMes, 0);
        const totalEntreguesMes = lojasStats.reduce((s, l) => s + l.entreguesMes, 0);
        const totalGanhoMes = lojasStats.reduce((s, l) => s + l.ganhoMes, 0);

        return {
          id: e.id,
          nome: e.nome,
          email: e.email,
          telefone: e.telefone,
          ativo: e.ativo,
          createdAt: e.createdAt,
          lojasStats,
          totalEntregasMes,
          totalEntreguesMes,
          totalGanhoMes,
        };
      }),
    );

    return result;
  }

  async stats() {
    const totalEntregadores = await this.prisma.entregador.count();
    const ativos = await this.prisma.entregador.count({ where: { ativo: true } });
    const vinculados = await this.prisma.entregadorLoja.count({ where: { ativo: true } });

    return { totalEntregadores, ativos, vinculados };
  }
}
