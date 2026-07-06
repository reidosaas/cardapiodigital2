import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private pedidosService: PedidosService) {}

  @Get('vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(
    @Param('vendedorId') vendedorId: string,
    @Query('status') status?: string,
  ) {
    return this.pedidosService.findAll(vendedorId, { status });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.pedidosService.findById(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.pedidosService.create(data);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.pedidosService.updateStatus(id, status);
  }
}
