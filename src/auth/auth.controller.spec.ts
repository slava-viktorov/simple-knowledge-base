import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { ConfigService } from '@nestjs/config';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashedPassword',
  roleId: 'role-1',
  role: {
    id: 'role-1',
    name: 'author',
    description: 'Regular user',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  articles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  refreshTokens: [],
};
const mockTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};
const mockAuthResult = {
  user: mockUser,
  tokens: mockTokens,
};
const mockResponse = { cookie: jest.fn(), clearCookie: jest.fn() } as any;
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshTokensPair: jest.fn(),
  me: jest.fn(),
};
const mockTokenService = { generateTokens: jest.fn() };
const mockCookieService = {
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn(),
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: typeof mockAuthService;
  let cookieService: typeof mockCookieService;

  beforeEach(async () => {
    Object.values(mockAuthService).forEach((fn) => fn.mockReset());
    Object.values(mockCookieService).forEach((fn) => fn.mockReset());

    if (mockResponse.cookie.mockReset) mockResponse.cookie.mockReset();
    if (mockResponse.clearCookie.mockReset)
      mockResponse.clearCookie.mockReset();
    mockTokenService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    mockCookieService.setAuthCookies.mockImplementation(() => {});
    mockCookieService.clearAuthCookies.mockImplementation(() => {});
    mockAuthService.logout.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: CookieService, useValue: mockCookieService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JWT_SECRET') return 'test_jwt_secret';
              if (key === 'JWT_REFRESH_SECRET')
                return 'test_jwt_refresh_secret';
              if (key === 'JWT_REFRESH_TOKEN_NAME') return 'refreshToken';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<any>(AuthService);
    cookieService = module.get<any>(CookieService);
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      jest.spyOn(authService, 'login').mockResolvedValue(mockAuthResult);
      jest.spyOn(cookieService, 'setAuthCookies').mockImplementation(() => {});

      const result = await controller.login(loginDto, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(cookieService.setAuthCookies).toHaveBeenCalledWith(
        mockResponse,
        mockTokens,
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookies', async () => {
      const mockRequest = {
        cookies: { refreshToken: 'test-refresh-token' },
      } as any;

      await controller.logout(mockRequest, mockResponse);

      expect(mockAuthService.logout).toHaveBeenCalledWith('test-refresh-token');
      expect(mockCookieService.clearAuthCookies).toHaveBeenCalledWith(
        mockResponse,
      );
    });

    it('should throw UnauthorizedException if no refresh token in cookies', async () => {
      const mockRequest = { cookies: {} } as any;

      await expect(
        controller.logout(mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token required');
    });

    it('should throw UnauthorizedException if cookies are undefined', async () => {
      const mockRequest = { cookies: undefined } as any;

      await expect(
        controller.logout(mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token required');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens', async () => {
      const refreshToken = 'refresh-token';
      const mockRequest = { cookies: { refreshToken } } as any;
      jest
        .spyOn(authService, 'refreshTokensPair')
        .mockResolvedValue(mockTokens);
      jest.spyOn(cookieService, 'setAuthCookies').mockImplementation(() => {});

      const result = await controller.refreshTokens(mockRequest, mockResponse);

      expect(authService.refreshTokensPair).toHaveBeenCalledWith(refreshToken);
      expect(cookieService.setAuthCookies).toHaveBeenCalledWith(
        mockResponse,
        mockTokens,
      );
      expect(result).toBeUndefined();
    });

    it('should throw UnauthorizedException if no refresh token in cookies', async () => {
      const mockRequest = {
        cookies: {},
      } as any;
      const mockResponse = {
        cookie: jest.fn(),
      } as any;

      await expect(
        controller.refreshTokens(mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token required');
    });

    it('should throw UnauthorizedException if cookies are undefined', async () => {
      const mockRequest = {
        cookies: undefined,
      } as any;
      const mockResponse = {
        cookie: jest.fn(),
      } as any;

      await expect(
        controller.refreshTokens(mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token required');
    });
  });

  describe('me', () => {
    it('should return current user', () => {
      jest.spyOn(authService, 'me').mockReturnValue(mockUser);

      const result = controller.me(mockUser as any);
      expect(authService.me).toHaveBeenCalledWith(mockUser);
      expect({
        id: (result as any).id,
        email: (result as any).email,
        username: (result as any).username,
      }).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    it('should throw UnauthorizedException if user is not provided', () => {
      jest.spyOn(authService, 'me').mockImplementation(() => {
        throw new Error('Invalid credentials');
      });
      // @ts-expect-error - Mock response object for testing
      expect(() => controller.me(undefined)).toThrow('Invalid credentials');
    });
  });
});
