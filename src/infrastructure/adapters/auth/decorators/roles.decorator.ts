import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@domain/enums';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Marks routes with required roles for access control
 * @param roles Array of role names required to access the route
 * 
 * @example
 * @Roles(RoleName.ADMIN)
 * @Roles(RoleName.ADMIN, RoleName.CUSTOMER)
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
