import { Module } from '@nestjs/common';
import { GarconsController } from './garcons.controller';
import { GarconsService } from './garcons.service';

@Module({
  controllers: [GarconsController],
  providers: [GarconsService],
  exports: [GarconsService],
})
export class GarconsModule {}
