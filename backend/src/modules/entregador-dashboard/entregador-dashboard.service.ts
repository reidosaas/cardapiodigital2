import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntregadorDashboardService {
  constructor(private prisma: PrismaService) {}

  private async getVendedorIds(entregadorId: string, vendedorId?: string): Promise<string[]> {
    if (vendedorId) return [vendedorId];
    const vinculos = await this.prisma.entregadorLoja.findMany({
      where: { entregadorId, ativo: true, status: 'ACEITO' },
      select: { vendedorId: true },
    });
    return vinculos.map((v: any) => v.vendedorId);
  }

  async getPedidos(entregadorId: string, vendedorId: string) {
    const vendedorIds = await this.getVendedorIds(entregadorId, vendedorId);
    if (vendedorIds.length === 0) return { ativas: [], historico: [] };

    const pedidosLoja = await this.prisma.pedido.findMany({
      where: { vendedorId: { in: vendedorIds } },
      select: { id: true },
    });
    const pedidoIds = pedidosLoja.map((p: any) => p.id);

    const entregas = await this.prisma.entrega.findMany({
      where: {
        entregadorId,
        pedidoId: { in: pedidoIds },
        status: { notIn: ['ENTREGUE', 'CANCELADO'] },
      },
      include: {
        pedido: {
          include: {
            itens: true,
            pagamento: true,
            cliente: { select: { id: true, nome: true, telefone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const entregasHistorico = await this.prisma.entrega.findMany({
      where: {
        entregadorId,
        pedidoId: { in: pedidoIds },
        status: { in: ['ENTREGUE', 'CANCELADO'] },
      },
      include: {
        pedido: {
          include: {
            itens: true,
            pagamento: true,
            cliente: { select: { id: true, nome: true, telefone: true } },
          },
        },
      },
      orderBy: { entregueEm: 'desc' },
      take: 20,
    });

    const vinculos = await this.prisma.entregadorLoja.findMany({
      where: { entregadorId, ativo: true, status: 'ACEITO' },
      select: { vendedorId: true, valorPorEntrega: true },
    });
    const valorPorVendedor = new Map<string, number>(
      vinculos.map((v: any) => [v.vendedorId, Number(v.valorPorEntrega)]),
    );

    const formatar = (e: any) => {
      const valorVinculo = valorPorVendedor.get(e.pedido.vendedorId) ?? 0;
      const valorReceber = e.valorEntrega != null ? Number(e.valorEntrega) : valorVinculo;
      const rua = e.pedido.rua || '';
      const numero = e.pedido.numero || '';
      const bairro = e.pedido.bairro || '';
      const complemento = e.pedido.complemento || '';
      const enderecoCompleto = e.endereco || e.pedido.enderecoEntrega || [rua, numero ? `, ${numero}` : '', bairro ? ` - ${bairro}` : ''].filter(Boolean).join('') || e.pedido.clienteEndereco || '';
      return {
        id: e.id,
        pedidoId: e.pedidoId,
        codigoPedido: e.pedido.codigo,
        status: e.status,
        endereco: enderecoCompleto,
        valorEntrega: valorReceber,
        valorCobrado: e.valorCobrado,
        criadoEm: e.createdAt,
        aceitoEm: e.aceitoEm,
        saiuEm: e.saiuEm,
        entregueEm: e.entregueEm,
        bairro,
        numero,
        rua,
        complemento,
        pedido: {
          id: e.pedido.id,
          codigo: e.pedido.codigo,
          status: e.pedido.status,
          total: e.pedido.total,
          observacao: e.pedido.observacao,
          enderecoEntrega: e.pedido.enderecoEntrega,
          clienteEndereco: e.pedido.clienteEndereco,
          rua,
          numero,
          bairro,
          complemento,
          cliente: e.pedido.cliente,
          itens: e.pedido.itens,
          pagamento: e.pedido.pagamento,
        },
      };
    };

    const ativas = entregas.map(formatar);
    const historico = entregasHistorico.map(formatar);

    ativas.sort((a, b) => {
      const bA = (a.bairro || '').toLowerCase();
      const bB = (b.bairro || '').toLowerCase();
      if (bA < bB) return -1;
      if (bA > bB) return 1;
      const nA = parseInt(a.numero || '0') || 0;
      const nB = parseInt(b.numero || '0') || 0;
      return nA - nB;
    });

    const comRota = ativas.map((e, i) => ({ ...e, rotaOrdem: i + 1 }));

    return { ativas: comRota, historico };
  }

  async getGanhos(entregadorId: string, vendedorId: string, periodo?: string) {
    const hoje = new Date();
    const vendedorIds = await this.getVendedorIds(entregadorId, vendedorId);
    if (vendedorIds.length === 0) return { periodo, totalEntregas: 0, valorEntregas: 0, diaria: 0, valorPorEntrega: 0, totalGanhos: 0, entregas: [] };
    let inicio: Date;

    switch (periodo) {
      case 'hoje':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        break;
      case 'semana':
        inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - 7);
        break;
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      default:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    }

    const pedidosLoja = await this.prisma.pedido.findMany({
      where: { vendedorId: { in: vendedorIds } },
      select: { id: true },
    });
    const pedidoIds = pedidosLoja.map((p: any) => p.id);

    const entregas = await this.prisma.entrega.findMany({
      where: {
        entregadorId,
        pedidoId: { in: pedidoIds },
        status: 'ENTREGUE',
        entregueEm: { gte: inicio },
      },
    });

    const loja = await this.prisma.entregadorLoja.findFirst({
      where: { entregadorId, vendedorId: { in: vendedorIds }, ativo: true },
    });

    const totalEntregas = entregas.length;
    const valorEntregas = entregas.reduce(
      (acc, e) => acc + (Number(e.valorEntrega) || 0),
      0,
    );
    const diaria = loja ? Number(loja.diaria) : 0;
    const diasTrabalhados = this.contarDiasTrabalhados(entregas);
    const totalDiarias = diaria * diasTrabalhados;
    const totalGanhos = valorEntregas + totalDiarias;

    const jaRecebido = await this.somarPago(entregadorId, vendedorIds, inicio);
    const aReceber = Math.max(totalGanhos - jaRecebido, 0);

    return {
      periodo,
      totalEntregas,
      valorEntregas,
      diaria,
      diasTrabalhados,
      totalDiarias,
      valorPorEntrega: loja ? Number(loja.valorPorEntrega) : 0,
      totalGanhos,
      jaRecebido,
      aReceber,
      entregas: entregas.map((e) => ({
        id: e.id,
        pedidoId: e.pedidoId,
        valorEntrega: e.valorEntrega,
        entregueEm: e.entregueEm,
      })),
    };
  }

  private contarDiasTrabalhados(entregas: { entregueEm: Date | null }[]): number {
    const dias = new Set<string>();
    for (const e of entregas) {
      if (e.entregueEm) {
        const d = new Date(e.entregueEm);
        dias.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    }
    return dias.size;
  }

  private async somarPago(
    entregadorId: string,
    vendedorIds: string[],
    inicio: Date,
    fim?: Date,
  ): Promise<number> {
    const checkins = await this.prisma.entregadorCheckin.findMany({
      where: {
        entregadorId,
        vendedorId: { in: vendedorIds },
        pago: true,
        data: fim ? { gte: inicio, lte: fim } : { gte: inicio },
      },
      select: { valorTotal: true },
    });
    return checkins.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
  }

  async getRelatorio(entregadorId: string, vendedorId: string, dataInicio: string, dataFim: string) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const vendedorIds = await this.getVendedorIds(entregadorId, vendedorId);
    if (vendedorIds.length === 0) return { dataInicio, dataFim, totalEntregas: 0, valorEntregas: 0, diaria: 0, valorPorEntrega: 0, totalGanhos: 0, entregas: [] };

    const pedidosLoja = await this.prisma.pedido.findMany({
      where: { vendedorId: { in: vendedorIds } },
      select: { id: true },
    });
    const pedidoIds = pedidosLoja.map((p: any) => p.id);

    const entregas = await this.prisma.entrega.findMany({
      where: {
        entregadorId,
        pedidoId: { in: pedidoIds },
        status: 'ENTREGUE',
        entregueEm: { gte: inicio, lte: fim },
      },
      include: {
        pedido: { select: { total: true, codigo: true } },
      },
      orderBy: { entregueEm: 'asc' },
    });

    const loja = await this.prisma.entregadorLoja.findFirst({
      where: { entregadorId, vendedorId: { in: vendedorIds }, ativo: true },
    });

    const diaria = loja ? Number(loja.diaria) : 0;
    const totalEntregas = entregas.length;
    const valorEntregas = entregas.reduce((acc, e) => acc + (Number(e.valorEntrega) || 0), 0);
    const diasTrabalhados = this.contarDiasTrabalhados(entregas);
    const totalDiarias = diaria * diasTrabalhados;
    const totalGanhos = valorEntregas + totalDiarias;

    const jaRecebido = await this.somarPago(entregadorId, vendedorIds, inicio, fim);
    const aReceber = Math.max(totalGanhos - jaRecebido, 0);

    return {
      dataInicio,
      dataFim,
      totalEntregas,
      valorEntregas,
      diaria,
      diasTrabalhados,
      totalDiarias,
      valorPorEntrega: loja ? Number(loja.valorPorEntrega) : 0,
      totalGanhos,
      jaRecebido,
      aReceber,
      entregas: entregas.map((e) => ({
        id: e.id,
        codigo: e.pedido.codigo,
        valorEntrega: e.valorEntrega,
        entregueEm: e.entregueEm,
      })),
    };
  }

  async updateStatus(entregaId: string, status: string, entregadorId: string) {
    const entrega = await this.prisma.entrega.findUnique({ 
      where: { id: entregaId },
      include: { pedido: { select: { vendedorId: true } } }
    });
    if (!entrega) throw new NotFoundException('Entrega nao encontrada');
    if (entrega.entregadorId !== entregadorId) throw new ForbiddenException('Acesso negado');

    const now = new Date();
    const updateData: any = { status };

    switch (status) {
      case 'ACEITO':
        updateData.aceitoEm = now;
        break;
      case 'EM_ROTA':
        updateData.saiuEm = now;
        break;
      case 'ENTREGUE':
        updateData.entregueEm = now;
        // Definir valor da entrega baseado no vinculo ativo (sempre atualiza ao concluir)
        const vinculo = await this.prisma.entregadorLoja.findFirst({
          where: { entregadorId, vendedorId: entrega.pedido.vendedorId, ativo: true, status: 'ACEITO' },
        });
        if (vinculo) {
          updateData.valorEntrega = Number(vinculo.valorPorEntrega);
        }
        break;
    }

    const updated = await this.prisma.entrega.update({
      where: { id: entregaId },
      data: updateData,
    });

    if (status === 'ENTREGUE') {
      await this.prisma.pedido.update({
        where: { id: entrega.pedidoId },
        data: { status: 'ENTREGUE' },
      });
    }

    return updated;
  }

  async getStats(entregadorId: string, vendedorId: string) {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const vendedorIds = await this.getVendedorIds(entregadorId, vendedorId);
    if (vendedorIds.length === 0) return { totalEntregasHoje: 0, pendentes: 0, emRota: 0, entreguesHoje: 0, diaria: 0, valorPorEntrega: 0 };

    const pedidosLoja = await this.prisma.pedido.findMany({
      where: { vendedorId: { in: vendedorIds } },
      select: { id: true },
    });
    const pedidoIds = pedidosLoja.map((p: any) => p.id);

    const [totalEntregasHoje, pendentes, emRota, entreguesHoje] = await Promise.all([
      this.prisma.entrega.count({
        where: { entregadorId, pedidoId: { in: pedidoIds }, status: 'ENTREGUE', entregueEm: { gte: inicioHoje } },
      }),
      this.prisma.entrega.count({
        where: { entregadorId, pedidoId: { in: pedidoIds }, status: 'PENDENTE' },
      }),
      this.prisma.entrega.count({
        where: { entregadorId, pedidoId: { in: pedidoIds }, status: { in: ['ACEITO', 'EM_ROTA'] } },
      }),
      this.prisma.entrega.count({
        where: { entregadorId, pedidoId: { in: pedidoIds }, status: 'ENTREGUE', entregueEm: { gte: inicioHoje } },
      }),
    ]);

    const loja = await this.prisma.entregadorLoja.findFirst({
      where: { entregadorId, vendedorId: { in: vendedorIds }, ativo: true },
    });

    return {
      totalEntregasHoje,
      pendentes,
      emRota,
      entreguesHoje,
      diaria: loja ? Number(loja.diaria) : 0,
      valorPorEntrega: loja ? Number(loja.valorPorEntrega) : 0,
    };
  }

  async getVinculos(entregadorId: string) {
    const vinculos = await this.prisma.entregadorLoja.findMany({
      where: { entregadorId },
      include: {
        vendedor: { select: { id: true, nomeLoja: true, slug: true, endereco: true, cidade: true, estado: true, cep: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vinculos.map((v) => ({
      id: v.id,
      status: v.status,
      diaria: v.diaria,
      valorPorEntrega: v.valorPorEntrega,
      createdAt: v.createdAt,
      loja: {
        id: v.vendedor.id,
        nomeLoja: v.vendedor.nomeLoja,
        slug: v.vendedor.slug,
        endereco: v.vendedor.endereco,
        cidade: v.vendedor.cidade,
        estado: v.vendedor.estado,
        cep: v.vendedor.cep,
      },
    }));
  }

  async aceitarVinculo(vinculoId: string, entregadorId: string) {
    const vinculo = await this.prisma.entregadorLoja.findUnique({ where: { id: vinculoId } });
    if (!vinculo) throw new NotFoundException('Vinculo nao encontrado');
    if (vinculo.entregadorId !== entregadorId) throw new ForbiddenException('Acesso negado');
    if (vinculo.status !== 'PENDENTE') throw new ForbiddenException('Vinculo ja foi processado');

    return this.prisma.entregadorLoja.update({
      where: { id: vinculoId },
      data: { status: 'ACEITO' },
    });
  }

  async recusarVinculo(vinculoId: string, entregadorId: string) {
    const vinculo = await this.prisma.entregadorLoja.findUnique({ where: { id: vinculoId } });
    if (!vinculo) throw new NotFoundException('Vinculo nao encontrado');
    if (vinculo.entregadorId !== entregadorId) throw new ForbiddenException('Acesso negado');
    if (vinculo.status !== 'PENDENTE') throw new ForbiddenException('Vinculo ja foi processado');

    return this.prisma.entregadorLoja.update({
      where: { id: vinculoId },
      data: { status: 'RECUSADO', ativo: false },
    });
  }
}
