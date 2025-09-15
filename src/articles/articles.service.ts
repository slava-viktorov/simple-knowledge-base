import { Injectable, NotFoundException, Inject } from '@nestjs/common';

import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Article } from './entities/article.entity';
import { TagsService } from '../tags/tags.service';
import {
  IArticlesRepository,
  ARTICLES_REPOSITORY,
} from './articles.repository.interface';

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly articlesRepository: IArticlesRepository,
    private readonly tagsService: TagsService,
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    user: User,
  ): Promise<Article> {
    const tags = await this.resolveTags(createArticleDto.tagNames);
    const normalizedDto = this.normalizeCreateDto(createArticleDto);

    const article = await this.articlesRepository.create(
      normalizedDto,
      user.id,
      tags,
    );
    return article;
  }

  private normalizeCreateDto(dto: CreateArticleDto): CreateArticleDto {
    return {
      ...dto,
      isPublic: dto.isPublic ?? false,
    };
  }

  private async resolveTags(
    tagNames?: string[],
  ): Promise<import('../tags/entities/tag.entity').Tag[]> {
    if (!tagNames || tagNames.length === 0) return [];
    return this.tagsService.findOrCreateTags(tagNames);
  }

  async findAll(
    paginationDto: PaginationDto,
    includePrivate: boolean = false,
  ): Promise<PaginatedResponseDto<Article>> {
    const articles = await this.articlesRepository.findAll(
      paginationDto,
      includePrivate,
    );
    return articles;
  }

  async findById(id: string): Promise<Article> {
    const article = await this.articlesRepository.findById(id);
    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
    return article;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const updatedArticle = await this.articlesRepository.update(
      id,
      updateArticleDto,
    );
    if (!updatedArticle) {
      throw new NotFoundException(
        `Article with ID "${id}" not found after update`,
      );
    }
    return updatedArticle;
  }

  async remove(id: string): Promise<void> {
    const wasDeleted = await this.articlesRepository.remove(id);

    if (!wasDeleted) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
  }

  async findAllByAuthorId(
    authorId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Article>> {
    const articles = await this.articlesRepository.findAllByAuthorId(
      authorId,
      paginationDto,
    );
    return articles;
  }
}
