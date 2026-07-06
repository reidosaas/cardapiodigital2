import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private clientesService: ClientesService) {}

  @Get('vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Param('vendedorId') vendedorId: string, @Query('busca') busca?: string) {
    return this.clientesService.findAll(vendedorId, { busca });
  }

  @Get('top/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getTop(@Param('vendedorId') vendedorId: string) {
    return this.clientesService.getTop(vendedorId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.clientesService.findById(id);
  }

  @Post()
  async create(@Body() data: { vendedorId: string; nome: string; telefone?: string; email?: string }) {
    return this.clientesService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() data: any) {
    return this.clientesService.update(id, data);
  }
}
