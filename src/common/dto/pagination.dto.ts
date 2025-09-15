import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsString,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be a number' })
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a number' })
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Number of articles to skip (alternative to page)',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'skip must be a number' })
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    description: 'Filter articles by tag names',
    type: [String],
    example: ['javascript', 'tutorial'],
  })
  @IsOptional()
  @Transform(({ value }): string[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim().toLowerCase());
    }

    const s = String(value).trim().toLowerCase();

    return (s && [s]) || [];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Tag matching mode: any (default) or all',
    enum: ['any', 'all'],
    default: 'any',
  })
  @IsOptional()
  @IsIn(['any', 'all'])
  match?: 'any' | 'all' = 'any';
}
