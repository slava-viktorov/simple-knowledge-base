import { Test, TestingModule } from '@nestjs/testing';

import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

describe('ArticlesController', () => {
  let controller: ArticlesController;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
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
  const mockArticle = {
    id: 'article-1',
    title: 'Test Article',
    content: 'Test Content',
    isPublic: true,
    author: mockUser,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockArticlesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockArticlesService).forEach((fn) => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    }).compile();
    controller = module.get<ArticlesController>(ArticlesController);
  });

  describe('create', () => {
    it('should create a article', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        content: 'Test Content',
      };

      mockArticlesService.create.mockResolvedValue(mockArticle);

      const result = await controller.create(createArticleDto, mockUser);

      expect(mockArticlesService.create).toHaveBeenCalledWith(
        createArticleDto,
        mockUser,
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'article-1',
          title: 'Test Article',
          content: 'Test Content',
          isPublic: true,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all articles with pagination', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponseDto<Article> = {
        data: [mockArticle],
        count: 1,
      };

      mockArticlesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(paginationDto);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(
        paginationDto,
        false,
      );
      expect(result).toEqual(
        expect.objectContaining({
          count: 1,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 'article-1',
              title: 'Test Article',
              content: 'Test Content',
            }),
          ]),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a article by id', async () => {
      mockArticlesService.findById.mockResolvedValue(mockArticle);

      const result = await controller.findById('article-1');

      expect(mockArticlesService.findById).toHaveBeenCalledWith('article-1');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'article-1',
          title: 'Test Article',
          content: 'Test Content',
          isPublic: true,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a article', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Title',
      };

      mockArticlesService.update.mockResolvedValue(mockArticle);

      const result = await controller.update('article-1', updateArticleDto);

      expect(mockArticlesService.update).toHaveBeenCalledWith(
        'article-1',
        updateArticleDto,
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'article-1',
          title: 'Test Article',
          content: 'Test Content',
          isPublic: true,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should remove a article', async () => {
      mockArticlesService.remove.mockResolvedValue(undefined);

      await controller.remove('article-1');

      expect(mockArticlesService.remove).toHaveBeenCalledWith('article-1');
    });
  });
});
