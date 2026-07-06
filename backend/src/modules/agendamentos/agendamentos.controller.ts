import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AgendamentosService } from './agendamentos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Agendamentos')
@Controller('agendamentos')
export class AgendamentosController {
  constructor(private agendamentosService: AgendamentosService) {}

  @Get('vendedor/:vendedorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(
    @Param('vendedorId') vendedorId: string,
    @Query('data') data?: string,
    @Query('status') status?: string,
  ) {
    return this.agendamentosService.findAll(vendedorId, { data, status });
  }

  @Get('horarios/:vendedorId')
  async getHorarios(@Param('vendedorId') vendedorId: string, @Query('data') data: string) {
    return this.agendamentosService.getHorariosDisponiveis(vendedorId, data);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.agendamentosService.findById(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.agendamentosService.create(data);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.agendamentosService.updateStatus(id, status);
  }
}
