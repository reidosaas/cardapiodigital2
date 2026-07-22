import { Module } from '@nestjs/common';
import { TaxasEntregaController } from './taxas-entrega.controller';
import { TaxasEntregaPublicController } from './taxas-entrega-public.controller';
import { TaxasEntregaService } from './taxas-entrega.service';

@Module({
  controllers: [TaxasEntregaController, TaxasEntregaPublicController],
  providers: [TaxasEntregaService],
  exports: [TaxasEntregaService],
})
export class TaxasEntregaModule {}
