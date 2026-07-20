import { Module } from '@nestjs/common';
import { AdminNotifyController } from './admin-notify.controller';
import { AdminNotifyService } from './admin-notify.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AdminNotifyController],
  providers: [AdminNotifyService],
  exports: [AdminNotifyService],
})
export class AdminNotifyModule {}
