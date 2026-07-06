import { Module } from '@nestjs/common';
import { AssinaturasController } from './assinaturas.controller';
import { AssinaturasService } from './assinaturas.service';

@Module({
  controllers: [AssinaturasController],
  providers: [AssinaturasService],
  exports: [AssinaturasService],
})
export class AssinaturasModule {}
