import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PagamentosService } from './pagamentos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Pagamentos')
@Controller('pagamentos')
export class PagamentosController {
  constructor(private pagamentosService: PagamentosService) {}

  @Post()
  async create(@Body() data: { pedidoId: string; metodo: string; valor: number }) {
    return this.pagamentosService.create(data);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.pagamentosService.findById(id);
  }

  @Post('pix/:pedidoId')
  async gerarPix(@Param('pedidoId') pedidoId: string) {
    return this.pagamentosService.gerarPix(pedidoId);
  }

  @Post('link/:pedidoId')
  async gerarLink(@Param('pedidoId') pedidoId: string) {
    return this.pagamentosService.gerarLinkPagamento(pedidoId);
  }

  @Patch('confirmar/:pedidoId')
  async confirmar(@Param('pedidoId') pedidoId: string, @Body('transactionId') transactionId?: string) {
    return this.pagamentosService.confirmarPagamento(pedidoId, transactionId);
  }
}
