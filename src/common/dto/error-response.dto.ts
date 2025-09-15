import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  message: string;

  @ApiProperty({ example: '/api/auth/login' })
  path: string;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  timestamp: string;
}
