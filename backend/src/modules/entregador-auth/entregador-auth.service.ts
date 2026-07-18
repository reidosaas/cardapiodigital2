import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EntregadorAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async cadastro(data: { nome: string; email: string; senha: string; telefone?: string }) {
    const emailLower = data.email.trim().toLowerCase();
    const telefone = data.telefone?.replace(/\D/g, '') || undefined;

    const existing = await this.prisma.entregador.findFirst({ where: { email: emailLower } });
    if (existing) throw new ConflictException('Email ja cadastrado. Faca login.');

    if (telefone) {
      const telExiste = await this.prisma.entregador.findFirst({ where: { telefone } });
      if (telExiste) throw new ConflictException('Telefone ja cadastrado. Faca login.');
    }

    const hashedSenha = await bcrypt.hash(data.senha, 10);

    const entregador = await this.prisma.entregador.create({
      data: {
        nome: data.nome,
        email: emailLower,
        senha: hashedSenha,
        telefone,
      },
    });

    return { mensagem: 'Cadastro realizado com sucesso! Faca login.', id: entregador.id };
  }

  async login(email: string, senha: string) {
    const emailLower = email.trim().toLowerCase();

    const entregador = await this.prisma.entregador.findFirst({
      where: { email: emailLower, ativo: true },
      include: {
        lojas: {
          where: { ativo: true },
          include: { vendedor: { select: { id: true, nomeLoja: true, slug: true } } },
        },
      },
    });

    if (!entregador || !entregador.senha) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    const senhaValida = await bcrypt.compare(senha, entregador.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    const lojasAtivas = entregador.lojas.filter((l) => l.status === 'ACEITO');
    const vinculosPendentes = entregador.lojas.filter((l) => l.status === 'PENDENTE').map((l) => ({
      id: l.vendedorId,
      lojaId: l.id,
      nomeLoja: l.vendedor.nomeLoja,
      slug: l.vendedor.slug,
      diaria: l.diaria,
      valorPorEntrega: l.valorPorEntrega,
    }));

    if (lojasAtivas.length === 0 && vinculosPendentes.length === 0) {
      const payload = {
        sub: entregador.id,
        email: entregador.email,
        role: 'ENTREGADOR' as const,
        vendedorId: null,
        lojaId: null,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '12h' });

      return {
        accessToken,
        entregador: {
          id: entregador.id,
          nome: entregador.nome,
          email: entregador.email,
          telefone: entregador.telefone,
        },
        loja: null,
        aguardandoVinculo: true,
      };
    }

    if (lojasAtivas.length === 0 && vinculosPendentes.length > 0) {
      const payload = {
        sub: entregador.id,
        email: entregador.email,
        role: 'ENTREGADOR' as const,
        vendedorId: null,
        lojaId: null,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '12h' });

      return {
        accessToken,
        entregador: {
          id: entregador.id,
          nome: entregador.nome,
          email: entregador.email,
          telefone: entregador.telefone,
        },
        loja: null,
        vinculosPendentes,
      };
    }

    if (lojasAtivas.length === 1) {
      const loja = lojasAtivas[0];
      const payload = {
        sub: entregador.id,
        email: entregador.email,
        role: 'ENTREGADOR' as const,
        vendedorId: loja.vendedorId,
        lojaId: loja.id,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '12h' });

      return {
        accessToken,
        entregador: {
          id: entregador.id,
          nome: entregador.nome,
          email: entregador.email,
          telefone: entregador.telefone,
        },
        loja: {
          id: loja.vendedorId,
          nomeLoja: loja.vendedor.nomeLoja,
          slug: loja.vendedor.slug,
          diaria: loja.diaria,
          valorPorEntrega: loja.valorPorEntrega,
        },
        vinculosPendentes,
      };
    }

    const tempToken = this.jwtService.sign(
      { sub: entregador.id, type: 'entregador_select_store' },
      { expiresIn: '5m' },
    );

    return {
      requiresStoreSelection: true,
      tempToken,
      entregador: {
        id: entregador.id,
        nome: entregador.nome,
        email: entregador.email,
      },
      lojas: lojasAtivas.map((l) => ({
        id: l.vendedorId,
        lojaId: l.id,
        nomeLoja: l.vendedor.nomeLoja,
        slug: l.vendedor.slug,
        diaria: l.diaria,
        valorPorEntrega: l.valorPorEntrega,
      })),
      vinculosPendentes,
    };
  }

  async selectStore(tempToken: string, vendedorId: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Token expirado. Faca login novamente.');
    }

    if (payload.type !== 'entregador_select_store') {
      throw new UnauthorizedException('Token invalido');
    }

    const loja = await this.prisma.entregadorLoja.findFirst({
      where: {
        entregadorId: payload.sub,
        vendedorId,
        ativo: true,
      },
      include: { vendedor: { select: { id: true, nomeLoja: true, slug: true } } },
    });

    if (!loja) {
      throw new NotFoundException('Voce nao esta vinculado a esta loja');
    }

    const entregador = await this.prisma.entregador.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true, telefone: true },
    });
    if (!entregador) throw new NotFoundException('Entregador nao encontrado');

    const accessToken = this.jwtService.sign(
      {
        sub: entregador.id,
        email: entregador.email,
        role: 'ENTREGADOR' as const,
        vendedorId: loja.vendedorId,
        lojaId: loja.id,
      },
      { expiresIn: '12h' },
    );

    return {
      accessToken,
      entregador,
      loja: {
        id: loja.vendedorId,
        nomeLoja: loja.vendedor.nomeLoja,
        slug: loja.vendedor.slug,
        diaria: loja.diaria,
        valorPorEntrega: loja.valorPorEntrega,
      },
    };
  }

  async validateToken(payload: any) {
    const entregador = await this.prisma.entregador.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true, telefone: true, ativo: true },
    });
    if (!entregador || !entregador.ativo) {
      throw new NotFoundException('Entregador nao encontrado ou inativo');
    }
    return {
      id: entregador.id,
      email: entregador.email,
      nome: entregador.nome,
      role: 'ENTREGADOR',
      vendedorId: payload.vendedorId,
      lojaId: payload.lojaId,
    };
  }

  async getPerfil(entregadorId: string) {
    const entregador = await this.prisma.entregador.findUnique({
      where: { id: entregadorId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cpf: true,
        chavePix: true,
      },
    });
    if (!entregador) throw new NotFoundException('Entregador nao encontrado');
    return entregador;
  }

  async updatePerfil(
    entregadorId: string,
    data: { nome?: string; cpf?: string; chavePix?: string; senhaAtual?: string; novaSenha?: string },
  ) {
    const entregador = await this.prisma.entregador.findUnique({ where: { id: entregadorId } });
    if (!entregador) throw new NotFoundException('Entregador nao encontrado');

    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.cpf !== undefined) updateData.cpf = data.cpf.replace(/\D/g, '') || null;
    if (data.chavePix !== undefined) updateData.chavePix = data.chavePix.trim() || null;

    const novaSenha = data.novaSenha?.trim();
    if (novaSenha) {
      if (!entregador.senha) {
        throw new UnauthorizedException('Conta sem senha definida');
      }
      const senhaValida = await bcrypt.compare(data.senhaAtual || '', entregador.senha);
      if (!senhaValida) {
        throw new UnauthorizedException('Senha atual incorreta');
      }
      updateData.senha = await bcrypt.hash(novaSenha, 10);
    }

    await this.prisma.entregador.update({ where: { id: entregadorId }, data: updateData });

    return { mensagem: 'Perfil atualizado com sucesso' };
  }

  async getLojas(entregadorId: string) {
    const lojas = await this.prisma.entregadorLoja.findMany({
      where: { entregadorId, ativo: true },
      include: { vendedor: { select: { id: true, nomeLoja: true, slug: true } } },
    });
    return lojas.map((l) => ({
      id: l.vendedorId,
      nomeLoja: l.vendedor.nomeLoja,
      slug: l.vendedor.slug,
      diaria: l.diaria,
      valorPorEntrega: l.valorPorEntrega,
    }));
  }
}
