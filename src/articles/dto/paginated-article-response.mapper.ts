import { plainToInstance } from 'class-transformer';
import { Article } from '../entities/article.entity';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginatedArticlesResponseDto } from './paginated-article-response.dto';
import { mapArticleToResponse } from './article-response.mapper';

export function mapPaginatedArticles(
  input: PaginatedResponseDto<Article>,
): PaginatedArticlesResponseDto {
  const dto = new PaginatedArticlesResponseDto();
  dto.count = input.count;
  dto.data = input.data.map(mapArticleToResponse);
  return plainToInstance(PaginatedArticlesResponseDto, dto);
}
