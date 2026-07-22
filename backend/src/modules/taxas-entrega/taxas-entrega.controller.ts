import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TaxasEntregaService } from './taxas-entrega.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Taxas de Entrega por Distancia')
@Controller('taxas-entrega')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaxasEntregaController {
  constructor(
    private taxasEntregaService: TaxasEntregaService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.taxasEntregaService.findAll(vendedorId);
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() data: { distanciaMinKm: number; distanciaMaxKm: number; valor: number },
  ) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.taxasEntregaService.create(vendedorId, data);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: { distanciaMinKm?: number; distanciaMaxKm?: number; valor?: number; ativo?: boolean },
  ) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.taxasEntregaService.update(id, vendedorId, data);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.taxasEntregaService.remove(id, vendedorId);
  }

  @Post('calcular')
  async calcular(
    @CurrentUser('id') userId: string,
    @Body() data: { vendedorId: string; latitude: number; longitude: number },
  ) {
    const distancia = await this.taxasEntregaService.calcularDistancia(data.vendedorId, data.latitude, data.longitude);
    const taxa = await this.taxasEntregaService.calcularTaxa(data.vendedorId, distancia);
    return { distancia, taxa };
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
