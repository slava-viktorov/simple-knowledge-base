import { mapTagToResponse, mapTagsToResponse } from './tag-response.mapper';
import { Tag } from '../entities/tag.entity';

describe('tag mappers', () => {
  it('should map Tag to TagResponseDto', () => {
    const tag = Object.assign(new Tag(), {
      id: 't1',
      name: 'javascript',
      description: 'desc',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    });
    const dto = mapTagToResponse(tag);
    expect(dto).toMatchObject({
      id: 't1',
      name: 'javascript',
      description: 'desc',
    });
  });

  it('should map Tag[] to TagResponseDto[]', () => {
    const tags = [
      Object.assign(new Tag(), { id: 't1', name: 'a' }),
      Object.assign(new Tag(), { id: 't2', name: 'b' }),
    ];
    const dtos = mapTagsToResponse(tags);
    expect(dtos).toHaveLength(2);
    expect(dtos[0].id).toBe('t1');
    expect(dtos[1].id).toBe('t2');
  });
});
