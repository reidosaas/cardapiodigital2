import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntregasService {
  constructor(private prisma: PrismaService) {}

  async create(data: { pedidoId: string; endereco?: string; previsaoEntrega?: Date; observacao?: string }) {
    return this.prisma.entrega.create({ data });
  }

  async findByPedido(pedidoId: string) {
    return this.prisma.entrega.findMany({
      where: { pedidoId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(id: string, status: string) {
    const entrega = await this.prisma.entrega.findUnique({ where: { id } });
    if (!entrega) throw new NotFoundException('Entrega nao encontrada');

    const data: any = { status };
    if (status === 'ENTREGUE') data.entregueEm = new Date();

    return this.prisma.entrega.update({ where: { id }, data });
  }

  async getEntregasPendentes(vendedorId: string) {
    return this.prisma.entrega.findMany({
      where: {
        pedido: { vendedorId },
        status: { not: 'ENTREGUE' },
      },
      include: { pedido: { select: { id: true, clienteNome: true, total: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
