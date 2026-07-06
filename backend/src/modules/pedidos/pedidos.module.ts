import { Module } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [AssinaturasModule, LeadsModule],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
