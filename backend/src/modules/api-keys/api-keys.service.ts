import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    return this.prisma.apiKey.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API Key nao encontrada');
    return key;
  }

  async create(data: { userId: string; nome: string; provider?: string; permissoes?: any; expiraEm?: Date }) {
    const rawKey = `crd_${crypto.randomBytes(32).toString('hex')}`;
    return this.prisma.apiKey.create({
      data: {
        userId: data.userId,
        nome: data.nome,
        key: rawKey,
        provider: data.provider || 'custom',
        permissoes: data.permissoes || ['catalogo:read'],
        expiraEm: data.expiraEm,
      },
    });
  }

  async update(id: string, data: { nome?: string; ativo?: boolean; permissoes?: any }) {
    const key = await this.findById(id);
    return this.prisma.apiKey.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.apiKey.delete({ where: { id } });
  }

  async validate(key: string): Promise<boolean> {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { key } });
    if (!apiKey || !apiKey.ativo) return false;
    if (apiKey.expiraEm && apiKey.expiraEm < new Date()) return false;
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { ultimoUso: new Date() } });
    return true;
  }
}
