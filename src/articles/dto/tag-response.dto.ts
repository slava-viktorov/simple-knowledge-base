import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TagArticleResponseDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'javascript' })
  @Expose()
  name: string;
}
