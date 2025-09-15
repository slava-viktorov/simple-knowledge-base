import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';

describe('RolesService', () => {
  let service: RolesService;
  let rolesRepository: Repository<Role>;

  const mockRole = {
    id: 'role-1',
    name: 'author',
    description: 'Regular user',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminRole = {
    id: 'role-2',
    name: 'admin',
    description: 'Administrator',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRolesRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    rolesRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      mockRolesRepository.find.mockResolvedValue([mockRole, mockAdminRole]);

      const result = await service.findAll();

      expect(rolesRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockRole, mockAdminRole]);
    });
  });

  describe('findById', () => {
    it('should return a role by id', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(mockRole);

      const result = await service.findById('role-1');

      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({ id: 'role-1' });
      expect(result).toEqual(mockRole);
    });

    it('should return null if role not found', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a role by name', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(mockRole);

      const result = await service.findByName('author');

      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({
        name: 'author',
      });
      expect(result).toEqual(mockRole);
    });
  });

  describe('findAdminRole', () => {
    it('should return admin role', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(mockAdminRole);

      const result = await service.findAdminRole();

      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({ name: 'admin' });
      expect(result).toEqual(mockAdminRole);
    });
  });

  describe('findAuthorRole', () => {
    it('should return author role', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(mockRole);

      const result = await service.findAuthorRole();

      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({
        name: 'author',
      });
      expect(result).toEqual(mockRole);
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const roleData = {
        name: 'moderator',
        description: 'Moderator role',
      };
      mockRolesRepository.create.mockReturnValue(roleData);
      mockRolesRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(roleData);

      expect(rolesRepository.create).toHaveBeenCalledWith(roleData);
      expect(rolesRepository.save).toHaveBeenCalledWith(roleData);
      expect(result).toEqual(mockRole);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updateData = { description: 'Updated description' };
      mockRolesRepository.update.mockResolvedValue({ affected: 1 });
      mockRolesRepository.findOneBy.mockResolvedValue(mockRole);

      const result = await service.update('role-1', updateData);

      expect(rolesRepository.update).toHaveBeenCalledWith('role-1', updateData);
      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({ id: 'role-1' });
      expect(result).toEqual(mockRole);
    });
  });

  describe('delete', () => {
    it('should delete a role', async () => {
      mockRolesRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete('role-1');

      expect(rolesRepository.delete).toHaveBeenCalledWith('role-1');
      expect(result).toBe(true);
    });

    it('should return false if role not found', async () => {
      mockRolesRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.delete('non-existent');

      expect(result).toBe(false);
    });
  });
});
