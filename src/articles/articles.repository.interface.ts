import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Tag } from '../tags/entities/tag.entity';

export const ARTICLES_REPOSITORY = 'ARTICLES_REPOSITORY';

export interface IArticlesRepository {
  create(
    createArticleDto: CreateArticleDto,
    authorId: string,
    tags?: Tag[],
  ): Promise<Article>;

  findAll(
    paginationDto: PaginationDto,
    includePrivate?: boolean,
  ): Promise<PaginatedResponseDto<Article>>;

  findById(id: string): Promise<Article | null>;

  update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article | null>;

  remove(id: string): Promise<boolean>;

  findAllByAuthorId(
    authorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Article>>;
}
