import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClienteGlobalController } from './cliente-global.controller';
import { ClienteGlobalService } from './cliente-global.service';
import { ClienteGlobalJwtStrategy } from './cliente-global-auth.strategy';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'cardapio-digital-secret-2024',
    }),
  ],
  controllers: [ClienteGlobalController],
  providers: [ClienteGlobalService, ClienteGlobalJwtStrategy],
  exports: [ClienteGlobalService],
})
export class ClienteGlobalModule {}
