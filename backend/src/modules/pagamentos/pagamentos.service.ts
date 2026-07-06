import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class PagamentosService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(data: {
    pedidoId: string;
    metodo: string;
    valor: number;
  }) {
    return this.prisma.pagamento.create({
      data: {
        pedidoId: data.pedidoId,
        metodo: data.metodo as any,
        valor: data.valor,
      },
    });
  }

  async findById(id: string) {
    const pagamento = await this.prisma.pagamento.findUnique({
      where: { id },
      include: { pedido: true },
    });
    if (!pagamento) throw new NotFoundException('Pagamento nao encontrado');
    return pagamento;
  }

  async gerarPix(pedidoId: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagamento: true },
    });

    if (!pedido) throw new NotFoundException('Pedido nao encontrado');

    const payload = {
      txid: `CARDAPIO${Date.now()}`,
      calendario: { expiracao: 3600 },
      valor: { original: pedido.total.toFixed(2) },
      chave: this.configService.get('PIX_KEY', ''),
      solicitacaoPagador: `Pedido #${pedido.id.slice(0, 8)}`,
    };

    const qrCode = JSON.stringify(payload);

    return this.prisma.pagamento.upsert({
      where: { pedidoId },
      create: {
        pedidoId,
        metodo: 'PIX',
        valor: pedido.total,
        qrCodePix: qrCode,
        codigoPix: payload.txid,
      },
      update: {
        qrCodePix: qrCode,
        codigoPix: payload.txid,
      },
    });
  }

  async gerarLinkPagamento(pedidoId: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagamento: true, vendedor: true },
    });

    if (!pedido) throw new NotFoundException('Pedido nao encontrado');

    const link = `${this.configService.frontendUrl}/pagamento/${pedidoId}`;

    return this.prisma.pagamento.upsert({
      where: { pedidoId },
      create: {
        pedidoId,
        metodo: 'CARTAO_CREDITO',
        valor: pedido.total,
        linkPagamento: link,
      },
      update: {
        linkPagamento: link,
      },
    });
  }

  async confirmarPagamento(pedidoId: string, transactionId?: string) {
    const pagamento = await this.prisma.pagamento.findUnique({
      where: { pedidoId },
    });

    if (!pagamento) throw new NotFoundException('Pagamento nao encontrado');

    return this.prisma.$transaction([
      this.prisma.pagamento.update({
        where: { pedidoId },
        data: {
          status: 'APROVADO',
          transactionId,
          pagoEm: new Date(),
        },
      }),
      this.prisma.pedido.update({
        where: { id: pedidoId },
        data: { status: 'CONFIRMADO' },
      }),
    ]);
  }

  async recusarPagamento(pedidoId: string) {
    return this.prisma.pagamento.update({
      where: { pedidoId },
      data: { status: 'RECUSADO' },
    });
  }
}
