import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string, params?: { busca?: string }) {
    const where: any = { vendedorId };
    if (params?.busca) {
      where.OR = [
        { nome: { contains: params.busca, mode: 'insensitive' } },
        { telefone: { contains: params.busca } },
      ];
    }

    return this.prisma.cliente.findMany({
      where,
      include: { _count: { select: { pedidos: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        pedidos: { orderBy: { createdAt: 'desc' }, take: 10, include: { itens: true } },
        enderecos: true,
      },
    });
    if (!cliente) throw new NotFoundException('Cliente nao encontrado');
    return cliente;
  }

  async findByTelefone(vendedorId: string, telefone: string) {
    return this.prisma.cliente.findFirst({
      where: { vendedorId, telefone },
    });
  }

  async create(data: { vendedorId: string; nome: string; telefone?: string; email?: string; endereco?: string }) {
    return this.prisma.cliente.create({ data });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.cliente.update({ where: { id }, data });
  }

  async getTop(vendedorId: string, limit = 10) {
    return this.prisma.cliente.findMany({
      where: { vendedorId },
      orderBy: { totalCompras: 'desc' },
      take: limit,
    });
  }
}
