import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
}

type ValidateResult = Omit<User, 'passwordHash'>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (
        req: { cookies?: Record<string, string> } | undefined,
      ) => {
        if (!req || !req.cookies) return null;
        const name =
          configService.get<string>('JWT_ACCESS_TOKEN_NAME') ?? 'accessToken';
        return req.cookies[name] ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<ValidateResult> {
    const { sub: userId } = payload;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Убираем пароль из результата без двойных кастов
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _omit, ...rest } = user;
    return rest as ValidateResult;
  }
}
