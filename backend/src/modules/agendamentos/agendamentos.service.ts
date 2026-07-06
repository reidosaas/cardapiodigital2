import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgendamentosService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string, params?: { data?: string; status?: string }) {
    const where: any = { vendedorId };
    if (params?.data) {
      const data = new Date(params.data);
      const nextDay = new Date(data);
      nextDay.setDate(nextDay.getDate() + 1);
      where.data = { gte: data, lt: nextDay };
    }
    if (params?.status) where.status = params.status;

    return this.prisma.agendamento.findMany({
      where,
      include: { pedido: { select: { id: true, total: true } } },
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
    });
  }

  async findById(id: string) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: { pedido: true, cliente: true },
    });
    if (!agendamento) throw new NotFoundException('Agendamento nao encontrado');
    return agendamento;
  }

  async create(data: {
    vendedorId: string;
    clienteNome: string;
    clienteTelefone?: string;
    data: Date;
    hora: string;
    tipo?: string;
    observacao?: string;
    clienteId?: string;
    pedidoId?: string;
  }) {
    return this.prisma.agendamento.create({ data });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.agendamento.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async getHorariosDisponiveis(vendedorId: string, data: string) {
    const vendedor = await this.prisma.vendedor.findUnique({
      where: { id: vendedorId },
      select: { horarioFuncionamento: true, diasFuncionamento: true, tempoPreparoMin: true },
    });

    const date = new Date(data);
    const diaSemana = date.getDay();
    const dias = vendedor?.diasFuncionamento as any;
    const horarios = vendedor?.horarioFuncionamento as any;

    if (dias && !dias[diaSemana]) {
      return { disponiveis: [], message: 'Nao funcionamos neste dia' };
    }

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        vendedorId,
        data: { gte: date, lt: new Date(date.getTime() + 86400000) },
        status: { not: 'CANCELADO' },
      },
      select: { hora: true },
    });

    const horariosOcupados = agendamentos.map((a) => a.hora);

    const horariosDisponiveis = [];
    if (horarios?.abertura && horarios?.fechamento) {
      const [hAbertura, mAbertura] = horarios.abertura.split(':').map(Number);
      const [hFechamento, mFechamento] = horarios.fechamento.split(':').map(Number);
      const intervalo = vendedor?.tempoPreparoMin || 30;

      let horaAtual = hAbertura * 60 + mAbertura;
      const horaFim = hFechamento * 60 + mFechamento;

      while (horaAtual < horaFim) {
        const h = Math.floor(horaAtual / 60).toString().padStart(2, '0');
        const m = (horaAtual % 60).toString().padStart(2, '0');
        const horarioStr = `${h}:${m}`;

        if (!horariosOcupados.includes(horarioStr)) {
          horariosDisponiveis.push(horarioStr);
        }

        horaAtual += intervalo;
      }
    }

    return { disponiveis: horariosDisponiveis };
  }
}
