import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdicionaisService } from './adicionais.service';

@Controller('adicionais')
export class AdicionaisController {
  constructor(private readonly service: AdicionaisService) {}

  @Get('produto/:produtoId')
  findByProduto(@Param('produtoId') produtoId: string) {
    return this.service.findByProduto(produtoId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('grupo/:produtoId')
  createGroup(@Param('produtoId') produtoId: string, @Req() req: any, @Body() body: { nome: string; obrigatorio?: boolean; maxEscolhas?: number; ordem?: number }) {
    return this.service.createGroup(produtoId, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('grupo/:id')
  updateGroup(@Param('id') id: string, @Req() req: any, @Body() body: { nome?: string; obrigatorio?: boolean; maxEscolhas?: number; ordem?: number }) {
    return this.service.updateGroup(id, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('grupo/:id')
  deleteGroup(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteGroup(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('opcao/:grupoId')
  createOpcao(@Param('grupoId') grupoId: string, @Req() req: any, @Body() body: { nome: string; preco?: number; imagemUrl?: string; ordem?: number }) {
    return this.service.createOpcao(grupoId, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('opcao/:id')
  updateOpcao(@Param('id') id: string, @Req() req: any, @Body() body: { nome?: string; preco?: number; imagemUrl?: string; ativo?: boolean; ordem?: number }) {
    return this.service.updateOpcao(id, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('opcao/:id')
  deleteOpcao(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteOpcao(id, req.user.id);
  }
}
