import { Module } from '@nestjs/common';
import { ServerStatusController } from './server-status.controller';
import { ServerStatusService } from './server-status.service';

@Module({
  controllers: [ServerStatusController],
  providers: [ServerStatusService],
  exports: [ServerStatusService],
})
export class ServerStatusModule {}
