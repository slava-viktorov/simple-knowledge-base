import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

import { TokenService } from './token.service';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
  createHash: jest.fn(),
}));

const mockCreateHash = createHash as jest.MockedFunction<typeof createHash>;

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
  verify: jest.fn(),
};
const mockConfigService = {
  get: jest.fn(),
};

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: typeof mockJwtService;
  let configService: typeof mockConfigService;

  beforeEach(async () => {
    Object.values(mockJwtService).forEach((fn) => fn.mockReset());
    Object.values(mockConfigService).forEach((fn) => fn.mockReset());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<any>(JwtService);
    configService = module.get<any>(ConfigService);

    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const userId = 'user-1';
      const email = 'test@test.com';
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('jwt-secret')
        .mockReturnValueOnce('15m')
        .mockReturnValueOnce('refresh-secret')
        .mockReturnValueOnce('7d');

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      const result = await service.generateTokens(userId, email);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { sub: userId, email, jti: 'test-uuid' },
        { secret: 'jwt-secret', expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: userId, email, jti: 'test-uuid' },
        { secret: 'refresh-secret', expiresIn: '7d' },
      );
      expect(result).toEqual({
        accessToken,
        refreshToken,
      });
    });
  });

  describe('hashRefreshToken', () => {
    it('should hash refresh token using SHA-256', () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';

      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(hashedToken),
      };
      mockCreateHash.mockReturnValue(mockHash as any);

      const result = service.hashRefreshToken(refreshToken);

      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(refreshToken);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe(hashedToken);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';

      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(hashedToken),
      };
      mockCreateHash.mockReturnValue(mockHash as any);

      const result = service.verifyRefreshToken(refreshToken, hashedToken);

      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(refreshToken);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe(true);
    });

    it('should return false if tokens do not match', () => {
      const refreshToken = 'refresh-token';
      const hashedToken = 'hashed-refresh-token';
      const differentHash = 'different-hash';

      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(differentHash),
      };
      mockCreateHash.mockReturnValue(mockHash as any);

      const result = service.verifyRefreshToken(refreshToken, hashedToken);

      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(refreshToken);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe(false);
    });
  });

  describe('decodeRefreshToken', () => {
    it('should decode refresh token payload', () => {
      const refreshToken = 'refresh-token';
      const payload = {
        sub: 'user-1',
        email: 'test@test.com',
        jti: 'test-uuid',
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      const result = service.decodeRefreshToken(refreshToken);

      expect(jwtService.decode).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(payload);
    });
  });

  describe('verifyRefreshTokenPayload', () => {
    it('should verify refresh token payload successfully', () => {
      const refreshToken = 'refresh-token';
      const payload = {
        sub: 'user-1',
        email: 'test@test.com',
        jti: 'test-uuid',
      };

      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);

      const result = service.verifyRefreshTokenPayload(refreshToken);

      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException if token verification fails', () => {
      const refreshToken = 'invalid-refresh-token';

      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.verifyRefreshTokenPayload(refreshToken)).toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('getRefreshTokenExpiresInMs', () => {
    it('should return refresh token expiration time in milliseconds', () => {
      const expiresIn = '7d';
      const expectedMs = 7 * 24 * 60 * 60 * 1000;

      jest.spyOn(configService, 'get').mockReturnValue(expiresIn);

      const result = service.getRefreshTokenExpiresInMs();

      expect(configService.get).toHaveBeenCalledWith(
        'JWT_REFRESH_EXPIRATION_TIME_IN_DAYS',
      );
      expect(result).toBe(expectedMs);
    });

    it('should return 0 if expiration time is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = service.getRefreshTokenExpiresInMs();

      expect(configService.get).toHaveBeenCalledWith(
        'JWT_REFRESH_EXPIRATION_TIME_IN_DAYS',
      );
      expect(result).toBe(0);
    });
  });
});
