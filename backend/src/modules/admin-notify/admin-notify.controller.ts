import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminNotifyService } from './admin-notify.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/whatsapp-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminNotifyController {
  constructor(private service: AdminNotifyService) {}

  @Get('status')
  getStatus() {
    return this.service.getWhatsAppStatus();
  }

  @Post('conectar')
  conectar() {
    return this.service.conectar();
  }

  @Post('desconectar')
  desconectar() {
    return this.service.desconectar();
  }

  @Post('check-status')
  checkStatus() {
    return this.service.status();
  }

  @Post('enviar-relatorio')
  enviarRelatorio() {
    return this.service.enviarRelatorioDiario();
  }

  @Post('check-disco')
  checkDisco() {
    return this.service.verificarDiscoAlerta();
  }
}
