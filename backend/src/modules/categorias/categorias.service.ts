import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string) {
    return this.prisma.categoria.findMany({
      where: { vendedorId },
      include: { _count: { select: { produtos: true } } },
      orderBy: { ordem: 'asc' },
    });
  }

  async findById(id: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: { produtos: { where: { ativo: true } } },
    });
    if (!categoria) throw new NotFoundException('Categoria nao encontrada');
    return categoria;
  }

  async create(data: { vendedorId: string; nome: string; descricao?: string; icone?: string }) {
    const count = await this.prisma.categoria.count({ where: { vendedorId: data.vendedorId } });
    return this.prisma.categoria.create({
      data: { ...data, ordem: count },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.categoria.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.categoria.delete({ where: { id } });
  }

  async reorder(items: { id: string; ordem: number }[]) {
    for (const item of items) {
      await this.prisma.categoria.update({
        where: { id: item.id },
        data: { ordem: item.ordem },
      });
    }
    return { success: true };
  }
}
