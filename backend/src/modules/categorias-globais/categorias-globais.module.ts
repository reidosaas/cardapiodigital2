import { Module } from '@nestjs/common';
import { CategoriasGlobaisController } from './categorias-globais.controller';
import { CategoriasGlobaisAdminController } from './categorias-globais-admin.controller';
import { CategoriasGlobaisService } from './categorias-globais.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriasGlobaisController, CategoriasGlobaisAdminController],
  providers: [CategoriasGlobaisService],
  exports: [CategoriasGlobaisService],
})
export class CategoriasGlobaisModule {}
