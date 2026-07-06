import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProdutosService } from './produtos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Produtos')
@Controller('produtos')
export class ProdutosController {
  constructor(private produtosService: ProdutosService) {}

  @Get('vendedor/:vendedorId')
  async findAll(
    @Param('vendedorId') vendedorId: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('busca') busca?: string,
    @Query('destaque') destaque?: string,
  ) {
    return this.produtosService.findAll(vendedorId, {
      categoriaId,
      busca,
      destaque: destaque === 'true',
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.produtosService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() data: any, @CurrentUser() user: any) {
    if (!user.vendedor?.id) {
      throw new BadRequestException('Usuario nao e um vendedor');
    }
    return this.produtosService.create({ ...data, vendedorId: user.vendedor.id });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() data: any) {
    return this.produtosService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.produtosService.remove(id);
  }

  @Patch(':id/toggle-destaque')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async toggleDestaque(@Param('id') id: string) {
    return this.produtosService.toggleDestaque(id);
  }

  @Patch(':id/toggle-ativo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async toggleAtivo(@Param('id') id: string) {
    return this.produtosService.toggleAtivo(id);
  }
}
