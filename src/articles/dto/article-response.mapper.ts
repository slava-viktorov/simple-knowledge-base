import { plainToInstance } from 'class-transformer';
import { Article } from '../entities/article.entity';
import { ArticleResponseDto } from './article-response.dto';

export function mapArticleToResponse(article: Article): ArticleResponseDto {
  return plainToInstance(ArticleResponseDto, article);
}
