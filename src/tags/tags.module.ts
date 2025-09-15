import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { Tag } from './entities/tag.entity';
import { TypeOrmTagsRepository } from './repositories/typeorm-tags.repository';
import { TAGS_REPOSITORY } from './tags.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  controllers: [TagsController],
  providers: [
    TagsService,
    {
      provide: TAGS_REPOSITORY,
      useClass: TypeOrmTagsRepository,
    },
  ],
  exports: [TagsService],
})
export class TagsModule {}
