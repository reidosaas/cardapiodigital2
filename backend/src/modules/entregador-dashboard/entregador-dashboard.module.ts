import { Module } from '@nestjs/common';
import { EntregadorDashboardController } from './entregador-dashboard.controller';
import { EntregadorDashboardService } from './entregador-dashboard.service';
import { EntregadorAuthModule } from '../entregador-auth/entregador-auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, EntregadorAuthModule],
  controllers: [EntregadorDashboardController],
  providers: [EntregadorDashboardService],
})
export class EntregadorDashboardModule {}
