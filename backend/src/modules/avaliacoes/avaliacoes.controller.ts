import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AvaliacoesService } from './avaliacoes.service';

@ApiTags('Avaliacoes')
@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private avaliacoesService: AvaliacoesService) {}

  @Get('produto/:produtoId')
  async findByProduto(@Param('produtoId') produtoId: string) {
    return this.avaliacoesService.findByProduto(produtoId);
  }

  @Get('media/:produtoId')
  async getMedia(@Param('produtoId') produtoId: string) {
    return this.avaliacoesService.getMedia(produtoId);
  }

  @Post()
  async create(@Body() data: { produtoId: string; clienteId: string; nota: number; comentario?: string }) {
    return this.avaliacoesService.create(data);
  }

  @Patch(':id/responder')
  async responder(@Param('id') id: string, @Body('resposta') resposta: string) {
    return this.avaliacoesService.responder(id, resposta);
  }
}
