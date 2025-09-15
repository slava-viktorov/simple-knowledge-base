import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class PaginatedResponseDto<T> {
  @Expose()
  @ApiProperty({ isArray: true })
  data: T[];

  @Expose()
  @ApiProperty()
  count: number;
}
