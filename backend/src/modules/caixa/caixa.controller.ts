import { Controller, Get, Post, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CaixaService } from './caixa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Caixa')
@Controller('caixa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CaixaController {
  constructor(
    private caixaService: CaixaService,
    private prisma: PrismaService,
  ) {}

  @Post('fechar')
  async fechar(@CurrentUser('id') userId: string) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.caixaService.fechar(vendedorId);
  }

  @Get('historico')
  async historico(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.caixaService.historico(vendedorId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('ultimo')
  async ultimo(@CurrentUser('id') userId: string) {
    const vendedorId = await this.resolveVendedor(userId);
    return this.caixaService.ultimo(vendedorId);
  }

  private async resolveVendedor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vendedor: true },
    });
    if (!user?.vendedor) throw new NotFoundException('Vendedor nao encontrado');
    return user.vendedor.id;
  }
}
