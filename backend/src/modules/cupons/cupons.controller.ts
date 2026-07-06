import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CuponsService } from './cupons.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Cupons')
@Controller('cupons')
export class CuponsController {
  constructor(private cuponsService: CuponsService) {}

  @Get('vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Param('vendedorId') vendedorId: string) {
    return this.cuponsService.findAll(vendedorId);
  }

  @Get('validar/:vendedorId/:codigo')
  async validar(@Param('vendedorId') vendedorId: string, @Param('codigo') codigo: string) {
    return this.cuponsService.findByCodigo(vendedorId, codigo);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.cuponsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() data: any) {
    return this.cuponsService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() data: any) {
    return this.cuponsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.cuponsService.remove(id);
  }
}
