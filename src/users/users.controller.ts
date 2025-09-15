import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { AdminCreationGuard } from '../common/guards/admin-creation.guard';
import { UserEditGuard } from './guards/user-edit.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard, AdminCreationGuard)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. Only admins can create users with non-author roles.',
    type: ErrorResponseDto,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create({
      email: createUserDto.email,
      username: createUserDto.username,
      password: createUserDto.password,
      roleId: createUserDto.roleId,
    });
    return plainToInstance(UserResponseDto, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToInstance(UserResponseDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, UserEditGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. You can only edit your own profile, or admin can edit anyone. Regular users cannot change email or role.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin role required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.deleteById(id);
  }
}
