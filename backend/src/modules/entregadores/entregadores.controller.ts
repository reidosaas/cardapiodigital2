import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
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

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkin(@Param('id') id: string, @Req() req: any) {
    return this.entregadoresService.checkin(id, req.user.vendedor?.id);
  }

  @Post(':id/pagar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async pagarEntregador(@Param('id') id: string, @Req() req: any) {
    return this.entregadoresService.pagarEntregador(id, req.user.vendedor?.id);
  }

  @Get('para-pagar/vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getEntregadoresParaPagar(
    @Param('vendedorId') vendedorId: string,
    @Req() req: any,
  ) {
    if (req.user.vendedor?.id !== vendedorId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.entregadoresService.getEntregadoresParaPagar(vendedorId);
  }

  @Get('checkins/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getCheckins(
    @Param('vendedorId') vendedorId: string,
    @Req() req: any,
    @Query('data') data?: string,
  ) {
    // Verifica se o vendedorId pertence ao usuario logado
    if (req.user.vendedor?.id !== vendedorId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.entregadoresService.getCheckins(vendedorId, data);
  }
}