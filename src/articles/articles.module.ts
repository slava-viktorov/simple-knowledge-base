import { Module } from '@nestjs/common';

import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { User } from '../users/entities/user.entity';
import { TypeOrmArticlesRepository } from './repositories/typeorm-articles.repository';
import { ARTICLES_REPOSITORY } from './articles.repository.interface';
import { ArticleOwnershipGuard } from './guards/article-ownership.guard';
import { ArticleAdminOrOwnershipGuard } from './guards/article-admin-or-ownership.guard';
import { ArticlePublicAccessGuard } from './guards/article-public-access.guard';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User]), TagsModule],
  controllers: [ArticlesController],
  providers: [
    ArticlesService,
    ArticleOwnershipGuard,
    ArticleAdminOrOwnershipGuard,
    ArticlePublicAccessGuard,
    {
      provide: ARTICLES_REPOSITORY,
      useClass: TypeOrmArticlesRepository,
    },
  ],
  exports: [ArticlesService],
})
export class ArticlesModule {}
