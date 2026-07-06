import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvaliacoesService {
  constructor(private prisma: PrismaService) {}

  async findByProduto(produtoId: string) {
    return this.prisma.avaliacao.findMany({
      where: { produtoId, ativo: true },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { produtoId: string; clienteId: string; nota: number; comentario?: string }) {
    return this.prisma.avaliacao.create({ data });
  }

  async responder(id: string, resposta: string) {
    const avaliacao = await this.prisma.avaliacao.findUnique({ where: { id } });
    if (!avaliacao) throw new NotFoundException('Avaliacao nao encontrada');
    return this.prisma.avaliacao.update({ where: { id }, data: { resposta } });
  }

  async getMedia(produtoId: string) {
    const result = await this.prisma.avaliacao.aggregate({
      where: { produtoId, ativo: true },
      _avg: { nota: true },
      _count: true,
    });
    return { media: result._avg.nota || 0, total: result._count };
  }
}
