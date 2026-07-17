import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EntregadorAuthService } from './entregador-auth.service';

@Injectable()
export class EntregadorJwtStrategy extends PassportStrategy(Strategy, 'entregador-jwt') {
  constructor(private authService: EntregadorAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'cardapio-digital-secret-2024',
    });
  }

  async validate(payload: any) {
    return this.authService.validateToken(payload);
  }
}
