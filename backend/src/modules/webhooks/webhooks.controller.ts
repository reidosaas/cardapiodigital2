import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('mercadopago')
  async mercadopago(@Body() payload: any) {
    return this.webhooksService.processarMercadoPago(payload);
  }

  @Post('stripe')
  async stripe(@Body() payload: any) {
    return this.webhooksService.processarStripe(payload);
  }

  @Post('evolution-api')
  async evolutionApi(@Body() payload: any) {
    return this.webhooksService.processarEvolutionApi(payload);
  }
}
