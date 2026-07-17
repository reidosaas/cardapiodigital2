import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminEntregadoresService } from './admin-entregadores.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin/entregadores')
@UseGuards(JwtAuthGuard)
export class AdminEntregadoresController {
  constructor(private readonly service: AdminEntregadoresService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('stats')
  async stats() {
    return this.service.stats();
  }
}
