import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ example: 'My First Article', description: 'Article title' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'This is the content of my first article.',
    description: 'Article content',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the article is publicly accessible',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @ApiPropertyOptional({
    example: ['javascript', 'tutorial', 'web-development'],
    description: 'Array of tag names to associate with the article',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];
}
