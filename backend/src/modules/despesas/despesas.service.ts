import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DespesasService {
  constructor(private prisma: PrismaService) {}

  async create(vendedorId: string, data: { descricao: string; valor: number; categoria?: string; data?: string }) {
    return this.prisma.despesa.create({
      data: {
        vendedorId,
        descricao: data.descricao,
        valor: data.valor,
        categoria: data.categoria,
        data: data.data ? new Date(data.data) : new Date(),
      },
    });
  }

  async findAll(vendedorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.despesa.findMany({
        where: { vendedorId },
        orderBy: { data: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.despesa.count({ where: { vendedorId } }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, vendedorId: string, data: { descricao?: string; valor?: number; categoria?: string; data?: string }) {
    const despesa = await this.prisma.despesa.findFirst({ where: { id, vendedorId } });
    if (!despesa) throw new NotFoundException('Despesa nao encontrada');
    return this.prisma.despesa.update({
      where: { id },
      data: {
        ...(data.descricao && { descricao: data.descricao }),
        ...(data.valor && { valor: data.valor }),
        ...(data.categoria !== undefined && { categoria: data.categoria }),
        ...(data.data && { data: new Date(data.data) }),
      },
    });
  }

  async remove(id: string, vendedorId: string) {
    const despesa = await this.prisma.despesa.findFirst({ where: { id, vendedorId } });
    if (!despesa) throw new NotFoundException('Despesa nao encontrada');
    return this.prisma.despesa.delete({ where: { id } });
  }

  async getDashboard(vendedorId: string) {
    const now = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesFim = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalMes, totalGeral, porCategoria, ultimas] = await Promise.all([
      this.prisma.despesa.aggregate({
        where: { vendedorId, data: { gte: mesInicio, lte: mesFim } },
        _sum: { valor: true },
      }),
      this.prisma.despesa.aggregate({
        where: { vendedorId },
        _sum: { valor: true },
      }),
      this.prisma.despesa.groupBy({
        by: ['categoria'],
        where: { vendedorId, data: { gte: mesInicio, lte: mesFim } },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.despesa.findMany({
        where: { vendedorId },
        orderBy: { data: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalMes: totalMes._sum.valor || 0,
      totalGeral: totalGeral._sum.valor || 0,
      porCategoria: porCategoria.map((c) => ({
        categoria: c.categoria || 'Sem categoria',
        total: c._sum.valor || 0,
        quantidade: c._count,
      })),
      ultimasDespesas: ultimas,
    };
  }
}