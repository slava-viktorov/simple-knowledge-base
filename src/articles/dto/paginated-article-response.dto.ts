import { Exclude, Expose, Type } from 'class-transformer';

import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ArticleResponseDto } from './article-response.dto';

@Exclude()
export class PaginatedArticlesResponseDto extends PaginatedResponseDto<ArticleResponseDto> {
  @Expose()
  @Type(() => ArticleResponseDto)
  declare data: ArticleResponseDto[];
}
