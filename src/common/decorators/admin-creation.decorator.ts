import { UseGuards, applyDecorators } from '@nestjs/common';
import { AdminCreationGuard } from '../guards/admin-creation.guard';

export const AdminCreation = () =>
  applyDecorators(UseGuards(AdminCreationGuard));
