import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CuponsService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string) {
    return this.prisma.cupom.findMany({
      where: { vendedorId },
      include: { produtos: { select: { id: true, nome: true, preco: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const cupom = await this.prisma.cupom.findUnique({
      where: { id },
      include: { produtos: true },
    });
    if (!cupom) throw new NotFoundException('Cupom nao encontrado');
    return cupom;
  }

  async findByCodigo(vendedorId: string, codigo: string) {
    const cupom = await this.prisma.cupom.findUnique({
      where: { vendedorId_codigo: { vendedorId, codigo: codigo.toUpperCase() } },
      include: { produtos: { select: { id: true } } },
    });

    if (!cupom) throw new NotFoundException('Cupom nao encontrado');
    if (!cupom.ativo) throw new BadRequestException('Cupom inativo');
    if (cupom.expiraEm) {
      const fimDoDia = new Date(cupom.expiraEm);
      fimDoDia.setUTCHours(23, 59, 59, 999);
      if (fimDoDia < new Date()) throw new BadRequestException('Cupom expirado');
    }
    if (cupom.usoMaximo && cupom.usosAtuais >= cupom.usoMaximo) throw new BadRequestException('Cupom esgotado');

    return cupom;
  }

  async findByProduto(produtoId: string) {
    const now = new Date();
    const cupons = await this.prisma.cupom.findMany({
      where: {
        produtos: { some: { id: produtoId } },
        ativo: true,
      },
    });
    return cupons.filter((c) => {
      if (c.expiraEm) {
        const fimDoDia = new Date(c.expiraEm);
        fimDoDia.setUTCHours(23, 59, 59, 999);
        if (fimDoDia < now) return false;
      }
      if (c.usoMaximo && c.usosAtuais >= c.usoMaximo) return false;
      return true;
    });
  }

  async findAtivosByVendedor(vendedorId: string) {
    const now = new Date();
    const cupons = await this.prisma.cupom.findMany({
      where: { vendedorId, ativo: true },
      include: { produtos: { select: { id: true, nome: true } } },
    });
    return cupons.filter((c) => {
      if (c.expiraEm) {
        const fimDoDia = new Date(c.expiraEm);
        fimDoDia.setUTCHours(23, 59, 59, 999);
        if (fimDoDia < now) return false;
      }
      if (c.usoMaximo && c.usosAtuais >= c.usoMaximo) return false;
      return true;
    });
  }

  async create(data: {
    vendedorId: string;
    codigo: string;
    tipo: string;
    valor: number;
    descricao?: string;
    valorMinimo?: number;
    usoMaximo?: number;
    expiraEm?: Date;
    produtoIds?: string[];
  }) {
    const existing = await this.prisma.cupom.findUnique({
      where: { vendedorId_codigo: { vendedorId: data.vendedorId, codigo: data.codigo.toUpperCase() } },
    });

    if (existing) throw new BadRequestException('Codigo de cupom ja existe');

    const { produtoIds, ...campos } = data;

    return this.prisma.cupom.create({
      data: {
        ...campos,
        codigo: data.codigo.toUpperCase(),
        produtos: produtoIds?.length
          ? { connect: produtoIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { produtos: { select: { id: true, nome: true } } },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);

    const { produtoIds, ...campos } = data;

    return this.prisma.cupom.update({
      where: { id },
      data: {
        ...campos,
        ...(produtoIds !== undefined && {
          produtos: { set: produtoIds.map((id: string) => ({ id })) },
        }),
      },
      include: { produtos: { select: { id: true, nome: true } } },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.cupom.delete({ where: { id } });
  }

  async usarCupom(id: string) {
    const cupom = await this.findById(id);
    return this.prisma.cupom.update({
      where: { id },
      data: { usosAtuais: { increment: 1 } },
    });
  }
}
