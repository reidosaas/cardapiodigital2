import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

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

  async create(data: { vendedorId: string; nome?: string; telefone?: string; diaria?: number; valorPorEntrega?: number; email?: string }) {
    const email = data.email?.trim()?.toLowerCase() || undefined;

    if (!email && !data.nome) {
      throw new Error('Informe o email ou o nome do entregador');
    }

    let entregador;

    if (email) {
      entregador = await this.prisma.entregador.findFirst({ where: { email } });
      if (entregador) {
        const vinculoExistente = await this.prisma.entregadorLoja.findFirst({
          where: { entregadorId: entregador.id, vendedorId: data.vendedorId },
        });
        if (vinculoExistente) {
          if (vinculoExistente.status === 'ACEITO') throw new ConflictException('Entregador ja vinculado a esta loja');
          if (vinculoExistente.status === 'PENDENTE') throw new ConflictException('Vinculo ja solicitado, aguardando aceite do entregador');
          if (vinculoExistente.status === 'RECUSADO') {
            await this.prisma.entregadorLoja.update({
              where: { id: vinculoExistente.id },
              data: { status: 'PENDENTE', ativo: true, diaria: data.diaria ?? 0, valorPorEntrega: data.valorPorEntrega ?? 0 },
            });
            return { ...entregador, vinculado: true, status: 'PENDENTE' };
          }
        }

        await this.prisma.entregadorLoja.create({
          data: {
            entregadorId: entregador.id,
            vendedorId: data.vendedorId,
            status: 'PENDENTE',
            diaria: data.diaria ?? 0,
            valorPorEntrega: data.valorPorEntrega ?? 0,
          },
        });
        return { ...entregador, vinculado: true, status: 'PENDENTE' };
      }
    }

    entregador = await this.prisma.entregador.create({
      data: {
        vendedorId: data.vendedorId,
        nome: data.nome || 'Entregador',
        telefone: data.telefone || undefined,
        email,
      },
    });

    await this.prisma.entregadorLoja.create({
      data: {
        entregadorId: entregador.id,
        vendedorId: data.vendedorId,
        status: 'PENDENTE',
        diaria: data.diaria ?? 0,
        valorPorEntrega: data.valorPorEntrega ?? 0,
      },
    });

    return { ...entregador, vinculado: true, status: 'PENDENTE' };
  }

  async update(id: string, data: { nome?: string; telefone?: string; diaria?: number; valorPorEntrega?: number; ativo?: boolean; senha?: string }) {
    await this.findById(id);
    const senha = data.senha?.trim() || undefined;

    const updateData: any = {};
    if (data.nome) updateData.nome = data.nome;
    if (data.telefone !== undefined) updateData.telefone = data.telefone || undefined;
    if (senha) updateData.senha = await bcrypt.hash(senha, 10);
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    const updated = await this.prisma.entregador.update({ where: { id }, data: updateData });

    if (data.diaria !== undefined || data.valorPorEntrega !== undefined) {
      const loja = await this.prisma.entregadorLoja.findFirst({ where: { entregadorId: id } });
      if (loja) {
        await this.prisma.entregadorLoja.update({
          where: { id: loja.id },
          data: {
            ...(data.diaria !== undefined && { diaria: data.diaria }),
            ...(data.valorPorEntrega !== undefined && { valorPorEntrega: data.valorPorEntrega }),
          },
        });
      }
    }

    return updated;
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

    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const vinculos = await this.prisma.entregadorLoja.findMany({
      where: { vendedorId, ativo: true },
      include: {
        entregador: true,
      },
    });

    if (vinculos.length === 0) return [];

    const entregadorIds = vinculos.map((v) => v.entregadorId);

    const statsRaw: any[] = await this.prisma.$queryRaw`
      SELECT
        e."id" AS "entregadorId",
        COUNT(en.id) FILTER (WHERE en."createdAt" >= ${inicioMes}) AS "totalEntregasMes",
        COUNT(en.id) FILTER (WHERE en."createdAt" >= ${inicioMes} AND en.status = 'ENTREGUE') AS "totalEntreguesMes",
        COUNT(en.id) FILTER (WHERE en."createdAt" >= ${inicioMes} AND en.status IN ('ACEITO','EM_ROTA')) AS "emAndamentoMes",
        COUNT(en.id) FILTER (WHERE en."createdAt" >= ${inicioHoje}) AS "totalHoje",
        COUNT(en.id) FILTER (WHERE en."createdAt" >= ${inicioHoje} AND en.status = 'ENTREGUE') AS "entreguesHoje",
        COUNT(en.id) FILTER (WHERE en."createdAt" >= ${inicioHoje} AND en.status IN ('ACEITO','EM_ROTA')) AS "emAndamentoHoje"
      FROM entregadores e
      LEFT JOIN entregas en ON en."entregadorId" = e.id
      WHERE e.id::text = ANY(${entregadorIds})
      GROUP BY e.id
    `;

    const statsMap = new Map<string, any>();
    for (const row of statsRaw) {
      statsMap.set(row.entregadorId, {
        totalEntregasMes: Number(row.totalEntregasMes),
        totalEntreguesMes: Number(row.totalEntreguesMes),
        emAndamentoMes: Number(row.emAndamentoMes),
        totalHoje: Number(row.totalHoje),
        entreguesHoje: Number(row.entreguesHoje),
        emAndamentoHoje: Number(row.emAndamentoHoje),
      });
    }

    return vinculos.map((v) => {
      const e = v.entregador;
      const s = statsMap.get(e.id) || { totalEntregasMes: 0, totalEntreguesMes: 0, emAndamentoMes: 0, totalHoje: 0, entreguesHoje: 0, emAndamentoHoje: 0 };
      return {
        ...e,
        diaria: v.diaria,
        valorPorEntrega: v.valorPorEntrega,
        lojaVinculoId: v.id,
        vinculoStatus: v.status,
        totalEntregasMes: s.totalEntregasMes,
        totalEntreguesMes: s.totalEntreguesMes,
        emAndamentoMes: s.emAndamentoMes,
        totalGanhoMes: s.totalEntreguesMes * Number(v.valorPorEntrega),
        totalHoje: s.totalHoje,
        entreguesHoje: s.entreguesHoje,
        emAndamentoHoje: s.emAndamentoHoje,
      };
    });
  }

  async checkin(entregadorId: string, vendedorId: string, observacao?: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vinculo = await this.prisma.entregadorLoja.findFirst({
      where: { entregadorId, vendedorId, ativo: true, status: 'ACEITO' },
    });

    if (!vinculo) {
      throw new Error('Vinculo nao encontrado ou nao aceito');
    }

    const checkinExistente = await this.prisma.entregadorCheckin.findFirst({
      where: {
        entregadorId,
        vendedorId,
        lojaId: vinculo.id,
        data: hoje,
      },
    });

    if (checkinExistente) {
      throw new Error('Ja fez check-in hoje');
    }

    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const entregasHoje = await this.prisma.entrega.findMany({
      where: {
        entregadorId,
        pedido: { vendedorId },
        status: 'ENTREGUE',
        entregueEm: { gte: inicioHoje },
      },
    });

    const totalEntregas = entregasHoje.length;
    const valorEntregas = totalEntregas * Number(vinculo.valorPorEntrega);
    const valorDiaria = Number(vinculo.diaria);
    const valorTotal = valorDiaria + valorEntregas;

    const checkin = await this.prisma.entregadorCheckin.create({
      data: {
        entregadorId,
        vendedorId,
        lojaId: vinculo.id,
        data: hoje,
        valorDiaria: vinculo.diaria,
        valorEntregas,
        valorTotal,
        totalEntregas,
        observacao,
      },
    });

    return { checkin, message: 'Check-in realizado com sucesso' };
  }

  async pagarEntregador(checkinId: string, vendedorId: string) {
    const checkin = await this.prisma.entregadorCheckin.findFirst({
      where: { id: checkinId, vendedorId },
    });

    if (!checkin) {
      throw new Error('Check-in nao encontrado');
    }

    if (checkin.pago) {
      throw new Error('Pagamento ja foi realizado');
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (checkin.data.getTime() !== hoje.getTime()) {
      throw new Error('So e possivel pagar check-ins de hoje');
    }

    const atualizado = await this.prisma.entregadorCheckin.update({
      where: { id: checkinId },
      data: {
        pago: true,
        pagoEm: new Date(),
      },
    });

    return { checkin: atualizado, message: 'Pagamento registrado com sucesso' };
  }

  async getCheckins(vendedorId: string, data?: string) {
    const where: any = { vendedorId };
    if (data) {
      const dataObj = new Date(data);
      dataObj.setHours(0, 0, 0, 0);
      where.data = dataObj;
    }

    return this.prisma.entregadorCheckin.findMany({
      where,
      include: {
        entregador: { select: { id: true, nome: true } },
      },
      orderBy: { checkinEm: 'desc' },
    });
  }

  async getEntregadoresParaPagar(vendedorId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vinculos = await this.prisma.entregadorLoja.findMany({
      where: { vendedorId, ativo: true, status: 'ACEITO' },
      include: { entregador: true },
    });

    if (vinculos.length === 0) return [];

    const entregadorIds = vinculos.map((v) => v.entregadorId);

    const statsRaw: any[] = await this.prisma.$queryRaw`
      SELECT
        e."id" AS "entregadorId",
        COUNT(en.id) FILTER (WHERE en.status = 'ENTREGUE' AND en."entregueEm" >= ${hoje}) AS "totalEntregasHoje",
        ec."pago" AS "pago",
        ec."pagoEm" AS "pagoEm",
        ec."id" AS "checkinId"
      FROM entregadores e
      LEFT JOIN entregas en ON en."entregadorId" = e.id AND en."pedidoId" IN (
        SELECT p.id FROM pedidos p WHERE p."vendedorId" = ${vendedorId}
      )
      LEFT JOIN entregador_checkins ec ON ec."entregadorId" = e.id AND ec."vendedorId" = ${vendedorId} AND ec.data = ${hoje}
      WHERE e.id::text = ANY(${entregadorIds})
      GROUP BY e.id, ec."pago", ec."pagoEm", ec."id"
    `;

    const statsMap = new Map<string, any>();
    for (const row of statsRaw) {
      statsMap.set(row.entregadorId, {
        totalEntregasHoje: Number(row.totalEntregasHoje),
        checkinId: row.checkinId || null,
        pago: row.pago || false,
        pagoEm: row.pagoEm || null,
      });
    }

    return vinculos.map((v) => {
      const e = v.entregador;
      const s = statsMap.get(e.id) || { totalEntregasHoje: 0, checkinId: null, pago: false, pagoEm: null };
      const valorEntregasHoje = s.totalEntregasHoje * Number(v.valorPorEntrega);
      const valorDiaria = Number(v.diaria);
      return {
        entregadorId: e.id,
        nome: e.nome,
        diaria: v.diaria,
        valorPorEntrega: v.valorPorEntrega,
        totalEntregasHoje: s.totalEntregasHoje,
        valorEntregasHoje,
        valorDiaria,
        valorTotalHoje: valorDiaria + valorEntregasHoje,
        checkin: s.checkinId ? { id: s.checkinId } : null,
        pago: s.pago,
        pagoEm: s.pagoEm,
      };
    });
  }
}
