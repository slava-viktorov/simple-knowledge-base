import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AdminCreationGuard } from './admin-creation.guard';
import { RolesService } from '../../roles/roles.service';

describe('AdminCreationGuard', () => {
  let guard: AdminCreationGuard;
  // rolesService is provided via DI; explicit variable not needed in tests

  const mockRolesService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    // Сброс моков
    Object.values(mockRolesService).forEach((fn) => fn.mockReset());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCreationGuard,
        { provide: RolesService, useValue: mockRolesService },
      ],
    }).compile();

    guard = module.get<AdminCreationGuard>(AdminCreationGuard);
    void module.get<RolesService>(RolesService);
  });

  it('should allow anyone to create user without roleId', async () => {
    const mockRequest = {
      body: {
        // roleId не указан, будет по умолчанию AUTHOR
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should deny non-admin creating user with specific author role', async () => {
    const mockRequest = {
      user: {
        id: 'u1',
        role: { id: '11111111-1111-4111-8111-111111111111', name: 'author' },
      },
      body: {
        roleId: '11111111-1111-4111-8111-111111111111', // author role (UUID v4)
      },
    };

    mockRolesService.findById.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'author',
    });

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Only administrators can create users with a specific role',
    );
  });

  it('should allow ADMIN user to create ADMIN user', async () => {
    const mockRequest = {
      user: {
        id: '1',
        role: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'admin',
        },
      },
      body: {
        roleId: '22222222-2222-4222-8222-222222222222', // admin role (UUID v4)
      },
    };

    mockRolesService.findById.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'admin',
    });

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockRolesService.findById).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
    );
  });

  it('should throw BadRequest for invalid role', async () => {
    const mockRequest = {
      user: {
        id: 'u1',
        role: { id: '22222222-2222-4222-8222-222222222222', name: 'admin' },
      },
      body: {
        roleId: '33333333-3333-4333-8333-333333333333',
      },
    };

    mockRolesService.findById.mockResolvedValue(null);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      BadRequestException,
    );
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Invalid role specified',
    );
  });

  it('should deny unauthenticated user from creating ADMIN user', async () => {
    const mockRequest = {
      body: {
        roleId: '22222222-2222-4222-8222-222222222222', // admin role
      },
    };

    mockRolesService.findById.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'admin',
    });

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Authentication required to create users with a specific role',
    );
  });

  it('should deny AUTHOR user from creating ADMIN user', async () => {
    const mockRequest = {
      user: {
        id: '1',
        role: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'author',
        },
      },
      body: {
        roleId: '22222222-2222-4222-8222-222222222222', // admin role
      },
    };

    mockRolesService.findById.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'admin',
    });

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Only administrators can create users with a specific role',
    );
  });
});
