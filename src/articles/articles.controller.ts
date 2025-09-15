import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { mapArticleToResponse } from './dto/article-response.mapper';

import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { PaginatedArticlesResponseDto } from './dto/paginated-article-response.dto';
import { mapPaginatedArticles } from './dto/paginated-article-response.mapper';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ArticleAdminOrOwnershipGuard } from './guards/article-admin-or-ownership.guard';
import { ArticlePublicAccessGuard } from './guards/article-public-access.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { QueryTransformPipe } from '../common/pipes/query-transform.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({
    status: 201,
    description: 'The article has been successfully created.',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() user: User,
  ): Promise<ArticleResponseDto> {
    const article = await this.articlesService.create(createArticleDto, user);
    return mapArticleToResponse(article);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all articles with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (alternative to skip)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per page',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of articles to skip (alternative to page)',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ArticleResponseDto' },
        },
        count: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query(QueryTransformPipe) paginationDto: PaginationDto,
    @CurrentUser() user?: User,
  ): Promise<PaginatedArticlesResponseDto> {
    // Если пользователь не аутентифицирован, показываем только публичные статьи
    const includePrivate = !!user;
    const articles = await this.articlesService.findAll(
      paginationDto,
      includePrivate,
    );
    return mapPaginatedArticles(articles);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard, ArticlePublicAccessGuard)
  @ApiOperation({ summary: 'Get an article by id' })
  @ApiResponse({
    status: 200,
    description: 'Article retrieved successfully.',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Authentication required for private articles.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
    type: ErrorResponseDto,
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ArticleResponseDto> {
    const article = await this.articlesService.findById(id);
    return mapArticleToResponse(article);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ArticleAdminOrOwnershipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an article' })
  @ApiResponse({
    status: 200,
    description: 'The article has been successfully updated.',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    const article = await this.articlesService.update(id, updateArticleDto);
    return mapArticleToResponse(article);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ArticleAdminOrOwnershipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an article' })
  @ApiResponse({
    status: 200,
    description: 'The article has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
    type: ErrorResponseDto,
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.articlesService.remove(id);
  }
}
