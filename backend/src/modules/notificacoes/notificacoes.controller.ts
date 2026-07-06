import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notificacoes')
@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificacoesController {
  constructor(private notificacoesService: NotificacoesService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.notificacoesService.findAll(userId);
  }

  @Get('nao-lidas')
  async getNaoLidas(@CurrentUser('id') userId: string) {
    return this.notificacoesService.getNaoLidas(userId);
  }

  @Get('count')
  async countNaoLidas(@CurrentUser('id') userId: string) {
    return { count: await this.notificacoesService.countNaoLidas(userId) };
  }

  @Patch('ler/:id')
  async marcarLida(@Param('id') id: string) {
    return this.notificacoesService.marcarLida(id);
  }

  @Patch('ler-todas')
  async marcarTodasLidas(@CurrentUser('id') userId: string) {
    return this.notificacoesService.marcarTodasLidas(userId);
  }
}
