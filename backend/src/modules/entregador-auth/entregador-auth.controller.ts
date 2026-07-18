import { Controller, Post, Body, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { EntregadorAuthService } from './entregador-auth.service';
import { EntregadorAuthGuard } from './entregador-auth.guard';

@Controller('entregador-auth')
export class EntregadorAuthController {
  constructor(private readonly service: EntregadorAuthService) {}

  @Post('cadastro')
  async cadastro(@Body() body: { nome: string; email: string; senha: string; telefone?: string }) {
    return this.service.cadastro(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; senha: string }) {
    return this.service.login(body.email, body.senha);
  }

  @Post('select-store')
  async selectStore(@Body() body: { tempToken: string; vendedorId: string }) {
    return this.service.selectStore(body.tempToken, body.vendedorId);
  }

  @Get('lojas')
  async getLojas(@Req() req: any) {
    const entregadorId = req.user?.sub || req.headers['x-entregador-id'];
    return this.service.getLojas(entregadorId);
  }

  @Get('me')
  async me(@Req() req: any) {
    return this.service.validateToken({ sub: req.user?.sub || req.headers['x-entregador-id'], ...req.user });
  }

  @UseGuards(EntregadorAuthGuard)
  @Get('perfil')
  async getPerfil(@Req() req: any) {
    return this.service.getPerfil(req.user.id);
  }

  @UseGuards(EntregadorAuthGuard)
  @Patch('perfil')
  async updatePerfil(
    @Req() req: any,
    @Body() body: { nome?: string; cpf?: string; chavePix?: string; senhaAtual?: string; novaSenha?: string },
  ) {
    return this.service.updatePerfil(req.user.id, body);
  }
}
