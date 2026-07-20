import { Module } from '@nestjs/common';
import { ServerMonitorService } from './server-monitor.service';
import { AdminNotifyModule } from '../admin-notify/admin-notify.module';

@Module({
  imports: [AdminNotifyModule],
  providers: [ServerMonitorService],
})
export class ServerMonitorModule {}
