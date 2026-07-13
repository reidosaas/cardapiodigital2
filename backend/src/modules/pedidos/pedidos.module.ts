import { Module, forwardRef } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { CuponsModule } from '../cupons/cupons.module';
import { LeadsModule } from '../leads/leads.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [AssinaturasModule, CuponsModule, LeadsModule, forwardRef(() => WhatsAppModule)],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
