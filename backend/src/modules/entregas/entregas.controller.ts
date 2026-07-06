import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EntregasService } from './entregas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Entregas')
@Controller('entregas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EntregasController {
  constructor(private entregasService: EntregasService) {}

  @Post()
  async create(@Body() data: any) {
    return this.entregasService.create(data);
  }

  @Get('pendentes/:vendedorId')
  async getPendentes(@Param('vendedorId') vendedorId: string) {
    return this.entregasService.getEntregasPendentes(vendedorId);
  }

  @Get('pedido/:pedidoId')
  async findByPedido(@Param('pedidoId') pedidoId: string) {
    return this.entregasService.findByPedido(pedidoId);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.entregasService.updateStatus(id, status);
  }
}
