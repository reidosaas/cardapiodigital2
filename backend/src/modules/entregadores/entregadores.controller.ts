import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EntregadoresService } from './entregadores.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Entregadores')
@Controller('entregadores')
export class EntregadoresController {
  constructor(private entregadoresService: EntregadoresService) {}

  @Get('vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Param('vendedorId') vendedorId: string) {
    return this.entregadoresService.findAll(vendedorId);
  }

  @Get('stats/vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAllWithStats(@Param('vendedorId') vendedorId: string) {
    return this.entregadoresService.findAllWithStats(vendedorId);
  }

  @Get('relatorio/vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async relatorio(
    @Param('vendedorId') vendedorId: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.entregadoresService.relatorio(vendedorId, dataInicio, dataFim);
  }

  @Get('relatorio/entregador/:entregadorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async relatorioEntregador(
    @Param('entregadorId') entregadorId: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.entregadoresService.relatorioEntregador(entregadorId, dataInicio, dataFim);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findById(@Param('id') id: string) {
    return this.entregadoresService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() data: any) {
    return this.entregadoresService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() data: any) {
    return this.entregadoresService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.entregadoresService.remove(id);
  }
}
