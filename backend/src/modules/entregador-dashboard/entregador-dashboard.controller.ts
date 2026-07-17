import { Controller, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { EntregadorDashboardService } from './entregador-dashboard.service';
import { EntregadorAuthGuard } from '../entregador-auth/entregador-auth.guard';

@Controller('entregador')
@UseGuards(EntregadorAuthGuard)
export class EntregadorDashboardController {
  constructor(private readonly service: EntregadorDashboardService) {}

  @Get('pedidos')
  async getPedidos(@Req() req: any) {
    return this.service.getPedidos(req.user.id, req.user.vendedorId);
  }

  @Get('ganhos')
  async getGanhos(@Req() req: any, @Query('periodo') periodo?: string) {
    return this.service.getGanhos(req.user.id, req.user.vendedorId, periodo);
  }

  @Get('relatorio')
  async getRelatorio(
    @Req() req: any,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    return this.service.getRelatorio(req.user.id, req.user.vendedorId, dataInicio, dataFim);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.id, req.user.vendedorId);
  }

  @Patch('entrega/:id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.service.updateStatus(id, status, req.user.id);
  }

  @Get('vinculos')
  async getVinculos(@Req() req: any) {
    return this.service.getVinculos(req.user.id);
  }

  @Patch('vinculo/:id/aceitar')
  async aceitarVinculo(@Param('id') id: string, @Req() req: any) {
    return this.service.aceitarVinculo(id, req.user.id);
  }

  @Patch('vinculo/:id/recusar')
  async recusarVinculo(@Param('id') id: string, @Req() req: any) {
    return this.service.recusarVinculo(id, req.user.id);
  }
}
