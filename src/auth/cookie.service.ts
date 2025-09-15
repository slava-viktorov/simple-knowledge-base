import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import parseTimeStringToMs from '../lib/ms';

export interface JWTTokensPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class CookieService {
  private readonly logger = new Logger(CookieService.name);

  constructor(private readonly configService: ConfigService) {}

  setAuthCookies(res: Response, tokens: JWTTokensPair): void {
    try {
      const refreshTokenName =
        this.configService.get<string>('JWT_REFRESH_TOKEN_NAME') ||
        'refreshToken';
      const accessTokenName =
        this.configService.get<string>('JWT_ACCESS_TOKEN_NAME') ||
        'accessToken';
      const refreshExpirationTime = this.configService.get<string>(
        'JWT_REFRESH_EXPIRATION_TIME_IN_DAYS',
      )!;
      const accessExpirationTime = this.configService.get<string>(
        'JWT_EXPIRATION_TIME_IN_MINUTES',
      )!;

      res.cookie(refreshTokenName, tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
        maxAge: parseTimeStringToMs(refreshExpirationTime),
      });

      res.cookie(accessTokenName, tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
        maxAge: parseTimeStringToMs(accessExpirationTime),
      });

      this.logger.log('Auth cookies set successfully');
    } catch (error) {
      this.logger.error('Failed to set auth cookies', error);
      throw error;
    }
  }

  clearAuthCookies(res: Response): void {
    try {
      const refreshTokenName =
        this.configService.get<string>('JWT_REFRESH_TOKEN_NAME') ||
        'refreshToken';
      const accessTokenName =
        this.configService.get<string>('JWT_ACCESS_TOKEN_NAME') ||
        'accessToken';

      res.clearCookie(refreshTokenName);
      res.clearCookie(accessTokenName);

      this.logger.log('Auth cookies cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear auth cookies', error);
      throw error;
    }
  }
}
