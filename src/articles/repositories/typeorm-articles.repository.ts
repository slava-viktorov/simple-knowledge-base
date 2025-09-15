import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Article } from '../entities/article.entity';
import { IArticlesRepository } from '../articles.repository.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { User } from 'src/users/entities/user.entity';
import { Tag } from '../../tags/entities/tag.entity';

type UpdateResult = Article | null;
type ArticlesQueryFilters = {
  includePrivate: boolean;
  authorId?: string;
  tagNames?: string[];
  match?: 'any' | 'all';
};

@Injectable()
export class TypeOrmArticlesRepository implements IArticlesRepository {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    authorId: string,
    tags?: Tag[],
  ): Promise<Article> {
    const { ...articleData } = createArticleDto;

    const article = this.articlesRepository.create({
      ...articleData,
      author: { id: authorId } as Pick<User, 'id'>,
      tags: tags || [],
    });

    const savedArticle = await this.articlesRepository.save(article);

    const result = await this.articlesRepository.findOne({
      where: { id: savedArticle.id },
      relations: ['author', 'tags'],
    });

    return result!;
  }

  async findAll(
    paginationDto: PaginationDto,
    includePrivate: boolean = false,
  ): Promise<PaginatedResponseDto<Article>> {
    const articles = await this.findArticlesWithPagination(
      paginationDto,
      includePrivate,
    );
    return articles;
  }

  async findById(id: string): Promise<Article | null> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['author', 'tags'],
    });
    return article ?? null;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<UpdateResult> {
    const result = await this.articlesRepository.update(id, updateArticleDto);
    if (result.affected === 0) {
      return null;
    }

    const updatedArticle = await this.findById(id);

    return updatedArticle;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.articlesRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAllByAuthorId(
    authorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Article>> {
    const articles = await this.findArticlesWithPagination(pagination, {
      authorId,
    });
    return articles;
  }

  private async findArticlesWithPagination(
    pagination: PaginationDto,
    includePrivateOrFilters?: boolean | { authorId?: string },
    filters?: { authorId?: string },
  ): Promise<PaginatedResponseDto<Article>> {
    const { page = 1, limit = 10, skip } = pagination;
    const tagList: string[] = pagination.tags || [];

    const offset = skip !== undefined ? skip : (page - 1) * limit;

    const resolvedFilters: ArticlesQueryFilters = {
      includePrivate:
        typeof includePrivateOrFilters === 'boolean'
          ? includePrivateOrFilters
          : true,
      authorId:
        typeof includePrivateOrFilters === 'boolean'
          ? filters?.authorId
          : includePrivateOrFilters?.authorId,
      tagNames: tagList,
      match: pagination.match ?? 'any',
    };

    const queryBuilder = this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tags')
      .orderBy('article.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    this.applyFilters(queryBuilder, resolvedFilters);

    const [result, total] = await queryBuilder.getManyAndCount();

    return {
      data: result,
      count: total,
    };
  }

  private applyFilters(
    qb: SelectQueryBuilder<Article>,
    filters: ArticlesQueryFilters,
  ): void {
    if (filters.authorId) {
      qb.andWhere('author.id = :authorId', { authorId: filters.authorId });
    }

    if (!filters.includePrivate) {
      qb.andWhere('article.isPublic = :isPublic', { isPublic: true });
    }

    if (filters.tagNames && filters.tagNames.length > 0) {
      if ((filters.match ?? 'any') === 'all') {
        qb.andWhere(
          `EXISTS (
            SELECT 1
            FROM article_tags at
            JOIN tags t2 ON t2.id = at."tagId"
            WHERE at."articleId" = article.id
              AND t2.name IN (:...tagNames)
            GROUP BY at."articleId"
            HAVING COUNT(DISTINCT t2.name) = :tagCount
          )`,
          { tagNames: filters.tagNames, tagCount: filters.tagNames.length },
        );
      } else {
        qb.innerJoin('article.tags', 'tfilter_any').andWhere(
          'tfilter_any.name IN (:...tagNames)',
          {
            tagNames: filters.tagNames,
          },
        );
      }
    }
  }
}
