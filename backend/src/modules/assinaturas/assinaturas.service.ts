import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssinaturasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assinatura.findMany({
      include: { vendedor: { select: { nomeLoja: true, slug: true } }, planos: true },
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findByVendedor(vendedorId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { vendedorId },
      include: { planos: true },
    });
    return assinatura;
  }

  async create(data: {
    vendedorId: string;
    plano: string;
    planoId?: string;
    preco: number;
    trialEndsAt?: Date;
  }) {
    const existing = await this.prisma.assinatura.findUnique({
      where: { vendedorId: data.vendedorId },
    });

    if (existing) throw new BadRequestException('Vendedor ja possui assinatura');

    return this.prisma.assinatura.create({
      data: {
        vendedorId: data.vendedorId,
        plano: data.plano,
        planoId: data.planoId,
        preco: data.preco,
        trialEndsAt: data.trialEndsAt,
      },
    });
  }

  async update(id: string, data: any) {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { id } });
    if (!assinatura) throw new NotFoundException('Assinatura nao encontrada');
    return this.prisma.assinatura.update({ where: { id }, data: { ...data } });
  }

  async cancelar(id: string) {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { id } });
    if (!assinatura) throw new NotFoundException('Assinatura nao encontrada');
    return this.prisma.assinatura.update({
      where: { id },
      data: { status: 'CANCELADA', canceladoEm: new Date() },
    });
  }

  async getPlanos() {
    return this.prisma.plano.findMany({ where: { ativo: true }, orderBy: { preco: 'asc' } });
  }

  async criarPlano(data: { nome: string; slug: string; preco: number; limiteProdutos: number; limitePedidos: number; limiteUsuarios?: number; features?: any; descricao?: string }) {
    return this.prisma.plano.create({ data });
  }

  async atualizarPlano(id: string, data: any) {
    const plano = await this.prisma.plano.findUnique({ where: { id } });
    if (!plano) throw new NotFoundException('Plano nao encontrado');
    return this.prisma.plano.update({ where: { id }, data });
  }

  async deletarPlano(id: string) {
    const plano = await this.prisma.plano.findUnique({ where: { id } });
    if (!plano) throw new NotFoundException('Plano nao encontrado');
    return this.prisma.plano.update({ where: { id }, data: { ativo: false } });
  }

  async verificarLimites(vendedorId: string, tipo: 'produto' | 'pedido'): Promise<void> {
    let assinatura = await this.prisma.assinatura.findUnique({
      where: { vendedorId },
      include: { planos: true },
    });

    if (!assinatura) {
      const planoGratuito = await this.prisma.plano.findUnique({ where: { slug: 'gratuito' } });
      assinatura = await this.prisma.assinatura.create({
        data: {
          vendedorId,
          planoId: planoGratuito?.id,
          plano: planoGratuito?.nome || 'Gratuito',
          preco: 0,
          status: 'ATIVA',
        },
        include: { planos: true },
      });
    }

    if (assinatura.status !== 'ATIVA') {
      throw new ForbiddenException('Assinatura inativa. Acesse o painel para reativar.');
    }

    if (assinatura.planos) {
      const limite = tipo === 'produto' ? assinatura.planos.limiteProdutos : assinatura.planos.limitePedidos;
      if (limite === -1) return;

      let total: number;
      if (tipo === 'produto') {
        total = await this.prisma.produto.count({ where: { vendedorId } });
      } else {
        total = await this.prisma.pedido.count({ where: { vendedorId } });
      }

      if (total >= limite) {
        throw new ForbiddenException(`Limite de ${tipo === 'produto' ? 'produtos' : 'pedidos'} atingido (${limite}). Faca upgrade do plano.`);
      }
    }
  }
}
