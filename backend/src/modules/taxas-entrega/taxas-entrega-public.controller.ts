import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TaxasEntregaService } from './taxas-entrega.service';

@ApiTags('Taxas de Entrega Publico')
@Controller('public/taxas-entrega')
export class TaxasEntregaPublicController {
  constructor(private taxasEntregaService: TaxasEntregaService) {}

  @Post('calcular')
  async calcular(@Body() data: { vendedorId: string; latitude: number; longitude: number }) {
    const distancia = await this.taxasEntregaService.calcularDistancia(data.vendedorId, data.latitude, data.longitude);
    const taxa = await this.taxasEntregaService.calcularTaxa(data.vendedorId, distancia);
    return { distancia, taxa };
  }
}
