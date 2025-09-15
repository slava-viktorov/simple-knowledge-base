import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './users.repository.interface';
import { RolesService } from '../roles/roles.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: IUsersRepository;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@test.com',
    username: 'testuser',
    passwordHash: 'hashedPassword',
    roleId: 'role-1',
    role: {
      id: 'role-1',
      name: 'author',
      description: 'Regular user',
      users: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    articles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshTokens: [],
  };
  const userData = {
    email: 'test@test.com',
    username: 'testuser',
    password: 'password123',
    roleId: 'role-1',
  };

  const mockUsersRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailOrUsername: jest.fn(),
    findAllBySource: jest.fn(),
    deleteById: jest.fn(),
    update: jest.fn(),
  };

  const mockRolesService = {
    findAuthorRole: jest.fn(),
    findAdminRole: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    // Сброс моков
    Object.values(mockUsersRepository).forEach((fn) => fn.mockReset());
    Object.values(mockRolesService).forEach((fn) => fn.mockReset());

    // Настройка mock для роли author
    mockRolesService.findAuthorRole.mockResolvedValue({
      id: 'role-1',
      name: 'author',
      description: 'Regular user',
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_REPOSITORY,
          useValue: mockUsersRepository,
        },
        { provide: RolesService, useValue: mockRolesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockRolesService.findById.mockResolvedValue({
        id: 'role-1',
        name: 'author',
      });
      jest.spyOn(usersRepository, 'create').mockResolvedValue(mockUser);

      const result = await service.create(userData);

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          username: userData.username,
          passwordHash: expect.any(String),
          roleId: userData.roleId,
        }),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@test.com');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@test.com');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        'nonexistent@test.com',
      );
      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrUsername', () => {
    it('should find user by email or username', async () => {
      jest
        .spyOn(usersRepository, 'findByEmailOrUsername')
        .mockResolvedValue(mockUser);

      const result = await service.findByEmailOrUsername(
        'test@test.com',
        'testuser',
      );

      expect(usersRepository.findByEmailOrUsername).toHaveBeenCalledWith(
        'test@test.com',
        'testuser',
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest
        .spyOn(usersRepository, 'findByEmailOrUsername')
        .mockResolvedValue(null);

      const result = await service.findByEmailOrUsername(
        'nonexistent@test.com',
        'nonexistentuser',
      );

      expect(usersRepository.findByEmailOrUsername).toHaveBeenCalledWith(
        'nonexistent@test.com',
        'nonexistentuser',
      );
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      jest.spyOn(usersRepository, 'findById').mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(usersRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findById').mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(usersRepository.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateUserDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateUserDto);

      expect(usersRepository.update).toHaveBeenCalledWith(
        'user-1',
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateUserDto = { username: 'updateduser' };
      mockUsersRepository.update.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);

      expect(usersRepository.update).toHaveBeenCalledWith(
        'nonexistent-id',
        updateUserDto,
      );
    });
  });
});
