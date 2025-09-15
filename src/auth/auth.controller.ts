import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  UnauthorizedException,
  Res,
  Req,
  Head,
} from '@nestjs/common';
import { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Public } from '../common/decorators/public.decorator';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { CookieService } from './cookie.service';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly cookieService: CookieService,
  ) {}

  @Head('validate-token')
  @UseGuards(JwtAuthGuard)
  @Public()
  validate(@Req() req: Request) {
    const accessTokenName = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_NAME',
    )!;
    const accessToken = req.cookies?.[accessTokenName] as string;
    if (!accessToken) {
      throw new UnauthorizedException('Access token required');
    }
    this.authService.validate(accessToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
    type: ErrorResponseDto,
  })
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully retrieved.',
    type: UserResponseDto,
  })
  me(@CurrentUser() user: User): UserResponseDto {
    const result = this.authService.me(user);
    const userResponse = plainToInstance(UserResponseDto, result);
    return userResponse;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({
    status: 200,
    description:
      'User successfully logged in, sets access and refresh tokens in HttpOnly cookie.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
    type: ErrorResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { user, tokens } = await this.authService.login(loginDto);

    this.cookieService.setAuthCookies(res, tokens);
    // Возвращаем минимальные поля (без role), чтобы соответствовать e2e ожиданиям
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenName = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_NAME',
    )!;
    const refreshToken = req.cookies?.[refreshTokenName] as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    await this.authService.logout(refreshToken);
    this.cookieService.clearAuthCookies(res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description:
      'Tokens successfully refreshed, new tokens set in HttpOnly cookie.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshTokenName = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_NAME',
    )!;
    const refreshToken = req.cookies?.[refreshTokenName] as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const tokens = await this.authService.refreshTokensPair(refreshToken);

    this.cookieService.setAuthCookies(res, tokens);
  }
}
