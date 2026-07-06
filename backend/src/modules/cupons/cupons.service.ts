import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CuponsService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string) {
    return this.prisma.cupom.findMany({
      where: { vendedorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const cupom = await this.prisma.cupom.findUnique({ where: { id } });
    if (!cupom) throw new NotFoundException('Cupom nao encontrado');
    return cupom;
  }

  async findByCodigo(vendedorId: string, codigo: string) {
    const cupom = await this.prisma.cupom.findUnique({
      where: { vendedorId_codigo: { vendedorId, codigo: codigo.toUpperCase() } },
    });

    if (!cupom) throw new NotFoundException('Cupom nao encontrado');
    if (!cupom.ativo) throw new BadRequestException('Cupom inativo');
    if (cupom.expiraEm && cupom.expiraEm < new Date()) throw new BadRequestException('Cupom expirado');
    if (cupom.usosAtuais >= cupom.usoMaximo) throw new BadRequestException('Cupom esgotado');

    return cupom;
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
  }) {
    const existing = await this.prisma.cupom.findUnique({
      where: { vendedorId_codigo: { vendedorId: data.vendedorId, codigo: data.codigo.toUpperCase() } },
    });

    if (existing) throw new BadRequestException('Codigo de cupom ja existe');

    return this.prisma.cupom.create({
      data: { ...data, codigo: data.codigo.toUpperCase() },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.cupom.update({ where: { id }, data });
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
