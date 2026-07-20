import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async listVendedores() {
    const users = await this.prisma.user.findMany({
      where: { role: 'VENDEDOR' },
      include: {
        vendedor: { select: { id: true, nomeLoja: true, slug: true, ativo: true } },
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
    }));
  }

  async resetPassword(tipo: 'VENDEDOR' | 'ENTREGADOR' | 'CLIENTE', id: string, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
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
