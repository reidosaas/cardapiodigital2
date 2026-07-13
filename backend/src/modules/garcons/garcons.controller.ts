import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GarconsService } from './garcons.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Garcons')
@Controller('garcons')
export class GarconsController {
  constructor(private garconsService: GarconsService) {}

  @Get('vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Param('vendedorId') vendedorId: string) {
    return this.garconsService.findAll(vendedorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findById(@Param('id') id: string) {
    return this.garconsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() data: any) {
    return this.garconsService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() data: any) {
    return this.garconsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.garconsService.remove(id);
  }
}
