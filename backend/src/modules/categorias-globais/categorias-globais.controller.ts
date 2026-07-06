import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CategoriasGlobaisService } from './categorias-globais.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('categorias-globais')
export class CategoriasGlobaisController {
  constructor(private service: CategoriasGlobaisService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
