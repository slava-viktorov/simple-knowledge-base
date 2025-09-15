import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

// import { plainToInstance } from 'class-transformer';
import { mapTagToResponse, mapTagsToResponse } from './dto/tag-response.mapper';

import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
// Removed TagBodyValidationGuard in favor of DTO validation

@ApiTags('tags')
@Controller('tags')
// @UseInterceptors(ClassSerializerInterceptor)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'The tag has been successfully created.',
    type: TagResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Tag with this name already exists.',
    type: ErrorResponseDto,
  })
  async create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.tagsService.create(createTagDto);
    return mapTagToResponse(tag);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully.',
    type: [TagResponseDto],
  })
  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.tagsService.findAll();
    return mapTagsToResponse(tags);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by id' })
  @ApiResponse({
    status: 200,
    description: 'Tag retrieved successfully.',
    type: TagResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found.',
    type: ErrorResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TagResponseDto> {
    const tag = await this.tagsService.findById(id);
    return mapTagToResponse(tag);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully updated.',
    type: TagResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Tag with this name already exists.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    const tag = await this.tagsService.update(id, updateTagDto);
    return mapTagToResponse(tag);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found.',
    type: ErrorResponseDto,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.tagsService.remove(id);
    return { message: 'Tag deleted successfully' };
  }
}
