import { Module } from '@nestjs/common';
import { VendedoresController } from './vendedores.controller';
import { VendedoresService } from './vendedores.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [VendedoresController],
  providers: [VendedoresService],
  exports: [VendedoresService],
})
export class VendedoresModule {}
