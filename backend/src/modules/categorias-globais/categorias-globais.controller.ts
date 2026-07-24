import { Controller, Get, Param } from '@nestjs/common';
import { CategoriasGlobaisService } from './categorias-globais.service';

@Controller('categorias-globais')
export class CategoriasGlobaisController {
  constructor(private service: CategoriasGlobaisService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
