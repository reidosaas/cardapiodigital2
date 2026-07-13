import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DespesasService } from './despesas.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Despesas')
@Controller('despesas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DespesasController {
  constructor(
    private despesasService: DespesasService,
    private prisma: PrismaService,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() data: { descricao: string; valor: number; categoria?: string; data?: string },
  ) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.despesasService.create(vendedorId, data);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.despesasService.findAll(vendedorId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('dashboard')
  async getDashboard(@CurrentUser('id') userId: string) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.despesasService.getDashboard(vendedorId);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: { descricao?: string; valor?: number; categoria?: string; data?: string },
  ) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.despesasService.update(id, vendedorId, data);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.despesasService.remove(id, vendedorId);
  }

  private async resolveVendedor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vendedor: true },
    });
    if (!user?.vendedor) throw new NotFoundException('Vendedor nao encontrado');
    return user.vendedor.id;
  }
}