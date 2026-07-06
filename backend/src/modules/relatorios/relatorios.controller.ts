import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Relatorios')
@Controller('relatorios')
export class RelatoriosController {
  constructor(private relatoriosService: RelatoriosService) {}

  @Get('vendas/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getVendas(
    @Param('vendedorId') vendedorId: string,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
  ) {
    return this.relatoriosService.getVendasPorPeriodo(
      vendedorId,
      new Date(inicio),
      new Date(fim),
    );
  }

  @Get('produtos-top/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProdutosTop(
    @Param('vendedorId') vendedorId: string,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
  ) {
    return this.relatoriosService.getProdutosMaisVendidos(
      vendedorId,
      new Date(inicio),
      new Date(fim),
    );
  }

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async getDashboardAdmin() {
    return this.relatoriosService.getDashboardAdmin();
  }
}
