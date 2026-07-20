import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfigSistemaService } from './config-sistema.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/config-sistema')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ConfigSistemaController {
  constructor(private service: ConfigSistemaService) {}

  @Get()
  getConfig() {
    return this.service.getConfig();
  }

  @Patch()
  updateConfig(@Body() data: {
    logoUrl?: string;
    faviconUrl?: string;
    nomeSistema?: string;
    corTema?: string;
    telefone?: string;
    emailContato?: string;
    redesSociais?: any;
    whatsappAdminNumero?: string;
  }) {
    return this.service.updateConfig(data);
  }
}
