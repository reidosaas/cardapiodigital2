import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { ChatModule } from '../chat/chat.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { AgendamentosModule } from '../agendamentos/agendamentos.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [ChatModule, forwardRef(() => PedidosModule), AgendamentosModule, LeadsModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
