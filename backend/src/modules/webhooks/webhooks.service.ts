import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async processarMercadoPago(payload: any) {
    this.logger.log('Webhook Mercado Pago recebido');
    const { action, data } = payload;

    if (action === 'payment.updated' && data?.id) {
      const pagamento = await this.prisma.pagamento.findFirst({
        where: { transactionId: String(data.id) },
      });

      if (pagamento) {
        await this.prisma.pagamento.update({
          where: { id: pagamento.id },
          data: { status: 'APROVADO', pagoEm: new Date() },
        });

        await this.prisma.pedido.update({
          where: { id: pagamento.pedidoId },
          data: { status: 'CONFIRMADO' },
        });

        this.logger.log(`Pagamento ${data.id} aprovado via webhook`);
      }
    }

    return { received: true };
  }

  async processarStripe(payload: any) {
    this.logger.log('Webhook Stripe recebido');
    return { received: true };
  }

  async processarEvolutionApi(payload: any) {
    this.logger.log('Webhook Evolution API recebido');
    return { received: true };
  }
}
