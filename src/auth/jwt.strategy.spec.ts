import { Test, TestingModule } from '@nestjs/testing';

import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

beforeAll(() => {
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: typeof mockUsersService;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    username: 'testuser',
    passwordHash: 'hashedPassword',
    articles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshTokens: [],
  };
  const mockConfigService = {
    get: (key?: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_ACCESS_TOKEN_NAME') return 'accessToken';
      return 'test-secret';
    },
  };
  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockUsersService).forEach(
      (fn) => fn.mockReset && fn.mockReset(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<any>(UsersService);
  });

  describe('validate', () => {
    it('should return user without password when user exists', async () => {
      const payload = { sub: 'user-1', email: 'test@test.com' };

      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        articles: [],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        refreshTokens: [],
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload = { sub: 'user-1', email: 'test@test.com' };

      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
