import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email ja cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    const user = await this.prisma.user.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        senha: senhaHash,
        role: 'VENDEDOR',
        vendedor: {
          create: {
            nomeLoja: dto.nomeLoja || dto.nome,
            slug: dto.slug || dto.email.split('@')[0],
          },
        },
      },
      include: { vendedor: true },
    });

    const planoGratuito = await this.prisma.plano.findUnique({
      where: { slug: 'gratuito' },
    });

    if (planoGratuito && user.vendedor) {
      await this.prisma.assinatura.create({
        data: {
          vendedorId: user.vendedor.id,
          planoId: planoGratuito.id,
          plano: planoGratuito.nome,
          preco: 0,
          status: 'ATIVA',
        },
      });
    }

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { vendedor: true, cliente: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    if (!user.ativo) {
      throw new UnauthorizedException('Conta desativada');
    }

    const senhaValida = await bcrypt.compare(dto.senha, user.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.jwtRefreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { vendedor: true, cliente: true },
      });

      if (!user || !user.ativo) {
        throw new UnauthorizedException('Usuario invalido');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        vendedor: {
          select: {
            id: true,
            nomeLoja: true,
            slug: true,
            descricao: true,
            logoUrl: true,
            bannerUrl: true,
            corPrimaria: true,
            corSecundaria: true,
            whatsappConectado: true,
            whatsappNumero: true,
            rua: true,
            numero: true,
            bairro: true,
            endereco: true,
            cidade: true,
            estado: true,
            cep: true,
            entregaTipo: true,
            taxaEntrega: true,
            tempoPreparoMin: true,
            horarioFuncionamento: true,
            diasFuncionamento: true,
            modoEscuro: true,
            lojaAberta: true,
            assinatura: true,
          },
        },
        cliente: true,
      },
    });

    return user;
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.jwtRefreshSecret,
      expiresIn: this.configService.jwtRefreshExpiration,
    });

    await this.prisma.sessao.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { senha, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }
}
