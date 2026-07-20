import { Controller, Get } from '@nestjs/common';
import { ConfigSistemaService } from './config-sistema.service';

@Controller('config-sistema')
export class ConfigSistemaPublicController {
  constructor(private service: ConfigSistemaService) {}

  @Get()
  getConfig() {
    return this.service.getConfig();
  }
}
