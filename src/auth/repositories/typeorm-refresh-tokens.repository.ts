import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IRefreshTokensRepository } from '../refresh-tokens.repository.interface';

@Injectable()
export class TypeOrmRefreshTokensRepository
  implements IRefreshTokensRepository
{
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async create(token: Partial<RefreshToken>): Promise<RefreshToken> {
    const entity = this.refreshTokensRepository.create(token);
    const refreshToken = await this.refreshTokensRepository.save(entity);
    return refreshToken;
  }

  async findByJTI(jti: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokensRepository.findOneBy({ jti });
    return refreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokensRepository.findOneBy({
      token,
    });
    return refreshToken;
  }

  async revokeToken(token: string): Promise<boolean> {
    const result = await this.refreshTokensRepository.update(
      { token },
      { isRevoked: true, revokedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  async revokeAllTokensForUser(userId: string): Promise<number> {
    const result = await this.refreshTokensRepository
      .createQueryBuilder()
      .update()
      .set({ isRevoked: true, revokedAt: () => 'now()' })
      .where('"userId" = :userId', { userId })
      .andWhere('"isRevoked" = false')
      .execute();
    return result.affected ?? 0;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.refreshTokensRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
