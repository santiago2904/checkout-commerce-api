import { User } from './user.entity';
import { Role } from './role.entity';
import { RoleName } from '@domain/enums';

describe('User Entity', () => {
  describe('instantiation', () => {
    it('should create a User instance', () => {
      const user = new User();
      expect(user).toBeInstanceOf(User);
    });

    it('should have id property', () => {
      const user = new User();
      user.id = 'test-id';
      expect(user.id).toBe('test-id');
    });

    it('should have email property', () => {
      const user = new User();
      user.email = 'test@example.com';
      expect(user.email).toBe('test@example.com');
    });

    it('should have password property', () => {
      const user = new User();
      user.password = 'hashed_password';
      expect(user.password).toBe('hashed_password');
    });

    it('should have role property', () => {
      const user = new User();
      const role = new Role();
      user.role = role;
      expect(user.role).toBe(role);
    });

    it('should have roleId property', () => {
      const user = new User();
      user.roleId = 'role-id';
      expect(user.roleId).toBe('role-id');
    });
  });

  describe('inheritance', () => {
    it('should have createdAt from BaseEntity', () => {
      const user = new User();
      expect(user).toHaveProperty('createdAt');
    });

    it('should have updatedAt from BaseEntity', () => {
      const user = new User();
      expect(user).toHaveProperty('updatedAt');
    });

    it('should have deletedAt from BaseEntity', () => {
      const user = new User();
      expect(user).toHaveProperty('deletedAt');
    });
  });

  describe('relationships', () => {
    it('should have ManyToOne relationship with Role', () => {
      const user = new User();
      const role = new Role();
      role.name = RoleName.ADMIN;
      user.role = role;

      expect(user.role).toBe(role);
      expect(user.role.name).toBe(RoleName.ADMIN);
    });

    it('should store roleId for the relationship', () => {
      const user = new User();
      const roleId = 'test-role-id';
      user.roleId = roleId;

      expect(user.roleId).toBe(roleId);
    });
  });
});
