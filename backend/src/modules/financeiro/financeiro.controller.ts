import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Financeiro')
@Controller('financeiro')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceiroController {
  constructor(private financeiroService: FinanceiroService) {}

  @Get('resumo/:vendedorId')
  async getResumo(@Param('vendedorId') vendedorId: string) {
    return this.financeiroService.getResumo(vendedorId);
  }

  @Get('extrato/:vendedorId')
  async getExtrato(
    @Param('vendedorId') vendedorId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.financeiroService.getExtrato(vendedorId, Number(page), Number(limit));
  }

  @Get('metodos/:vendedorId')
  async getMetodosPagamento(@Param('vendedorId') vendedorId: string) {
    return this.financeiroService.getMetodosPagamento(vendedorId);
  }
}
