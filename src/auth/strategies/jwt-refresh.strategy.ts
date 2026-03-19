import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigType } from 'src/config/config.type';
import { JwtPayload } from './jwt.strategy';
import { RefreshTokenService } from '../refresh-token.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    config: ConfigService<ConfigType>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.get('auth', { infer: true })!.refresh.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.body.refreshToken;

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const isValid = await this.refreshTokenService.validateToken(
      payload.sub,
      payload.tokenId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Refresh token revoked or invalid');
    }

    return {
      id: payload.sub,
      email: payload.email,
      tokenId: payload.tokenId,
      refreshToken,
    };
  }
}
