import { Controller, Post, Body, Get, Patch, Delete, Param, Req, UseGuards, Query } from '@nestjs/common';
import { ClienteGlobalService } from './cliente-global.service';
import { ClienteGlobalAuthGuard } from './cliente-global-auth.guard';

@Controller('cliente-global')
export class ClienteGlobalController {
  constructor(private readonly service: ClienteGlobalService) {}

  @Post('cadastro')
  async cadastro(@Body() body: { nome: string; email: string; senha: string; telefone?: string }) {
    return this.service.cadastro(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; senha: string }) {
    return this.service.login(body.email, body.senha);
  }

  @UseGuards(ClienteGlobalAuthGuard)
  @Get('perfil')
  async getPerfil(@Req() req: any) {
    return this.service.getPerfil(req.user.id);
  }

  @UseGuards(ClienteGlobalAuthGuard)
  @Patch('perfil')
  async updatePerfil(
    @Req() req: any,
    @Body() body: { nome?: string; telefone?: string; senhaAtual?: string; novaSenha?: string },
  ) {
    return this.service.updatePerfil(req.user.id, body);
  }

  @UseGuards(ClienteGlobalAuthGuard)
  @Get('enderecos')
  async getEnderecos(@Req() req: any) {
    return this.service.getEnderecos(req.user.id);
  }

  @UseGuards(ClienteGlobalAuthGuard)
  @Post('enderecos')
  async createEndereco(
    @Req() req: any,
    @Body() body: { rotulo?: string; logradouro: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; cep: string; principal?: boolean },
  ) {
    return this.service.createEndereco(req.user.id, body);
  }

  @UseGuards(ClienteGlobalAuthGuard)
  @Patch('enderecos/:id')
  async updateEndereco(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { rotulo?: string; logradouro?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string; cep?: string; principal?: boolean },
  ) {
    return this.service.updateEndereco(req.user.id, id, body);
  }

  @UseGuards(ClienteGlobalAuthGuard)
  @Delete('enderecos/:id')
  async deleteEndereco(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteEndereco(req.user.id, id);
  }

  @UseGuards(ClienteGlobalAuthGuard)
  @Get('pedidos')
  async getPedidos(@Req() req: any, @Query('vendedorId') vendedorId?: string) {
    return this.service.getPedidos(req.user.id, vendedorId);
  }
}
