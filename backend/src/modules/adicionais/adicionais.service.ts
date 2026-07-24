import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdicionaisService {
  constructor(private prisma: PrismaService) {}

  async findByProduto(produtoId: string) {
    return this.prisma.adicionalGroup.findMany({
      where: { produtoId },
      include: { opcoes: { where: { ativo: true }, orderBy: { ordem: 'asc' } } },
      orderBy: { ordem: 'asc' },
    });
  }

  async createGroup(produtoId: string, vendedorId: string, data: { nome: string; obrigatorio?: boolean; maxEscolhas?: number; ordem?: number }) {
    await this.validateOwnership(produtoId, vendedorId);
    return this.prisma.adicionalGroup.create({
      data: {
        produtoId,
        nome: data.nome,
        obrigatorio: data.obrigatorio ?? false,
        maxEscolhas: data.maxEscolhas ?? 1,
        ordem: data.ordem ?? 0,
      },
      include: { opcoes: true },
    });
  }

  async updateGroup(grupoId: string, vendedorId: string, data: { nome?: string; obrigatorio?: boolean; maxEscolhas?: number; ordem?: number }) {
    const group = await this.prisma.adicionalGroup.findUnique({ where: { id: grupoId } });
    if (!group) throw new NotFoundException('Grupo nao encontrado');
    await this.validateOwnership(group.produtoId, vendedorId);
    return this.prisma.adicionalGroup.update({
      where: { id: grupoId },
      data,
      include: { opcoes: true },
    });
  }

  async deleteGroup(grupoId: string, vendedorId: string) {
    const group = await this.prisma.adicionalGroup.findUnique({ where: { id: grupoId } });
    if (!group) throw new NotFoundException('Grupo nao encontrado');
    await this.validateOwnership(group.produtoId, vendedorId);
    await this.prisma.adicionalGroup.delete({ where: { id: grupoId } });
    return { message: 'Grupo removido com sucesso' };
  }

  async createOpcao(grupoId: string, vendedorId: string, data: { nome: string; preco?: number; imagemUrl?: string; ordem?: number }) {
    const group = await this.prisma.adicionalGroup.findUnique({ where: { id: grupoId } });
    if (!group) throw new NotFoundException('Grupo nao encontrado');
    await this.validateOwnership(group.produtoId, vendedorId);
    return this.prisma.adicional.create({
      data: {
        grupoId,
        nome: data.nome,
        preco: data.preco ?? 0,
        imagemUrl: data.imagemUrl,
        ordem: data.ordem ?? 0,
      },
    });
  }

  async updateOpcao(opcaoId: string, vendedorId: string, data: { nome?: string; preco?: number; imagemUrl?: string; ativo?: boolean; ordem?: number }) {
    const opcao = await this.prisma.adicional.findUnique({ where: { id: opcaoId }, include: { grupo: true } });
    if (!opcao) throw new NotFoundException('Opcao nao encontrada');
    await this.validateOwnership(opcao.grupo.produtoId, vendedorId);
    return this.prisma.adicional.update({ where: { id: opcaoId }, data });
  }

  async deleteOpcao(opcaoId: string, vendedorId: string) {
    const opcao = await this.prisma.adicional.findUnique({ where: { id: opcaoId }, include: { grupo: true } });
    if (!opcao) throw new NotFoundException('Opcao nao encontrada');
    await this.validateOwnership(opcao.grupo.produtoId, vendedorId);
    await this.prisma.adicional.delete({ where: { id: opcaoId } });
    return { message: 'Opcao removida com sucesso' };
  }

  private async validateOwnership(produtoId: string, vendedorId: string) {
    const produto = await this.prisma.produto.findUnique({ where: { id: produtoId }, select: { vendedorId: true } });
    if (!produto) throw new NotFoundException('Produto nao encontrado');
    if (produto.vendedorId !== vendedorId) throw new ForbiddenException('Acesso negado');
  }
}
