import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssinaturasService } from './assinaturas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Assinaturas')
@Controller('assinaturas')
export class AssinaturasController {
  constructor(private assinaturasService: AssinaturasService) {}

  @Get('planos')
  async getPlanos() {
    return this.assinaturasService.getPlanos();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async findAll() {
    return this.assinaturasService.findAll();
  }

  @Get('vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findByVendedor(@Param('vendedorId') vendedorId: string) {
    return this.assinaturasService.findByVendedor(vendedorId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async create(@Body() data: any) {
    return this.assinaturasService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() data: any) {
    return this.assinaturasService.update(id, data);
  }

  @Post(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancelar(@Param('id') id: string) {
    return this.assinaturasService.cancelar(id);
  }

  @Post('planos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async criarPlano(@Body() data: any) {
    return this.assinaturasService.criarPlano(data);
  }

  @Patch('planos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async atualizarPlano(@Param('id') id: string, @Body() data: any) {
    return this.assinaturasService.atualizarPlano(id, data);
  }

  @Delete('planos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async deletarPlano(@Param('id') id: string) {
    return this.assinaturasService.deletarPlano(id);
  }
}
