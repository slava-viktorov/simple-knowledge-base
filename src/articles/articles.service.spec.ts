import { Test, TestingModule } from '@nestjs/testing';

import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { TagsService } from '../tags/tags.service';

import { NotFoundException } from '@nestjs/common';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articlesRepository: typeof mockArticlesRepository;

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
  const mockArticlesRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllByAuthorId: jest.fn(),
  };

  const mockTagsService = {
    findOrCreateTags: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockArticlesRepository).forEach((fn) => fn.mockReset());
    Object.values(mockTagsService).forEach((fn) => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: 'ARTICLES_REPOSITORY',
          useValue: mockArticlesRepository,
        },
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    }).compile();
    service = module.get<ArticlesService>(ArticlesService);
    articlesRepository = module.get<any>('ARTICLES_REPOSITORY');
  });

  describe('create', () => {
    it('should create a new article', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        content: 'Test Content',
      };

      jest.spyOn(articlesRepository, 'create').mockResolvedValue(mockArticle);

      const result = await service.create(createArticleDto, mockUser);

      expect(articlesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Article',
          content: 'Test Content',
          isPublic: false,
        }),
        mockUser.id,
        [],
      );
      expect(result).toEqual(mockArticle);
    });
  });

  describe('findAll', () => {
    it('should return all articles with pagination using page', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponseDto<Article> = {
        data: [mockArticle],
        count: 1,
      };

      jest.spyOn(articlesRepository, 'findAll').mockResolvedValue(mockResponse);

      const result = await service.findAll(paginationDto);

      expect(articlesRepository.findAll).toHaveBeenCalledWith(
        paginationDto,
        false,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return all articles with pagination using skip', async () => {
      const paginationDto: PaginationDto = { skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Article> = {
        data: [mockArticle],
        count: 1,
      };

      jest.spyOn(articlesRepository, 'findAll').mockResolvedValue(mockResponse);

      const result = await service.findAll(paginationDto);

      expect(articlesRepository.findAll).toHaveBeenCalledWith(
        paginationDto,
        false,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should prioritize skip over page when both are provided', async () => {
      const paginationDto: PaginationDto = { page: 3, skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Article> = {
        data: [mockArticle],
        count: 1,
      };

      jest.spyOn(articlesRepository, 'findAll').mockResolvedValue(mockResponse);

      const result = await service.findAll(paginationDto);

      expect(articlesRepository.findAll).toHaveBeenCalledWith(
        paginationDto,
        false,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findById', () => {
    it('should return an article by id', async () => {
      jest.spyOn(articlesRepository, 'findById').mockResolvedValue(mockArticle);

      const result = await service.findById('article-1');

      expect(articlesRepository.findById).toHaveBeenCalledWith('article-1');
      expect(result).toEqual(mockArticle);
    });

    it('should throw NotFoundException if article not found', async () => {
      jest.spyOn(articlesRepository, 'findById').mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an article', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Title',
      };

      jest.spyOn(articlesRepository, 'update').mockResolvedValue(mockArticle);

      const result = await service.update('article-1', updateArticleDto);

      expect(articlesRepository.update).toHaveBeenCalledWith(
        'article-1',
        updateArticleDto,
      );
      expect(result).toEqual(mockArticle);
    });

    it('should throw NotFoundException if article not found after update', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Title',
      };

      jest.spyOn(articlesRepository, 'update').mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateArticleDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an article', async () => {
      jest.spyOn(articlesRepository, 'remove').mockResolvedValue(true);

      await service.remove('article-1');

      expect(articlesRepository.remove).toHaveBeenCalledWith('article-1');
    });

    it('should throw NotFoundException if article not found', async () => {
      jest.spyOn(articlesRepository, 'remove').mockResolvedValue(false);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByAuthorId', () => {
    it('should return all articles by author with pagination using page', async () => {
      const authorId = 'user-1';
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponseDto<Article> = {
        data: [mockArticle],
        count: 1,
      };

      jest
        .spyOn(articlesRepository, 'findAllByAuthorId')
        .mockResolvedValue(mockResponse);

      const result = await service.findAllByAuthorId(authorId, paginationDto);

      expect(articlesRepository.findAllByAuthorId).toHaveBeenCalledWith(
        authorId,
        paginationDto,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return all articles by author with pagination using skip', async () => {
      const authorId = 'user-1';
      const paginationDto: PaginationDto = { skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Article> = {
        data: [mockArticle],
        count: 1,
      };

      jest
        .spyOn(articlesRepository, 'findAllByAuthorId')
        .mockResolvedValue(mockResponse);

      const result = await service.findAllByAuthorId(authorId, paginationDto);

      expect(articlesRepository.findAllByAuthorId).toHaveBeenCalledWith(
        authorId,
        paginationDto,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should prioritize skip over page when both are provided for author articles', async () => {
      const authorId = 'user-1';
      const paginationDto: PaginationDto = { page: 3, skip: 20, limit: 10 };
      const mockResponse: PaginatedResponseDto<Article> = {
        data: [mockArticle],
        count: 1,
      };

      jest
        .spyOn(articlesRepository, 'findAllByAuthorId')
        .mockResolvedValue(mockResponse);

      const result = await service.findAllByAuthorId(authorId, paginationDto);

      expect(articlesRepository.findAllByAuthorId).toHaveBeenCalledWith(
        authorId,
        paginationDto,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
