import { RoleName } from '@domain/enums';
import { Roles, ROLES_KEY } from './roles.decorator';
import { Reflector } from '@nestjs/core';

describe('Roles Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set metadata with single role', () => {
    class TestController {
      @Roles(RoleName.ADMIN)
      testMethod() {}
    }

    const roles = reflector.get<RoleName[]>(ROLES_KEY, TestController.prototype.testMethod);
    expect(roles).toEqual([RoleName.ADMIN]);
  });

  it('should set metadata with multiple roles', () => {
    class TestController {
      @Roles(RoleName.ADMIN, RoleName.CUSTOMER)
      testMethod() {}
    }

    const roles = reflector.get<RoleName[]>(ROLES_KEY, TestController.prototype.testMethod);
    expect(roles).toEqual([RoleName.ADMIN, RoleName.CUSTOMER]);
  });

  it('should use correct metadata key', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
