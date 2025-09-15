import { Role } from '../roles/entities/role.entity';

export const ROLE_NAMES = {
  AUTHOR: 'author',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  EDITOR: 'editor',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const ADMIN_ROLES: RoleName[] = [ROLE_NAMES.ADMIN];
export const MODERATOR_ROLES: RoleName[] = [
  ROLE_NAMES.ADMIN,
  ROLE_NAMES.MODERATOR,
];
export const EDITOR_ROLES: RoleName[] = [ROLE_NAMES.ADMIN, ROLE_NAMES.EDITOR];

export const hasAdminAccess = (role?: Role | null): boolean => {
  if (!role) return false;
  return ADMIN_ROLES.includes(role.name as RoleName);
};

export const hasModeratorAccess = (role?: Role | null): boolean => {
  if (!role) return false;
  return MODERATOR_ROLES.includes(role.name as RoleName);
};

export const hasEditorAccess = (role?: Role | null): boolean => {
  if (!role) return false;
  return EDITOR_ROLES.includes(role.name as RoleName);
};

export const isAdminRole = (roleName: string): boolean => {
  return ADMIN_ROLES.includes(roleName as RoleName);
};

export const getAdminRoleNames = (): RoleName[] => {
  return [...ADMIN_ROLES];
};

export const isValidRoleName = (name: string): name is RoleName => {
  return Object.values(ROLE_NAMES).includes(name as RoleName);
};
