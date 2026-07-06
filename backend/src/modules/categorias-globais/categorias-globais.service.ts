import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriasGlobaisService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.categoriaGlobal.findMany({
      include: { _count: { select: { produtos: true } } },
      orderBy: { ordem: 'asc' },
    });
  }

  async findById(id: string) {
    const cat = await this.prisma.categoriaGlobal.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria global nao encontrada');
    return cat;
  }

  async create(data: { nome: string; descricao?: string; icone?: string }) {
    const count = await this.prisma.categoriaGlobal.count();
    return this.prisma.categoriaGlobal.create({
      data: { ...data, ordem: count },
    });
  }

  async update(id: string, data: { nome?: string; descricao?: string; icone?: string; ordem?: number; ativo?: boolean }) {
    await this.findById(id);
    return this.prisma.categoriaGlobal.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.categoriaGlobal.delete({ where: { id } });
  }

  async reorder(items: { id: string; ordem: number }[]) {
    for (const item of items) {
      await this.prisma.categoriaGlobal.update({
        where: { id: item.id },
        data: { ordem: item.ordem },
      });
    }
    return { success: true };
  }
}
