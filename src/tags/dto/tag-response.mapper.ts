import { plainToInstance } from 'class-transformer';
import { Tag } from '../entities/tag.entity';
import { TagResponseDto } from './tag-response.dto';

export function mapTagToResponse(tag: Tag): TagResponseDto {
  return plainToInstance(TagResponseDto, tag);
}

export function mapTagsToResponse(tags: Tag[]): TagResponseDto[] {
  return tags.map((t) => mapTagToResponse(t));
}
