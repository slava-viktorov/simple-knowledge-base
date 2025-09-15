import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

export const ADMIN_ONLY_KEY = 'adminOnly';

export const AdminOnly = () =>
  applyDecorators(
    SetMetadata(ADMIN_ONLY_KEY, true),
    // Сначала аутентификация (401), затем проверка роли (403)
    UseGuards(JwtAuthGuard, AdminRoleGuard),
  );
