import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { userId?: string; acao?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.acao) where.acao = { contains: params.acao };

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        include: { user: { select: { nome: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.log.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async create(data: { userId: string; acao: string; entidade: string; entidadeId?: string; dados?: any; ip?: string; userAgent?: string }) {
    return this.prisma.log.create({ data });
  }

  async limparAntigos(dias = 90) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const result = await this.prisma.log.deleteMany({
      where: { createdAt: { lt: dataLimite } },
    });

    return { deletados: result.count };
  }
}
