import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Logs')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('acao') acao?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.logsService.findAll({ userId, acao, page: Number(page), limit: Number(limit) });
  }

  @Delete('limpar')
  async limpar(@Query('dias') dias = '90') {
    return this.logsService.limparAntigos(Number(dias));
  }
}
