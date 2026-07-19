import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ClienteGlobalService } from './cliente-global.service';

@Injectable()
export class ClienteGlobalJwtStrategy extends PassportStrategy(Strategy, 'cliente-global-jwt') {
  constructor(private service: ClienteGlobalService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'cardapio-digital-secret-2024',
    });
  }

  async validate(payload: any) {
    return this.service.validateToken(payload);
  }
}
