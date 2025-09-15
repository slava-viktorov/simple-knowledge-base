import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAdminAccess } from '../roles';
import { User } from '../../users/entities/user.entity';

interface AuthenticatedRequest {
  user?: User;
}

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Forbidden: User not authenticated');
    }

    if (!hasAdminAccess(user.role)) {
      throw new ForbiddenException(
        'Forbidden: Access denied. Admin role required',
      );
    }

    return true;
  }
}
