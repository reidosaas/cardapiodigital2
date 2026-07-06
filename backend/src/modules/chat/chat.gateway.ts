import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user_${userId}`);
    }
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
        break;
      }
    }
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-conversa')
  handleJoinConversa(client: Socket, conversaId: string) {
    client.join(`conversa_${conversaId}`);
  }

  @SubscribeMessage('send-message')
  async handleMessage(client: Socket, payload: { conversaId: string; conteudo: string; remetente?: string }) {
    try {
      const mensagem = await this.chatService.enviarMensagem({
        conversaId: payload.conversaId,
        conteudo: payload.conteudo,
        remetente: payload.remetente || 'vendedor',
      });

      this.server.to(`conversa_${payload.conversaId}`).emit('new-message', mensagem);

      const conversa = await this.chatService['prisma'].conversa.findUnique({
        where: { id: payload.conversaId },
        select: { vendedorId: true },
      });

      if (conversa) {
        this.server.to(`user_${conversa.vendedorId}`).emit('conversa-updated', {
          conversaId: payload.conversaId,
          ultimaMensagem: payload.conteudo,
        });
      }

      return { success: true, mensagem };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
