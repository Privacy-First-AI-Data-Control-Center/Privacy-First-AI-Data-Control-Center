import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'ghosthunters',
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any): Promise<any> {
    const rawToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (rawToken && this.authService.isTokenBlacklisted(rawToken, payload.id, payload.iat)) {
      throw new UnauthorizedException('Token has been revoked or session ended');
    }

    return {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  }
}
