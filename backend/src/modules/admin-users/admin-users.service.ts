import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async listVendedores() {
    const users = await this.prisma.user.findMany({
      where: { role: 'VENDEDOR' },
      include: {
        vendedor: {
          include: {
            _count: { select: { produtos: true, pedidos: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => ({
      id: u.id,
      tipo: 'VENDEDOR' as const,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone,
      loja: u.vendedor?.nomeLoja || '-',
      slug: u.vendedor?.slug || '-',
      ativo: u.ativo,
      vendedorId: u.vendedor?.id,
      produtos: u.vendedor?._count?.produtos || 0,
      pedidos: u.vendedor?._count?.pedidos || 0,
      createdAt: u.createdAt,
    }));
  }

  async listEntregadores() {
    const entregadores = await this.prisma.entregador.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return entregadores.map((e) => ({
      id: e.id,
      tipo: 'ENTREGADOR' as const,
      nome: e.nome,
      email: e.email || '-',
      telefone: e.telefone || '-',
      temSenha: !!e.senha,
      ativo: e.ativo,
      createdAt: e.createdAt,
    }));
  }

  async listClientes() {
    const clientes = await this.prisma.clienteGlobal.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return clientes.map((c) => ({
      id: c.id,
      tipo: 'CLIENTE' as const,
      nome: c.nome,
      email: c.email,
      telefone: c.telefone || '-',
      ativo: c.ativo,
      createdAt: c.createdAt,
    }));
  }

  async toggleActive(tipo: 'VENDEDOR' | 'ENTREGADOR' | 'CLIENTE', id: string) {
    if (tipo === 'VENDEDOR') {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Vendedor nao encontrado');
      await this.prisma.user.update({ where: { id }, data: { ativo: !user.ativo } });
      return { ok: true, ativo: !user.ativo, mensagem: user.ativo ? 'Vendedor bloqueado' : 'Vendedor desbloqueado' };
    }

    if (tipo === 'ENTREGADOR') {
      const entregador = await this.prisma.entregador.findUnique({ where: { id } });
      if (!entregador) throw new NotFoundException('Entregador nao encontrado');
      await this.prisma.entregador.update({ where: { id }, data: { ativo: !entregador.ativo } });
      return { ok: true, ativo: !entregador.ativo, mensagem: entregador.ativo ? 'Entregador bloqueado' : 'Entregador desbloqueado' };
    }

    if (tipo === 'CLIENTE') {
      const cliente = await this.prisma.clienteGlobal.findUnique({ where: { id } });
      if (!cliente) throw new NotFoundException('Cliente nao encontrado');
      await this.prisma.clienteGlobal.update({ where: { id }, data: { ativo: !cliente.ativo } });
      return { ok: true, ativo: !cliente.ativo, mensagem: cliente.ativo ? 'Cliente bloqueado' : 'Cliente desbloqueado' };
    }
  }

  async updateUser(tipo: 'VENDEDOR' | 'ENTREGADOR' | 'CLIENTE', id: string, data: { nome?: string; email?: string; telefone?: string; nomeLoja?: string }) {
    if (tipo === 'VENDEDOR') {
      const user = await this.prisma.user.findUnique({ where: { id }, include: { vendedor: true } });
      if (!user) throw new NotFoundException('Vendedor nao encontrado');
      await this.prisma.user.update({
        where: { id },
        data: {
          nome: data.nome ?? user.nome,
          email: data.email ?? user.email,
          telefone: data.telefone ?? user.telefone,
        },
      });
      if (data.nomeLoja && user.vendedor) {
        await this.prisma.vendedor.update({
          where: { id: user.vendedor.id },
          data: { nomeLoja: data.nomeLoja },
        });
      }
      return { ok: true, mensagem: 'Vendedor atualizado' };
    }

    if (tipo === 'ENTREGADOR') {
      const entregador = await this.prisma.entregador.findUnique({ where: { id } });
      if (!entregador) throw new NotFoundException('Entregador nao encontrado');
      await this.prisma.entregador.update({
        where: { id },
        data: {
          nome: data.nome ?? entregador.nome,
          email: data.email ?? entregador.email,
          telefone: data.telefone ?? entregador.telefone,
        },
      });
      return { ok: true, mensagem: 'Entregador atualizado' };
    }

    if (tipo === 'CLIENTE') {
      const cliente = await this.prisma.clienteGlobal.findUnique({ where: { id } });
      if (!cliente) throw new NotFoundException('Cliente nao encontrado');
      await this.prisma.clienteGlobal.update({
        where: { id },
        data: {
          nome: data.nome ?? cliente.nome,
          email: data.email ?? cliente.email,
          telefone: data.telefone ?? cliente.telefone,
        },
      });
      return { ok: true, mensagem: 'Cliente atualizado' };
    }
  }

  async deleteUser(tipo: 'VENDEDOR' | 'ENTREGADOR' | 'CLIENTE', id: string) {
    if (tipo === 'VENDEDOR') {
      const user = await this.prisma.user.findUnique({ where: { id }, include: { vendedor: true } });
      if (!user) throw new NotFoundException('Vendedor nao encontrado');

      if (user.vendedor) {
        await this.prisma.entrega.deleteMany({ where: { pedido: { vendedorId: user.vendedor.id } } });
        await this.prisma.pedido.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.entregadorLoja.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.entregadorCheckin.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.produto.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.categoria.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.banner.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.despesa.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.mesa.deleteMany({ where: { vendedorId: user.vendedor.id } });
        await this.prisma.vendedor.delete({ where: { id: user.vendedor.id } });
      }
      await this.prisma.user.delete({ where: { id } });
      return { ok: true, mensagem: 'Vendedor excluido' };
    }

    if (tipo === 'ENTREGADOR') {
      const entregador = await this.prisma.entregador.findUnique({ where: { id } });
      if (!entregador) throw new NotFoundException('Entregador nao encontrado');
      await this.prisma.entrega.deleteMany({ where: { entregadorId: id } });
      await this.prisma.entregadorLoja.deleteMany({ where: { entregadorId: id } });
      await this.prisma.entregadorCheckin.deleteMany({ where: { entregadorId: id } });
      await this.prisma.entregador.delete({ where: { id } });
      return { ok: true, mensagem: 'Entregador excluido' };
    }

    if (tipo === 'CLIENTE') {
      const cliente = await this.prisma.clienteGlobal.findUnique({ where: { id } });
      if (!cliente) throw new NotFoundException('Cliente nao encontrado');
      await this.prisma.pedido.deleteMany({ where: { clienteId: id } });
      await this.prisma.clienteGlobal.delete({ where: { id } });
      return { ok: true, mensagem: 'Cliente excluido' };
    }
  }

  async resetPassword(tipo: 'VENDEDOR' | 'ENTREGADOR' | 'CLIENTE', id: string, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres');
    }

    const hashed = await bcrypt.hash(novaSenha, 10);

    if (tipo === 'VENDEDOR') {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Vendedor nao encontrado');
      await this.prisma.user.update({ where: { id }, data: { senha: hashed } });
      return { ok: true, mensagem: `Senha de ${user.nome} atualizada` };
    }

    if (tipo === 'ENTREGADOR') {
      const entregador = await this.prisma.entregador.findUnique({ where: { id } });
      if (!entregador) throw new NotFoundException('Entregador nao encontrado');
      await this.prisma.entregador.update({ where: { id }, data: { senha: hashed } });
      return { ok: true, mensagem: `Senha de ${entregador.nome} atualizada` };
    }

    if (tipo === 'CLIENTE') {
      const cliente = await this.prisma.clienteGlobal.findUnique({ where: { id } });
      if (!cliente) throw new NotFoundException('Cliente nao encontrado');
      await this.prisma.clienteGlobal.update({ where: { id }, data: { senha: hashed } });
      return { ok: true, mensagem: `Senha de ${cliente.nome} atualizada` };
    }
  }
}
