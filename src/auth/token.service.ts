import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';

import parseTimeStringToMs from '../lib/ms';

interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenPayload {
  sub: string;
  email: string;
  jti: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  decodeRefreshToken(refreshToken: string): RefreshTokenPayload {
    const payload: unknown = this.jwtService.decode(refreshToken);
    if (!payload || typeof payload !== 'object') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const sub = (payload as Record<string, unknown>)['sub'];
    const email = (payload as Record<string, unknown>)['email'];
    const jti = (payload as Record<string, unknown>)['jti'];
    if (
      typeof sub !== 'string' ||
      typeof email !== 'string' ||
      typeof jti !== 'string'
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { sub, email, jti };
  }

  async generateAccessToken(userId: string, email: string): Promise<string> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, jti: randomUUID() },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRATION_TIME_IN_MINUTES',
        ),
      },
    );

    return accessToken;
  }

  async generateRefreshToken(userId: string, email: string): Promise<string> {
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, jti: randomUUID() },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME_IN_DAYS',
        ),
      },
    );

    return refreshToken;
  }

  async generateTokens(userId: string, email: string): Promise<TokensResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email),
      this.generateRefreshToken(userId, email),
    ]);

    const tokens = {
      accessToken,
      refreshToken,
    };

    return tokens;
  }

  hashRefreshToken(refreshToken: string): string {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    return hash;
  }

  verifyRefreshToken(
    refreshToken: string,
    hashedRefreshToken: string,
  ): boolean {
    const hash = this.hashRefreshToken(refreshToken);
    const isMatch = hashedRefreshToken === hash;
    return isMatch;
  }

  verifyAccessTokenPayload(accessToken: string): void {
    try {
      this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  verifyRefreshTokenPayload(refreshToken: string): RefreshTokenPayload {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  public getRefreshTokenExpiresInMs(): number {
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION_TIME_IN_DAYS',
    );
    const expiresInMs = parseTimeStringToMs(expiresIn ?? '0');
    return expiresInMs ?? 0;
  }
}
