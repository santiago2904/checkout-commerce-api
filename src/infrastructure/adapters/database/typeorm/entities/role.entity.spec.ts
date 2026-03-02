import { Role } from './role.entity';
import { RoleName } from '@domain/enums';

describe('Role Entity', () => {
  describe('instantiation', () => {
    it('should create a Role instance', () => {
      const role = new Role();
      expect(role).toBeInstanceOf(Role);
    });

    it('should have id property', () => {
      const role = new Role();
      role.id = 'test-id';
      expect(role.id).toBe('test-id');
    });

    it('should have name property', () => {
      const role = new Role();
      role.name = RoleName.ADMIN;
      expect(role.name).toBe(RoleName.ADMIN);
    });

    it('should have description property', () => {
      const role = new Role();
      role.description = 'Administrator role';
      expect(role.description).toBe('Administrator role');
    });
  });

  describe('inheritance', () => {
    it('should have createdAt from BaseEntity', () => {
      const role = new Role();
      expect(role).toHaveProperty('createdAt');
    });

    it('should have updatedAt from BaseEntity', () => {
      const role = new Role();
      expect(role).toHaveProperty('updatedAt');
    });

    it('should have deletedAt from BaseEntity', () => {
      const role = new Role();
      expect(role).toHaveProperty('deletedAt');
    });
  });

  describe('validation', () => {
    it('should accept ADMIN role name', () => {
      const role = new Role();
      role.name = RoleName.ADMIN;
      expect(role.name).toBe(RoleName.ADMIN);
    });

    it('should accept CUSTOMER role name', () => {
      const role = new Role();
      role.name = RoleName.CUSTOMER;
      expect(role.name).toBe(RoleName.CUSTOMER);
    });
  });
});
