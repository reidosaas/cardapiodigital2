import { Module } from '@nestjs/common';
import { AdminEntregadoresController } from './admin-entregadores.controller';
import { AdminEntregadoresService } from './admin-entregadores.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminEntregadoresController],
  providers: [AdminEntregadoresService],
})
export class AdminEntregadoresModule {}
