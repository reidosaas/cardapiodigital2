import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notificacao.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getNaoLidas(userId: string) {
    return this.prisma.notificacao.findMany({
      where: { userId, lida: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async marcarLida(id: string) {
    return this.prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  async marcarTodasLidas(userId: string) {
    return this.prisma.notificacao.updateMany({
      where: { userId, lida: false },
      data: { lida: true },
    });
  }

  async criar(data: {
    userId: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    link?: string;
  }) {
    return this.prisma.notificacao.create({
      data: {
        userId: data.userId,
        tipo: data.tipo as any,
        titulo: data.titulo,
        mensagem: data.mensagem,
        link: data.link,
      },
    });
  }

  async countNaoLidas(userId: string) {
    return this.prisma.notificacao.count({
      where: { userId, lida: false },
    });
  }
}
