import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { EntregadorAuthService } from './entregador-auth.service';

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
}
