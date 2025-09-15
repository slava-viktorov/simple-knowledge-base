import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import { ITagsRepository, TAGS_REPOSITORY } from './tags.repository.interface';

@Injectable()
export class TagsService {
  constructor(
    @Inject(TAGS_REPOSITORY)
    private readonly tagsRepository: ITagsRepository,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    // Нормализуем имя тега в нижний регистр и без лишних пробелов
    const normalizedName = createTagDto.name.trim().toLowerCase();

    // Проверяем, существует ли тег с таким именем (в нижнем регистре)
    const existingTag = await this.tagsRepository.findByName(normalizedName);
    if (existingTag) {
      throw new ConflictException(
        `Tag with name "${normalizedName}" already exists`,
      );
    }

    const tag = await this.tagsRepository.create({
      name: normalizedName,
      description: createTagDto.description,
    });
    return tag;
  }

  async findAll(): Promise<Tag[]> {
    const tags = await this.tagsRepository.findAll();
    return tags;
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.tagsRepository.findById(id);
    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return tag;
  }

  async findByName(name: string): Promise<Tag | null> {
    const tag = await this.tagsRepository.findByName(name);
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    // Если обновляется имя, проверяем уникальность
    if (updateTagDto.name) {
      const existingTag = await this.tagsRepository.findByName(
        updateTagDto.name,
      );
      if (existingTag && existingTag.id !== id) {
        throw new ConflictException(
          `Tag with name "${updateTagDto.name}" already exists`,
        );
      }
    }

    const updatedTag = await this.tagsRepository.update(id, updateTagDto);
    if (!updatedTag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return updatedTag;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.tagsRepository.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
  }

  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const name of tagNames) {
      const normalizedName = String(name).trim().toLowerCase();
      let tag = await this.tagsRepository.findByName(normalizedName);
      if (!tag) {
        tag = await this.tagsRepository.create({ name: normalizedName });
      }
      tags.push(tag);
    }

    return tags;
  }
}
