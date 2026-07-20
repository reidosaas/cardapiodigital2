import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Usuarios')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private adminUsersService: AdminUsersService) {}

  @Get('vendedores')
  async listVendedores() {
    return this.adminUsersService.listVendedores();
  }

  @Get('entregadores')
  async listEntregadores() {
    return this.adminUsersService.listEntregadores();
  }

  @Get('clientes')
  async listClientes() {
    return this.adminUsersService.listClientes();
  }

  @Patch(':tipo/:id/password')
  async resetPassword(
    @Param('tipo') tipo: 'VENDEDOR' | 'ENTREGADOR' | 'CLIENTE',
    @Param('id') id: string,
    @Body('senha') senha: string,
  ) {
    return this.adminUsersService.resetPassword(tipo.toUpperCase() as any, id, senha);
  }
}
