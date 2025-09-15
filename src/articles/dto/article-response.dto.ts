import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { AuthorResponseDto } from './author-response.dto';
import { TagArticleResponseDto } from './tag-response.dto';

@Exclude()
export class ArticleResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty()
  isPublic: boolean;

  @Expose()
  @Type(() => AuthorResponseDto)
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;

  @Expose()
  @Type(() => TagArticleResponseDto)
  @ApiProperty({ type: [TagArticleResponseDto] })
  tags: TagArticleResponseDto[];

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
