import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { hasAdminAccess } from '../../common/roles';

interface AuthenticatedRequest {
  user?: User;
  params: {
    id: string;
  };
  body: {
    email?: string;
    roleId?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class UserEditGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentUser = request.user;
    const targetUserId = request.params.id;

    if (!currentUser) {
      throw new ForbiddenException('Authentication required');
    }

    const isAdmin = hasAdminAccess(currentUser.role);
    const isSelfEdit = currentUser.id === targetUserId;

    // Админ может редактировать любого пользователя
    if (isAdmin) {
      return true;
    }

    // Пользователь может редактировать только себя
    if (!isSelfEdit) {
      throw new ForbiddenException('You can only edit your own profile');
    }

    // Политика прав: формат и ограничения полей проверяются DTO/ValidationPipe.
    // Дополнительные бизнес-ограничения на изменение критичных полей следует
    // обрабатывать в слое сервиса при необходимости.

    return true;
  }
}
