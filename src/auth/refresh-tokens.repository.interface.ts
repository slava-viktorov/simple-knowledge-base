import { RefreshToken } from './entities/refresh-token.entity';

export const REFRESH_TOKENS_REPOSITORY = 'REFRESH_TOKENS_REPOSITORY';

export interface IRefreshTokensRepository {
  create(token: Partial<RefreshToken>): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  findByJTI(jti: string): Promise<RefreshToken | null>;
  revokeToken(token: string): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
  revokeAllTokensForUser(userId: string): Promise<number>;
}
