import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('conectar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async conectar(@Req() req: any) {
    const vendedorId = req.user.vendedor?.id || req.user.vendedorId;
    return this.whatsappService.conectar(vendedorId);
  }

  @Post('desconectar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async desconectar(@Req() req: any) {
    const vendedorId = req.user.vendedor?.id || req.user.vendedorId;
    return this.whatsappService.desconectar(vendedorId);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async status(@Req() req: any) {
    const vendedorId = req.user.vendedor?.id || req.user.vendedorId;
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
