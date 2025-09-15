import { mapPaginatedArticles } from './paginated-article-response.mapper';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Article } from '../entities/article.entity';

describe('mapPaginatedArticles', () => {
  it('should map PaginatedResponseDto<Article> to PaginatedArticlesResponseDto', () => {
    const input: PaginatedResponseDto<Article> = {
      count: 2,
      data: [
        Object.assign(new Article(), {
          id: 'a1',
          title: 't1',
          content: 'c',
          isPublic: true,
          author: {},
          tags: [],
        }),
        Object.assign(new Article(), {
          id: 'a2',
          title: 't2',
          content: 'c',
          isPublic: false,
          author: {},
          tags: [],
        }),
      ],
    };
    const dto = mapPaginatedArticles(input);
    expect(dto.count).toBe(2);
    expect(dto.data).toHaveLength(2);
    expect(dto.data[0].id).toBe('a1');
  });
});
