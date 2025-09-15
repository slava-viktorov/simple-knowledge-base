import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEditGuard } from './user-edit.guard';
import { User } from '../entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { ROLE_NAMES } from '../../common/roles';

describe('UserEditGuard', () => {
  let guard: UserEditGuard;

  const mockRole: Role = {
    id: 'role-id',
    name: ROLE_NAMES.AUTHOR,
    description: 'Regular user role',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminRole: Role = {
    id: 'admin-role-id',
    name: ROLE_NAMES.ADMIN,
    description: 'Admin role',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-id',
    email: 'user@example.com',
    username: 'testuser',
    passwordHash: 'hash',
    source: 'test',
    role: mockRole,
    roleId: mockRole.id,
    articles: [],
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser: User = {
    ...mockUser,
    id: 'admin-id',
    email: 'admin@example.com',
    username: 'admin',
    role: mockAdminRole,
    roleId: mockAdminRole.id,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserEditGuard],
    }).compile();

    guard = module.get<UserEditGuard>(UserEditGuard);
  });

  describe('canActivate', () => {
    const createMockExecutionContext = (
      user: User | undefined,
      targetUserId: string,
      body: any,
    ): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            user,
            params: { id: targetUserId },
            body,
          }),
        }),
      }) as ExecutionContext;

    it('should throw ForbiddenException if user is not authenticated', () => {
      const context = createMockExecutionContext(undefined, 'target-id', {});

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Authentication required',
      );
    });

    it('should allow admin to edit any user', () => {
      const context = createMockExecutionContext(mockAdminUser, 'target-id', {
        username: 'newusername',
        email: 'newemail@example.com',
        roleId: 'new-role-id',
      });

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow user to edit themselves (fields validated by DTO)', () => {
      const context = createMockExecutionContext(mockUser, mockUser.id, {
        username: 'newusername',
        email: 'newemail@example.com',
        roleId: 'new-role-id',
      });

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should not allow user to edit other users', () => {
      const context = createMockExecutionContext(mockUser, 'other-user-id', {
        username: 'newusername',
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'You can only edit your own profile',
      );
    });
  });
});
