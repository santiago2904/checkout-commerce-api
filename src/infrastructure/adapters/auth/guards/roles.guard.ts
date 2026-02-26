import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@domain/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard
 * Validates if the authenticated user has the required roles
 * Must be used after JwtAuthGuard to ensure user is authenticated
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (injected by JWT strategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated
    if (!user || !user.roleName) {
      throw new ForbiddenException('Access denied: No role information found');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.includes(user.roleName);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Required roles are ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
