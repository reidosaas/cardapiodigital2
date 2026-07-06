import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversas/:vendedorId')
  async getConversas(@Param('vendedorId') vendedorId: string) {
    return this.chatService.getConversas(vendedorId);
  }

  @Get('mensagens/:conversaId')
  async getMensagens(@Param('conversaId') conversaId: string) {
    return this.chatService.getMensagens(conversaId);
  }

  @Patch('mensagens/:conversaId/ler')
  async marcarLidas(@Param('conversaId') conversaId: string) {
    return this.chatService.marcarLidas(conversaId);
  }
}
