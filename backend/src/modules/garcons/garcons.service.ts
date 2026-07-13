import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GarconsService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string) {
    return this.prisma.garcom.findMany({
      where: { vendedorId },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string) {
    const g = await this.prisma.garcom.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Garcom nao encontrado');
    return g;
  }

  async create(data: { vendedorId: string; nome: string; telefone?: string; diaria?: number }) {
    return this.prisma.garcom.create({ data });
  }

  async update(id: string, data: { nome?: string; telefone?: string; diaria?: number; ativo?: boolean }) {
    await this.findById(id);
    return this.prisma.garcom.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.garcom.delete({ where: { id } });
  }
}
