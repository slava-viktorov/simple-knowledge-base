import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { ITagsRepository } from '../tags.repository.interface';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';

@Injectable()
export class TypeOrmTagsRepository implements ITagsRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const tag = this.tagsRepository.create(createTagDto);
    return await this.tagsRepository.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return await this.tagsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Tag | null> {
    return await this.tagsRepository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Tag | null> {
    const normalizedName = name.trim().toLowerCase();
    return await this.tagsRepository.findOne({
      where: { name: normalizedName },
    });
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag | null> {
    const result = await this.tagsRepository.update(id, updateTagDto);
    if ((result.affected ?? 0) > 0) {
      return await this.findById(id);
    }
    return null;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.tagsRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
