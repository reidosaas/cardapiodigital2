import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntregadoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string) {
    return this.prisma.entregador.findMany({
      where: { vendedorId },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string) {
    const e = await this.prisma.entregador.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Entregador nao encontrado');
    return e;
  }

  async create(data: { vendedorId: string; nome: string; telefone?: string; diaria?: number; valorPorEntrega?: number }) {
    return this.prisma.entregador.create({ data });
  }

  async update(id: string, data: { nome?: string; telefone?: string; diaria?: number; valorPorEntrega?: number; ativo?: boolean }) {
    await this.findById(id);
    return this.prisma.entregador.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.entregador.delete({ where: { id } });
  }

  async relatorio(vendedorId: string, dataInicio?: string, dataFim?: string) {
    const inicio = dataInicio ? new Date(dataInicio) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fim = dataFim ? new Date(dataFim) : new Date();
    fim.setHours(23, 59, 59, 999);

    const entregas = await this.prisma.entrega.findMany({
      where: {
        pedido: { vendedorId },
        createdAt: { gte: inicio, lte: fim },
      },
      include: {
        pedido: { select: { id: true, codigo: true, clienteNome: true, total: true, tipoEntrega: true, status: true, enderecoEntrega: true } },
        entregador: { select: { id: true, nome: true, valorPorEntrega: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const agrupado: Record<string, { entregador: any; entregas: any[]; total: number; ganho: number }> = {};

    for (const e of entregas) {
      const key = e.entregadorId || 'terceirizado';
      if (!agrupado[key]) {
        agrupado[key] = {
          entregador: e.entregador || { id: 'terceirizado', nome: e.entregadorNome || 'Terceirizado', valorPorEntrega: 0 },
          entregas: [],
          total: 0,
          ganho: 0,
        };
      }
      agrupado[key].entregas.push(e);
      agrupado[key].total++;
      if (e.status === 'ENTREGUE') {
        agrupado[key].ganho += Number(e.entregador?.valorPorEntrega || 0);
      }
    }

    return Object.values(agrupado).sort((a, b) => b.entregas.length - a.entregas.length);
  }

  async relatorioEntregador(entregadorId: string, dataInicio?: string, dataFim?: string) {
    const entregador = await this.findById(entregadorId);

    const inicio = dataInicio ? new Date(dataInicio) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fim = dataFim ? new Date(dataFim) : new Date();
    fim.setHours(23, 59, 59, 999);

    const entregas = await this.prisma.entrega.findMany({
      where: {
        entregadorId,
        createdAt: { gte: inicio, lte: fim },
      },
      include: {
        pedido: {
          select: { id: true, codigo: true, clienteNome: true, total: true, tipoEntrega: true, status: true, enderecoEntrega: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const dias: Record<string, { date: Date; dia: string; entregas: any[]; total: number; ganho: number }> = {};
    for (const e of entregas) {
      const dia = new Date(e.createdAt).toLocaleDateString('pt-BR');
      if (!dias[dia]) {
        dias[dia] = { date: e.createdAt, dia, entregas: [], total: 0, ganho: 0 };
      }
      dias[dia].entregas.push(e);
      dias[dia].total++;
      if (e.status === 'ENTREGUE') {
        dias[dia].ganho += Number(entregador.valorPorEntrega);
      }
    }

    const diasArray = Object.values(dias).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalEntregas = entregas.length;
    const totalEntregues = entregas.filter((e) => e.status === 'ENTREGUE').length;
    const totalGanho = totalEntregues * Number(entregador.valorPorEntrega);
    const totalDiasTrabalhados = diasArray.length;
    const totalDiarias = totalDiasTrabalhados * Number(entregador.diaria);

    return {
      entregador,
      totalEntregas,
      totalEntregues,
      totalGanho,
      totalDiasTrabalhados,
      totalDiarias,
      dias: diasArray,
      entregas,
    };
  }

  async findAllWithStats(vendedorId: string) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const entregadores = await this.prisma.entregador.findMany({
      where: { vendedorId },
      orderBy: { nome: 'asc' },
    });

    const stats = await Promise.all(
      entregadores.map(async (e) => {
        const entregas = await this.prisma.entrega.findMany({
          where: {
            entregadorId: e.id,
            createdAt: { gte: inicioMes },
          },
        });
        const totalEntregues = entregas.filter((en) => en.status === 'ENTREGUE').length;
        const totalGanho = totalEntregues * Number(e.valorPorEntrega);
        return {
          ...e,
          totalEntregasMes: entregas.length,
          totalEntreguesMes: totalEntregues,
          totalGanhoMes: totalGanho,
        };
      }),
    );

    return stats;
  }
}
