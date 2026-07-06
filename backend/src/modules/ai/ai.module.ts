import { Global, Module } from '@nestjs/common';
import { AiAtendimentoService } from './ai-atendimento.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '../../config/config.module';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [AiAtendimentoService],
  exports: [AiAtendimentoService],
})
export class AiModule {}
