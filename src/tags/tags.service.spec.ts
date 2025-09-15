import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TAGS_REPOSITORY } from './tags.repository.interface';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

describe('TagsService', () => {
  let service: TagsService;
  let mockTagsRepository: any;

  const mockTag = {
    id: 'tag-1',
    name: 'javascript',
    description: 'JavaScript programming language',
    articles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockTagsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: TAGS_REPOSITORY,
          useValue: mockTagsRepository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
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

      mockTagsRepository.findByName.mockResolvedValue(null);
      mockTagsRepository.create.mockResolvedValue(mockTag);

      const result = await service.create(createTagDto);

      expect(mockTagsRepository.findByName).toHaveBeenCalledWith(
        createTagDto.name,
      );
      expect(mockTagsRepository.create).toHaveBeenCalledWith({
        name: 'javascript',
        description: 'JavaScript programming language',
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw ConflictException if tag with same name exists', async () => {
      const createTagDto: CreateTagDto = {
        name: 'javascript',
        description: 'JavaScript programming language',
      };

      mockTagsRepository.findByName.mockResolvedValue(mockTag);

      await expect(service.create(createTagDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createTagDto)).rejects.toThrow(
        'Tag with name "javascript" already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const mockTags = [mockTag];
      mockTagsRepository.findAll.mockResolvedValue(mockTags);

      const result = await service.findAll();

      expect(mockTagsRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTags);
    });
  });

  describe('findById', () => {
    it('should return a tag by id', async () => {
      mockTagsRepository.findById.mockResolvedValue(mockTag);

      const result = await service.findById('tag-1');

      expect(mockTagsRepository.findById).toHaveBeenCalledWith('tag-1');
      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockTagsRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent')).rejects.toThrow(
        'Tag with ID "non-existent" not found',
      );
    });
  });

  describe('findByName', () => {
    it('should return a tag by name', async () => {
      mockTagsRepository.findByName.mockResolvedValue(mockTag);

      const result = await service.findByName('javascript');

      expect(mockTagsRepository.findByName).toHaveBeenCalledWith('javascript');
      expect(result).toEqual(mockTag);
    });

    it('should return null if tag not found', async () => {
      mockTagsRepository.findByName.mockResolvedValue(null);

      const result = await service.findByName('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const updateTagDto: UpdateTagDto = {
        name: 'updated-javascript',
        description: 'Updated description',
      };

      const updatedTag = { ...mockTag, ...updateTagDto };

      mockTagsRepository.findByName.mockResolvedValue(null);
      mockTagsRepository.update.mockResolvedValue(updatedTag);

      const result = await service.update('tag-1', updateTagDto);

      expect(mockTagsRepository.update).toHaveBeenCalledWith(
        'tag-1',
        updateTagDto,
      );
      expect(result).toEqual(updatedTag);
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateTagDto: UpdateTagDto = {
        name: 'existing-tag',
      };

      const existingTag = { ...mockTag, id: 'different-id' };
      mockTagsRepository.findByName.mockResolvedValue(existingTag);

      await expect(service.update('tag-1', updateTagDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if tag not found', async () => {
      const updateTagDto: UpdateTagDto = {
        name: 'updated-name',
      };

      mockTagsRepository.findByName.mockResolvedValue(null);
      mockTagsRepository.update.mockResolvedValue(null);

      await expect(
        service.update('non-existent', updateTagDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a tag', async () => {
      mockTagsRepository.remove.mockResolvedValue(true);

      await service.remove('tag-1');

      expect(mockTagsRepository.remove).toHaveBeenCalledWith('tag-1');
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockTagsRepository.remove.mockResolvedValue(false);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOrCreateTags', () => {
    it('should find existing tags and create new ones', async () => {
      const tagNames = ['javascript', 'typescript', 'react'];
      const existingTags = [
        { ...mockTag, name: 'javascript' },
        { ...mockTag, name: 'typescript' },
      ];
      const newTag = { ...mockTag, name: 'react' };

      mockTagsRepository.findByName
        .mockResolvedValueOnce(existingTags[0]) // javascript exists
        .mockResolvedValueOnce(existingTags[1]) // typescript exists
        .mockResolvedValueOnce(null) // react doesn't exist
        .mockResolvedValueOnce(newTag); // react created

      mockTagsRepository.create.mockResolvedValue(newTag);

      const result = await service.findOrCreateTags(tagNames);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(existingTags[0]);
      expect(result[1]).toEqual(existingTags[1]);
      expect(result[2]).toEqual(newTag);
      expect(mockTagsRepository.create).toHaveBeenCalledWith({ name: 'react' });
    });
  });
});
