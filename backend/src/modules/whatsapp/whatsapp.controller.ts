import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('conectar/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async conectar(@Param('vendedorId') vendedorId: string) {
    return this.whatsappService.conectar(vendedorId);
  }

  @Post('desconectar/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async desconectar(@Param('vendedorId') vendedorId: string) {
    return this.whatsappService.desconectar(vendedorId);
  }

  @Get('status/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async status(@Param('vendedorId') vendedorId: string) {
    return this.whatsappService.status(vendedorId);
  }

  @Post('webhook')
  async webhook(@Body() payload: any) {
    return this.whatsappService.processarWebhook(payload);
  }

  @Post('enviar')
  async enviarMensagem(@Body() data: { telefone: string; mensagem: string }) {
    return this.whatsappService.enviarMensagem(data.telefone, data.mensagem);
  }
}
