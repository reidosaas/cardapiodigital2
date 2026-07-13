import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MesasService, MesaStatus } from './mesas.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Mesas')
@Controller('mesas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MesasController {
  constructor(
    private mesasService: MesasService,
    private prisma: PrismaService,
  ) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body('nome') nome: string) {
    const vid = await this.resolve(userId);
    return this.mesasService.create(vid, nome);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    const vid = await this.resolve(userId);
    return this.mesasService.findAll(vid);
  }

  @Get(':id/pedidos')
  async getPedidos(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const vid = await this.resolve(userId);
    return this.mesasService.getPedidos(id, vid);
  }

  @Patch(':id')
  async rename(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('nome') nome: string) {
    const vid = await this.resolve(userId);
    return this.mesasService.rename(id, vid, nome);
  }

  @Patch(':id/status')
  @HttpCode(200)
  async setStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('status') status: MesaStatus,
  ) {
    const vid = await this.resolve(userId);
    return this.mesasService.setStatus(id, vid, status);
  }

  @Patch(':id/liberar')
  @HttpCode(200)
  async liberar(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const vid = await this.resolve(userId);
    return this.mesasService.liberar(id, vid);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const vid = await this.resolve(userId);
    return this.mesasService.remove(id, vid);
  }

  @Patch(':id/toggle')
  @HttpCode(200)
  async toggle(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const vid = await this.resolve(userId);
    return this.mesasService.toggle(id, vid);
  }

  private async resolve(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, include: { vendedor: true } });
    if (!u?.vendedor) throw new NotFoundException('Vendedor nao encontrado');
    return u.vendedor.id;
  }
}
