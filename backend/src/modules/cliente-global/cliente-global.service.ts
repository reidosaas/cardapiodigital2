import { Injectable, NotFoundException, ConflictException, UnauthorizedException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AdminNotifyService } from '../admin-notify/admin-notify.service';

@Injectable()
export class ClienteGlobalService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => AdminNotifyService)) private adminNotify: AdminNotifyService,
  ) {}

  async cadastro(data: { nome: string; email: string; senha: string; telefone?: string }) {
    const emailLower = data.email.trim().toLowerCase();

    const existing = await this.prisma.clienteGlobal.findUnique({ where: { email: emailLower } });
    if (existing) throw new ConflictException('Email ja cadastrado. Faca login.');

    const hashedSenha = await bcrypt.hash(data.senha, 10);

    const cliente = await this.prisma.clienteGlobal.create({
      data: {
        nome: data.nome.trim(),
        email: emailLower,
        senha: hashedSenha,
        telefone: data.telefone?.replace(/\D/g, '') || null,
      },
    });

    this.adminNotify.notificarCadastro('cliente', {
      nome: data.nome.trim(),
      email: emailLower,
      telefone: data.telefone,
    }).catch(() => {});

    return { mensagem: 'Cadastro realizado com sucesso! Faca login.', id: cliente.id };
  }

  async login(email: string, senha: string) {
    const emailLower = email.trim().toLowerCase();

    const cliente = await this.prisma.clienteGlobal.findUnique({
      where: { email: emailLower },
    });

    if (!cliente || !cliente.ativo) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    const senhaValida = await bcrypt.compare(senha, cliente.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    const payload = {
      sub: cliente.id,
      email: cliente.email,
      role: 'CLIENTE' as const,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
      },
    };
  }

  async validateToken(payload: any) {
    const cliente = await this.prisma.clienteGlobal.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true, telefone: true, ativo: true },
    });
    if (!cliente || !cliente.ativo) {
      throw new NotFoundException('Cliente nao encontrado ou inativo');
    }
    return {
      id: cliente.id,
      email: cliente.email,
      nome: cliente.nome,
      role: 'CLIENTE',
    };
  }

  async getPerfil(clienteId: string) {
    const cliente = await this.prisma.clienteGlobal.findUnique({
      where: { id: clienteId },
      select: { id: true, nome: true, email: true, telefone: true, createdAt: true },
    });
    if (!cliente) throw new NotFoundException('Cliente nao encontrado');
    return cliente;
  }

  async updatePerfil(clienteId: string, data: { nome?: string; telefone?: string; senhaAtual?: string; novaSenha?: string }) {
    const cliente = await this.prisma.clienteGlobal.findUnique({ where: { id: clienteId } });
    if (!cliente) throw new NotFoundException('Cliente nao encontrado');

    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.telefone !== undefined) updateData.telefone = data.telefone.replace(/\D/g, '') || null;

    const novaSenha = data.novaSenha?.trim();
    if (novaSenha) {
      const senhaValida = await bcrypt.compare(data.senhaAtual || '', cliente.senha);
      if (!senhaValida) {
        throw new UnauthorizedException('Senha atual incorreta');
      }
      updateData.senha = await bcrypt.hash(novaSenha, 10);
    }

    await this.prisma.clienteGlobal.update({ where: { id: clienteId }, data: updateData });

    return { mensagem: 'Perfil atualizado com sucesso' };
  }

  async getEnderecos(clienteId: string) {
    return this.prisma.enderecoClienteGlobal.findMany({
      where: { clienteGlobalId: clienteId },
      orderBy: { principal: 'desc' },
    });
  }

  async createEndereco(clienteId: string, data: {
    rotulo?: string; logradouro: string; numero: string;
    complemento?: string; bairro: string; cidade: string;
    estado: string; cep: string; principal?: boolean;
  }) {
    if (data.principal) {
      await this.prisma.enderecoClienteGlobal.updateMany({
        where: { clienteGlobalId: clienteId, principal: true },
        data: { principal: false },
      });
    }

    return this.prisma.enderecoClienteGlobal.create({
      data: { ...data, clienteGlobalId: clienteId },
    });
  }

  async updateEndereco(clienteId: string, enderecoId: string, data: {
    rotulo?: string; logradouro?: string; numero?: string;
    complemento?: string; bairro?: string; cidade?: string;
    estado?: string; cep?: string; principal?: boolean;
  }) {
    const endereco = await this.prisma.enderecoClienteGlobal.findFirst({
      where: { id: enderecoId, clienteGlobalId: clienteId },
    });
    if (!endereco) throw new NotFoundException('Endereco nao encontrado');

    if (data.principal) {
      await this.prisma.enderecoClienteGlobal.updateMany({
        where: { clienteGlobalId: clienteId, principal: true },
        data: { principal: false },
      });
    }

    return this.prisma.enderecoClienteGlobal.update({
      where: { id: enderecoId },
      data,
    });
  }

  async deleteEndereco(clienteId: string, enderecoId: string) {
    const endereco = await this.prisma.enderecoClienteGlobal.findFirst({
      where: { id: enderecoId, clienteGlobalId: clienteId },
    });
    if (!endereco) throw new NotFoundException('Endereco nao encontrado');

    await this.prisma.enderecoClienteGlobal.delete({ where: { id: enderecoId } });
    return { mensagem: 'Endereco removido com sucesso' };
  }

  async getPedidos(clienteId: string, vendedorId?: string) {
    const where: any = { clienteGlobalId: clienteId };
    if (vendedorId) where.vendedorId = vendedorId;

    const pedidos = await this.prisma.pedido.findMany({
      where,
      include: {
        vendedor: { select: { id: true, nomeLoja: true, slug: true, logoUrl: true } },
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                categoriaId: true,
                categoriaGlobalId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pedidos;
  }
}
