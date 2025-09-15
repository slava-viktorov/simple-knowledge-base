import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';

describe('TagsController', () => {
  let controller: TagsController;
  let mockTagsService: any;

  const mockTag: TagResponseDto = {
    id: 'tag-1',
    name: 'javascript',
    description: 'JavaScript programming language',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockTagsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    }).compile();

    controller = module.get<TagsController>(TagsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const createTagDto: CreateTagDto = {
        name: 'javascript',
        description: 'JavaScript programming language',
      };

      mockTagsService.create.mockResolvedValue(mockTag);

      const result = await controller.create(createTagDto);

      expect(mockTagsService.create).toHaveBeenCalledWith(createTagDto);
      expect(result).toEqual(mockTag);
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const mockTags = [mockTag];
      mockTagsService.findAll.mockResolvedValue(mockTags);

      const result = await controller.findAll();

      expect(mockTagsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTags);
    });
  });

  describe('findOne', () => {
    it('should return a tag by id', async () => {
      mockTagsService.findById.mockResolvedValue(mockTag);

      const result = await controller.findOne('tag-1');

      expect(mockTagsService.findById).toHaveBeenCalledWith('tag-1');
      expect(result).toEqual(mockTag);
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const updateTagDto: UpdateTagDto = {
        name: 'updated-javascript',
        description: 'Updated description',
      };

      const updatedTag = { ...mockTag, ...updateTagDto };
      mockTagsService.update.mockResolvedValue(updatedTag);

      const result = await controller.update('tag-1', updateTagDto);

      expect(mockTagsService.update).toHaveBeenCalledWith(
        'tag-1',
        updateTagDto,
      );
      expect(result).toEqual(updatedTag);
    });
  });

  describe('remove', () => {
    it('should remove a tag', async () => {
      mockTagsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('tag-1');

      expect(mockTagsService.remove).toHaveBeenCalledWith('tag-1');
      expect(result).toEqual({ message: 'Tag deleted successfully' });
    });
  });
});
