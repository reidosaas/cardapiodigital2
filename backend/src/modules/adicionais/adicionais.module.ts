import { Module } from '@nestjs/common';
import { AdicionaisController } from './adicionais.controller';
import { AdicionaisService } from './adicionais.service';

@Module({
  controllers: [AdicionaisController],
  providers: [AdicionaisService],
  exports: [AdicionaisService],
})
export class AdicionaisModule {}
