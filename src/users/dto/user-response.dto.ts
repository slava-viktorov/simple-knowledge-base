import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RoleResponseDto } from './role-response.dto';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  username: string;

  @Expose()
  @Type(() => RoleResponseDto)
  @ApiProperty({
    type: RoleResponseDto,
    description: 'User role',
  })
  role: RoleResponseDto;
}
