import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

export const TAGS_REPOSITORY = 'TAGS_REPOSITORY';

export interface ITagsRepository {
  create(createTagDto: CreateTagDto): Promise<Tag>;

  findAll(): Promise<Tag[]>;

  findById(id: string): Promise<Tag | null>;

  findByName(name: string): Promise<Tag | null>;

  update(id: string, updateTagDto: UpdateTagDto): Promise<Tag | null>;

  remove(id: string): Promise<boolean>;
}
