import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { hasAdminAccess } from '../roles';
import { RolesService } from '../../roles/roles.service';
import { User } from '../../users/entities/user.entity';

interface AuthenticatedRequest {
  user?: User;
  body: {
    roleId?: string;
  };
}

@Injectable()
export class AdminCreationGuard implements CanActivate {
  constructor(private readonly rolesService: RolesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const body = request.body;

    // Если явно указана роль при создании (roleId присутствует)
    if (body.roleId) {
      // Валидация UUID формата для единообразной ошибки 400
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(body.roleId)) {
        throw new BadRequestException('roleId must be a UUID');
      }

      if (!user) {
        throw new ForbiddenException(
          'Forbidden: Authentication required to create users with a specific role',
        );
      }

      if (!hasAdminAccess(user.role)) {
        throw new ForbiddenException(
          'Forbidden: Only administrators can create users with a specific role',
        );
      }

      // Проверяем, что указанная роль существует
      const targetRole = await this.rolesService.findById(body.roleId);
      if (!targetRole) {
        throw new BadRequestException('Invalid role specified');
      }

      return true;
    }

    // Если роль не указана (будет назначена author по умолчанию) — разрешаем публично
    return true;
  }
}
