import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { ArticleAdminOrOwnershipGuard } from './article-admin-or-ownership.guard';
import { ArticlesService } from '../articles.service';

describe('ArticleAdminOrOwnershipGuard', () => {
  let guard: ArticleAdminOrOwnershipGuard;
  let mockArticlesService: any;

  beforeEach(async () => {
    mockArticlesService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleAdminOrOwnershipGuard,
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    }).compile();

    guard = module.get<ArticleAdminOrOwnershipGuard>(
      ArticleAdminOrOwnershipGuard,
    );
  });

  it('should allow access for ADMIN user', async () => {
    const mockRequest = {
      user: {
        id: '1',
        role: {
          id: 'role-1',
          name: 'admin',
        },
      },
      params: {
        id: 'article-1',
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should allow access for article owner', async () => {
    const mockRequest = {
      user: {
        id: '1',
        role: {
          id: 'role-2',
          name: 'author',
        },
      },
      params: {
        id: 'article-1',
      },
    };

    const mockArticle = {
      id: 'article-1',
      author: {
        id: '1',
      },
    };

    mockArticlesService.findById.mockResolvedValue(mockArticle);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should deny access for non-owner non-admin user', async () => {
    const mockRequest = {
      user: {
        id: '2',
        role: {
          id: 'role-2',
          name: 'author',
        },
      },
      params: {
        id: 'article-1',
      },
    };

    const mockArticle = {
      id: 'article-1',
      author: {
        id: '1',
      },
    };

    mockArticlesService.findById.mockResolvedValue(mockArticle);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should deny access for unauthenticated user', async () => {
    const mockRequest = {
      params: {
        id: 'article-1',
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
