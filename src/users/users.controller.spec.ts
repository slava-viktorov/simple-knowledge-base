import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';
import { AdminCreationGuard } from '../common/guards/admin-creation.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
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

  const mockUsersService = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  };

  const mockRolesService = {
    findById: jest.fn(),
    findAuthorRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        AdminCreationGuard,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new AUTHOR user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        roleId: 'role-1',
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        username: createUserDto.username,
        password: createUserDto.password,
        roleId: createUserDto.roleId,
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        }),
      );
    });

    it('should create a new user without role (defaults to AUTHOR)', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        username: createUserDto.username,
        password: createUserDto.password,
        roleId: undefined,
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findById('user-1');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(controller.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = {
        username: 'updateduser',
      };
      const updatedUser = { ...mockUser, ...updateUserDto };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-1', updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith('user-1', updateUserDto);
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-1',
          username: 'updateduser',
          email: 'test@example.com',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      mockUsersService.deleteById.mockResolvedValue(1);

      await controller.remove('user-1');

      expect(usersService.deleteById).toHaveBeenCalledWith('user-1');
    });
  });
});
