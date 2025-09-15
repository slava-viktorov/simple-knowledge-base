import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { REFRESH_TOKENS_REPOSITORY } from './refresh-tokens.repository.interface';
import { TypeOrmRefreshTokensRepository } from './repositories/typeorm-refresh-tokens.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
        },
      }),
    }),
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    CookieService,
    {
      provide: REFRESH_TOKENS_REPOSITORY,
      useClass: TypeOrmRefreshTokensRepository,
    },
    Reflector,
  ],
  exports: [AuthService, TokenService, CookieService],
})
export class AuthModule {}
