import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';

@Injectable()
export class ProdutosService {
  constructor(
    private prisma: PrismaService,
    private assinaturasService: AssinaturasService,
  ) {}

  async findAll(vendedorId: string, params?: { categoriaId?: string; busca?: string; destaque?: boolean }) {
    const where: any = { vendedorId };

    if (params?.categoriaId) where.categoriaId = params.categoriaId;
    if (params?.destaque) where.destaque = true;
    if (params?.busca) {
      where.OR = [
        { nome: { contains: params.busca, mode: 'insensitive' } },
        { descricao: { contains: params.busca, mode: 'insensitive' } },
      ];
    }

    return this.prisma.produto.findMany({
      where,
      include: {
        categoria: { select: { id: true, nome: true, icone: true } },
        categoriaGlobal: { select: { id: true, nome: true, icone: true } },
        gruposAdicionais: {
          include: { opcoes: { where: { ativo: true }, orderBy: { ordem: 'asc' } } },
          orderBy: { ordem: 'asc' },
        },
        _count: { select: { avaliacoes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: true,
        gruposAdicionais: {
          include: { opcoes: { where: { ativo: true }, orderBy: { ordem: 'asc' } } },
          orderBy: { ordem: 'asc' },
        },
        avaliacoes: { include: { cliente: { select: { nome: true } } }, take: 10 },
      },
    });
    if (!produto) throw new NotFoundException('Produto nao encontrado');
    return produto;
  }

  async create(data: any) {
    await this.assinaturasService.verificarLimites(data.vendedorId, 'produto');
    return this.prisma.produto.create({
      data,
      include: { categoria: true },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.produto.update({
      where: { id },
      data,
      include: { categoria: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.produto.delete({ where: { id } });
  }

  async toggleDestaque(id: string) {
    const produto = await this.findById(id);
    return this.prisma.produto.update({
      where: { id },
      data: { destaque: !produto.destaque },
    });
  }

  async toggleAtivo(id: string) {
    const produto = await this.findById(id);
    return this.prisma.produto.update({
      where: { id },
      data: { ativo: !produto.ativo },
    });
  }
}
