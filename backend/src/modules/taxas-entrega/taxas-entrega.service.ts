import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaxasEntregaService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string) {
    return this.prisma.taxaEntregaDistancia.findMany({
      where: { vendedorId },
      orderBy: { distanciaMinKm: 'asc' },
    });
  }

  async create(vendedorId: string, data: { distanciaMinKm: number; distanciaMaxKm: number; valor: number }) {
    if (data.distanciaMinKm >= data.distanciaMaxKm) {
      throw new BadRequestException('Distancia minima deve ser menor que a maxima');
    }
    if (data.valor < 0) {
      throw new BadRequestException('Valor nao pode ser negativo');
    }

    const overlap = await this.prisma.taxaEntregaDistancia.findFirst({
      where: {
        vendedorId,
        ativo: true,
        distanciaMinKm: { lt: data.distanciaMaxKm },
        distanciaMaxKm: { gt: data.distanciaMinKm },
      },
    });
    if (overlap) {
      throw new BadRequestException('Faixa de distancia conflita com uma existente');
    }

    return this.prisma.taxaEntregaDistancia.create({
      data: {
        vendedorId,
        distanciaMinKm: data.distanciaMinKm,
        distanciaMaxKm: data.distanciaMaxKm,
        valor: data.valor,
      },
    });
  }

  async update(id: string, vendedorId: string, data: { distanciaMinKm?: number; distanciaMaxKm?: number; valor?: number; ativo?: boolean }) {
    const existing = await this.prisma.taxaEntregaDistancia.findFirst({ where: { id, vendedorId } });
    if (!existing) throw new NotFoundException('Taxa de entrega nao encontrada');

    const min = Number(data.distanciaMinKm ?? existing.distanciaMinKm);
    const max = Number(data.distanciaMaxKm ?? existing.distanciaMaxKm);
    const valor = Number(data.valor ?? existing.valor);

    if (min >= max) throw new BadRequestException('Distancia minima deve ser menor que a maxima');
    if (valor < 0) throw new BadRequestException('Valor nao pode ser negativo');

    return this.prisma.taxaEntregaDistancia.update({
      where: { id },
      data: {
        ...(data.distanciaMinKm !== undefined && { distanciaMinKm: data.distanciaMinKm }),
        ...(data.distanciaMaxKm !== undefined && { distanciaMaxKm: data.distanciaMaxKm }),
        ...(data.valor !== undefined && { valor: data.valor }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
      },
    });
  }

  async remove(id: string, vendedorId: string) {
    const existing = await this.prisma.taxaEntregaDistancia.findFirst({ where: { id, vendedorId } });
    if (!existing) throw new NotFoundException('Taxa de entrega nao encontrada');
    return this.prisma.taxaEntregaDistancia.delete({ where: { id } });
  }

  async calcularTaxa(vendedorId: string, distanciaKm: number): Promise<number> {
    const tiers = await this.prisma.taxaEntregaDistancia.findMany({
      where: { vendedorId, ativo: true },
      orderBy: { distanciaMinKm: 'asc' },
    });

    if (tiers.length === 0) {
      const vendedor = await this.prisma.vendedor.findUnique({ where: { id: vendedorId } });
      return Number(vendedor?.taxaEntrega || 0);
    }

    const match = tiers.find(t => distanciaKm >= Number(t.distanciaMinKm) && distanciaKm < Number(t.distanciaMaxKm));
    if (match) return Number(match.valor);

    const maxTier = tiers[tiers.length - 1];
    if (distanciaKm >= Number(maxTier.distanciaMaxKm)) return Number(maxTier.valor);

    return 0;
  }

  async calcularDistancia(vendedorId: string, clienteLat: number, clienteLng: number): Promise<number> {
    const vendedor = await this.prisma.vendedor.findUnique({ where: { id: vendedorId } });
    if (!vendedor?.latitude || !vendedor?.longitude) return 0;

    const R = 6371;
    const dLat = (clienteLat - Number(vendedor.latitude)) * Math.PI / 180;
    const dLng = (clienteLng - Number(vendedor.longitude)) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(Number(vendedor.latitude) * Math.PI / 180) *
      Math.cos(clienteLat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}
