import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class VendedoresService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  async findAll() {
    return this.prisma.vendedor.findMany({
      include: {
        user: { select: { id: true, nome: true, email: true, ativo: true } },
        _count: { select: { produtos: true, pedidos: true, clientes: true } },
        assinatura: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const vendedor = await this.prisma.vendedor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true, avatarUrl: true } },
        categorias: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        banners: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        assinatura: true,
        _count: { select: { produtos: true, pedidos: true, clientes: true } },
      },
    });

    if (!vendedor) throw new NotFoundException('Vendedor nao encontrado');
    return vendedor;
  }

  async findBySlug(slug: string) {
    const vendedor = await this.prisma.vendedor.findUnique({
      where: { slug },
      include: {
        categorias: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        banners: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        _count: { select: { produtos: true } },
      },
    });

    if (!vendedor || !vendedor.ativo) throw new NotFoundException('Loja nao encontrada');
    return vendedor;
  }

  async toggleLoja(id: string) {
    const vendedor = await this.prisma.vendedor.findUnique({ where: { id } });
    if (!vendedor) throw new NotFoundException('Vendedor nao encontrado');

    const lojaAberta = !vendedor.lojaAberta;

    if (lojaAberta) {
      const pendentes = await this.prisma.notificacaoLoja.findMany({
        where: { vendedorId: id, notificado: false },
      });
      for (const n of pendentes) {
        try {
          await this.whatsappService.enviarMensagem(
            n.telefone,
            `Olá ${n.nome}! A loja "${vendedor.nomeLoja}" acabou de abrir! Ja estamos prontos para receber seu pedido.`,
            id,
          );
          await this.prisma.notificacaoLoja.update({
            where: { id: n.id },
            data: { notificado: true },
          });
        } catch (err) {
          console.error(`Erro ao notificar ${n.telefone}:`, err);
        }
      }
    }

    return this.prisma.vendedor.update({
      where: { id },
      data: { lojaAberta },
      select: { id: true, lojaAberta: true },
    });
  }

  async avisarAbertura(vendedorId: string, nome: string, telefone: string) {
    const vendedor = await this.prisma.vendedor.findUnique({ where: { id: vendedorId } });
    if (!vendedor) throw new NotFoundException('Vendedor nao encontrado');
    return this.prisma.notificacaoLoja.create({
      data: { vendedorId, nome, telefone },
    });
  }

  async update(id: string, data: any) {
    const vendedor = await this.prisma.vendedor.findUnique({ where: { id } });
    if (!vendedor) throw new NotFoundException('Vendedor nao encontrado');

    if (data.slug) {
      const existing = await this.prisma.vendedor.findUnique({ where: { slug: data.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug ja esta em uso');
      }
    }

    return this.prisma.vendedor.update({
      where: { id },
      data,
    });
  }

  async getDashboard(id: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      vendedor,
      totalPedidos,
      pedidosHoje,
      totalClientes,
      totalProdutos,
      pedidosRecentes,
      vendasMes,
    ] = await Promise.all([
      this.prisma.vendedor.findUnique({ where: { id } }),
      this.prisma.pedido.count({ where: { vendedorId: id } }),
      this.prisma.pedido.count({
        where: { vendedorId: id, createdAt: { gte: today } },
      }),
      this.prisma.cliente.count({ where: { vendedorId: id } }),
      this.prisma.produto.count({ where: { vendedorId: id, ativo: true } }),
      this.prisma.pedido.findMany({
        where: { vendedorId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { pagamento: true },
      }),
      this.prisma.pedido.aggregate({
        where: {
          vendedorId: id,
          createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
          status: { not: 'CANCELADO' },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalPedidos,
      pedidosHoje,
      totalClientes,
      totalProdutos,
      faturamentoMes: vendasMes._sum.total || 0,
      pedidosRecentes,
      lojaAberta: vendedor?.lojaAberta ?? true,
    };
  }
}
