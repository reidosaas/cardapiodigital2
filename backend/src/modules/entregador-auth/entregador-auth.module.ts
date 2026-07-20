import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EntregadorAuthController } from './entregador-auth.controller';
import { EntregadorAuthService } from './entregador-auth.service';
import { EntregadorJwtStrategy } from './entregador-auth.strategy';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminNotifyModule } from '../admin-notify/admin-notify.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'cardapio-digital-secret-2024',
    }),
    forwardRef(() => AdminNotifyModule),
  ],
  controllers: [EntregadorAuthController],
  providers: [EntregadorAuthService, EntregadorJwtStrategy],
  exports: [EntregadorAuthService],
})
export class EntregadorAuthModule {}
