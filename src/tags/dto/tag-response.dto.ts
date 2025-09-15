import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TagResponseDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'javascript' })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    example: 'Articles about JavaScript programming language',
  })
  @Expose()
  description?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
