import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendedorId: string) {
    return this.prisma.banner.findMany({
      where: { vendedorId },
      orderBy: { ordem: 'asc' },
    });
  }

  async create(data: { vendedorId: string; imagemUrl: string; titulo?: string; linkUrl?: string }) {
    const count = await this.prisma.banner.count({ where: { vendedorId: data.vendedorId } });
    return this.prisma.banner.create({ data: { ...data, ordem: count } });
  }

  async update(id: string, data: any) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner nao encontrado');
    return this.prisma.banner.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.banner.findUnique({ where: { id } }).then((b) => {
      if (!b) throw new NotFoundException('Banner nao encontrado');
    });
    return this.prisma.banner.delete({ where: { id } });
  }
}
