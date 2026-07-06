import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeadsService } from './leads.service';

@Controller('leads')
@UseGuards(AuthGuard('jwt'))
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  async listar(@Req() req: any) {
    const vendedorId = req.user.vendedor?.id || req.user.vendedorId;
    return this.leadsService.listar(vendedorId);
  }

  @Delete(':id')
  async remover(@Param('id') id: string) {
    return this.leadsService.remover(id);
  }
}
