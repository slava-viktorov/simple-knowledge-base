import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ArticlePublicAccessGuard } from './article-public-access.guard';
import { ArticlesService } from '../articles.service';

describe('ArticlePublicAccessGuard', () => {
  let guard: ArticlePublicAccessGuard;

  const mockArticlesService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlePublicAccessGuard,
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    }).compile();

    guard = module.get<ArticlePublicAccessGuard>(ArticlePublicAccessGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access to public articles for unauthenticated users', async () => {
    const mockRequest = {
      params: { id: '11111111-1111-4111-8111-111111111111' },
    };

    const mockArticle = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Public Article',
      isPublic: true,
    };

    mockArticlesService.findById.mockResolvedValue(mockArticle);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockArticlesService.findById).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('should allow access to public articles for authenticated users', async () => {
    const mockRequest = {
      user: {
        id: '1',
        role: { name: 'author' },
      },
      params: { id: '11111111-1111-4111-8111-111111111111' },
    };

    const mockArticle = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Public Article',
      isPublic: true,
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

  it('should deny access to private articles for unauthenticated users', async () => {
    const mockRequest = {
      params: { id: '11111111-1111-4111-8111-111111111111' },
    };

    const mockArticle = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Private Article',
      isPublic: false,
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
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Authentication required to access private articles',
    );
  });

  it('should allow access to private articles for authenticated users', async () => {
    const mockRequest = {
      user: {
        id: '1',
        role: { name: 'author' },
      },
      params: { id: '11111111-1111-4111-8111-111111111111' },
    };

    const mockArticle = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Private Article',
      isPublic: false,
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

  it('should throw error if article not found', async () => {
    const mockRequest = {
      params: { id: '22222222-2222-4222-8222-222222222222' },
    };

    mockArticlesService.findById.mockResolvedValue(null);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFound when no article ID provided', async () => {
    const mockRequest = {
      params: {},
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Article not found',
    );
  });
});
