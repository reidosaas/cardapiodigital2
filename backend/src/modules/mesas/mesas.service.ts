import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type MesaStatus = 'DISPONIVEL' | 'EM_CONSUMO' | 'PEDIU_CONTA';

@Injectable()
export class MesasService {
  constructor(private prisma: PrismaService) {}

  async create(vendedorId: string, nome: string) {
    const existing = await this.prisma.mesa.findUnique({
      where: { vendedorId_nome: { vendedorId, nome } },
    });
    if (existing) throw new ConflictException('Mesa ja existe');
    return this.prisma.mesa.create({ data: { vendedorId, nome } });
  }

  async findAll(vendedorId: string) {
    return this.prisma.mesa.findMany({
      where: { vendedorId },
      orderBy: { nome: 'asc' },
      include: {
        pedidos: {
          where: {
            status: { notIn: ['ENTREGUE', 'CANCELADO'] },
          },
          include: { itens: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async rename(id: string, vendedorId: string, nome: string) {
    const mesa = await this.prisma.mesa.findFirst({ where: { id, vendedorId } });
    if (!mesa) throw new NotFoundException('Mesa nao encontrada');
    const conflict = await this.prisma.mesa.findUnique({
      where: { vendedorId_nome: { vendedorId, nome } },
    });
    if (conflict && conflict.id !== id) throw new ConflictException('Nome ja em uso');
    return this.prisma.mesa.update({ where: { id }, data: { nome } });
  }

  async remove(id: string, vendedorId: string) {
    const mesa = await this.prisma.mesa.findFirst({ where: { id, vendedorId } });
    if (!mesa) throw new NotFoundException('Mesa nao encontrada');
    return this.prisma.mesa.delete({ where: { id } });
  }

  async toggle(id: string, vendedorId: string) {
    const mesa = await this.prisma.mesa.findFirst({ where: { id, vendedorId } });
    if (!mesa) throw new NotFoundException('Mesa nao encontrada');
    const newStatus = mesa.status === 'DISPONIVEL' ? 'EM_CONSUMO' as any : 'DISPONIVEL' as any;
    return this.prisma.mesa.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async setStatus(id: string, vendedorId: string, status: MesaStatus) {
    const mesa = await this.prisma.mesa.findFirst({ where: { id, vendedorId } });
    if (!mesa) throw new NotFoundException('Mesa nao encontrada');
    return this.prisma.mesa.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async liberar(id: string, vendedorId: string) {
    const mesa = await this.prisma.mesa.findFirst({ where: { id, vendedorId } });
    if (!mesa) throw new NotFoundException('Mesa nao encontrada');
    return this.prisma.mesa.update({
      where: { id },
      data: { status: 'DISPONIVEL' as any },
    });
  }

  async getPedidos(id: string, vendedorId: string) {
    const mesa = await this.prisma.mesa.findFirst({ where: { id, vendedorId } });
    if (!mesa) throw new NotFoundException('Mesa nao encontrada');
    return this.prisma.pedido.findMany({
      where: {
        mesaId: id,
        status: { notIn: ['ENTREGUE', 'CANCELADO'] },
      },
      include: { itens: true, pagamento: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
