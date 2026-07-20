import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ServerStatusService } from './server-status.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/server-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ServerStatusController {
  constructor(private service: ServerStatusService) {}

  @Get()
  getStatus() {
    return this.service.getInfo();
  }

  @Post('cleanup')
  cleanup() {
    return this.service.cleanup();
  }
}
