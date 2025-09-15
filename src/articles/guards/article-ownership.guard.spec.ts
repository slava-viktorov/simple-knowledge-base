import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { ArticleOwnershipGuard } from './article-ownership.guard';
import { ArticlesService } from '../articles.service';

describe('ArticleOwnershipGuard', () => {
  let guard: ArticleOwnershipGuard;
  let articlesService: typeof mockArticlesService;

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
  const otherUser = {
    id: 'other-user-id',
    email: 'other@test.com',
    username: 'otheruser',
    passwordHash: 'hashedPassword',
    articles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshTokens: [],
  };
  const mockArticle = {
    id: 'article-1',
    title: 'Test Article',
    content: 'Test Content',
    author: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockArticleOtherUser = {
    id: 'article-2',
    title: 'Test Article 2',
    content: 'Test Content 2',
    author: otherUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockArticlesService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockArticlesService).forEach((fn) => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleOwnershipGuard,
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    }).compile();
    guard = module.get<ArticleOwnershipGuard>(ArticleOwnershipGuard);
    articlesService = module.get<any>(ArticlesService);
  });

  describe('canActivate', () => {
    const createMockContext = (
      userId: string,
      articleId: string,
    ): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: userId },
            params: { id: articleId },
          }),
        }),
      } as ExecutionContext;
    };

    it('should allow access if user owns the article', async () => {
      const context = createMockContext(mockUser.id, mockArticle.id);

      jest.spyOn(articlesService, 'findById').mockResolvedValue(mockArticle);

      const result = await guard.canActivate(context);

      expect(articlesService.findById).toHaveBeenCalledWith(mockArticle.id);
      expect(result).toBe(true);
    });

    it('should deny access if user does not own the article', async () => {
      const context = createMockContext(mockUser.id, mockArticle.id);

      jest
        .spyOn(articlesService, 'findById')
        .mockResolvedValue(mockArticleOtherUser);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle non-existent article', async () => {
      const context = createMockContext(mockUser.id, 'nonexistent-id');

      jest
        .spyOn(articlesService, 'findById')
        .mockRejectedValue(new Error('Article not found'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
