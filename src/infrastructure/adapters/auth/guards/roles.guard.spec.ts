import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RoleName } from '@domain/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (
    user: { roleName?: RoleName; userId?: string; email?: string },
    roles?: RoleName[],
  ): ExecutionContext => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    if (roles) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
    }

    return mockContext;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockExecutionContext({
        roleName: RoleName.CUSTOMER,
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      const user = {
        userId: '123',
        email: 'admin@test.com',
        roleName: RoleName.ADMIN,
      };
      const context = createMockExecutionContext(user, [RoleName.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const user = {
        userId: '123',
        email: 'customer@test.com',
        roleName: RoleName.CUSTOMER,
      };
      const context = createMockExecutionContext(user, [
        RoleName.ADMIN,
        RoleName.CUSTOMER,
      ]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      const user = {
        userId: '123',
        email: 'customer@test.com',
        roleName: RoleName.CUSTOMER,
      };
      const context = createMockExecutionContext(user, [RoleName.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when user is not authenticated', () => {
      const context = createMockExecutionContext(null, [RoleName.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when user has no role information', () => {
      const user = { userId: '123', email: 'test@test.com' };
      const context = createMockExecutionContext(user, [RoleName.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with descriptive message', () => {
      const user = {
        userId: '123',
        email: 'customer@test.com',
        roleName: RoleName.CUSTOMER,
      };
      const context = createMockExecutionContext(user, [RoleName.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        'Access denied: Required roles are ADMIN',
      );
    });
  });

  describe('metadata reflection', () => {
    it('should check both handler and class for roles metadata', () => {
      const user = {
        userId: '123',
        email: 'admin@test.com',
        roleName: RoleName.ADMIN,
      };
      const context = createMockExecutionContext(user, [RoleName.ADMIN]);
      const spy = jest.spyOn(reflector, 'getAllAndOverride');

      guard.canActivate(context);

      expect(spy).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
