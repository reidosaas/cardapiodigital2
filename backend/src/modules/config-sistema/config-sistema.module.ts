import { Module } from '@nestjs/common';
import { ConfigSistemaController } from './config-sistema.controller';
import { ConfigSistemaPublicController } from './config-sistema-public.controller';
import { ConfigSistemaService } from './config-sistema.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigSistemaController, ConfigSistemaPublicController],
  providers: [ConfigSistemaService],
  exports: [ConfigSistemaService],
})
export class ConfigSistemaModule {}
