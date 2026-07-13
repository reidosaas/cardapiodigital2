import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversas(vendedorId: string) {
    return this.prisma.conversa.findMany({
      where: { vendedorId },
      include: {
        _count: { select: { mensagens: true } },
        cliente: { select: { id: true, nome: true } },
      },
      orderBy: { ultimaAtividade: 'desc' },
    });
  }

  async getMensagens(conversaId: string) {
    const conversa = await this.prisma.conversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new Error('Conversa nao encontrada');

    const mensagens = await this.prisma.mensagem.findMany({
      where: { conversaId },
      orderBy: { createdAt: 'asc' },
    });

    return { conversa, mensagens };
  }

  async enviarMensagem(data: {
    conversaId: string;
    conteudo: string;
    remetente?: string;
    tipo?: string;
    midiaUrl?: string;
  }) {
    const mensagem = await this.prisma.mensagem.create({
      data: {
        conversaId: data.conversaId,
        remetente: data.remetente || 'vendedor',
        conteudo: data.conteudo,
        tipo: data.tipo || 'texto',
        midiaUrl: data.midiaUrl || null,
      },
    });

    await this.prisma.conversa.update({
      where: { id: data.conversaId },
      data: {
        ultimaMensagem: data.conteudo,
        ultimaAtividade: new Date(),
      },
    });

    return mensagem;
  }

  async marcarLidas(conversaId: string) {
    await this.prisma.mensagem.updateMany({
      where: { conversaId, remetente: 'cliente', lida: false },
      data: { lida: true, lidaEm: new Date() },
    });

    await this.prisma.conversa.update({
      where: { id: conversaId },
      data: { naoLido: 0 },
    });

    return { success: true };
  }
}
