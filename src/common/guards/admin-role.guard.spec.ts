import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminRoleGuard } from './admin-role.guard';

describe('AdminRoleGuard', () => {
  let guard: AdminRoleGuard;
  let mockReflector: any;

  beforeEach(async () => {
    mockReflector = {
      // Mock reflector methods if needed
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRoleGuard,
        {
          provide: 'Reflector',
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<AdminRoleGuard>(AdminRoleGuard);
  });

  it('should allow access for ADMIN user', () => {
    const mockRequest = {
      user: {
        id: '1',
        role: {
          id: 'role-1',
          name: 'admin',
        },
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should deny access for AUTHOR user', () => {
    const mockRequest = {
      user: {
        id: '1',
        role: {
          id: 'role-2',
          name: 'author',
        },
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should deny access for unauthenticated user', () => {
    const mockRequest = {};

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
