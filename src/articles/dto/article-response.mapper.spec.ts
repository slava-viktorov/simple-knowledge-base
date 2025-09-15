import { mapArticleToResponse } from './article-response.mapper';
import { Article } from '../entities/article.entity';

describe('mapArticleToResponse', () => {
  it('should map Article to ArticleResponseDto', () => {
    const article = Object.assign(new Article(), {
      id: 'a1',
      title: 'Title',
      content: 'Content',
      isPublic: true,
      author: { id: 'u1', email: 'e', username: 'u' },
      tags: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    });
    const dto = mapArticleToResponse(article);
    expect(dto).toMatchObject({ id: 'a1', title: 'Title', isPublic: true });
  });
});
