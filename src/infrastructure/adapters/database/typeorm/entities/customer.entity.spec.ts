import { Customer } from './customer.entity';
import { User } from './user.entity';

describe('Customer Entity', () => {
  describe('instantiation', () => {
    it('should create a Customer instance', () => {
      const customer = new Customer();
      expect(customer).toBeInstanceOf(Customer);
    });

    it('should have id property', () => {
      const customer = new Customer();
      customer.id = 'test-id';
      expect(customer.id).toBe('test-id');
    });

    it('should have firstName property', () => {
      const customer = new Customer();
      customer.firstName = 'John';
      expect(customer.firstName).toBe('John');
    });

    it('should have lastName property', () => {
      const customer = new Customer();
      customer.lastName = 'Doe';
      expect(customer.lastName).toBe('Doe');
    });

    it('should have phone property', () => {
      const customer = new Customer();
      customer.phone = '+1234567890';
      expect(customer.phone).toBe('+1234567890');
    });

    it('should have address property', () => {
      const customer = new Customer();
      customer.address = '123 Main St';
      expect(customer.address).toBe('123 Main St');
    });

    it('should have city property', () => {
      const customer = new Customer();
      customer.city = 'New York';
      expect(customer.city).toBe('New York');
    });

    it('should have country property', () => {
      const customer = new Customer();
      customer.country = 'USA';
      expect(customer.country).toBe('USA');
    });

    it('should have user property', () => {
      const customer = new Customer();
      const user = new User();
      customer.user = user;
      expect(customer.user).toBe(user);
    });

    it('should have userId property', () => {
      const customer = new Customer();
      customer.userId = 'user-id';
      expect(customer.userId).toBe('user-id');
    });
  });

  describe('inheritance', () => {
    it('should have createdAt from BaseEntity', () => {
      const customer = new Customer();
      expect(customer).toHaveProperty('createdAt');
    });

    it('should have updatedAt from BaseEntity', () => {
      const customer = new Customer();
      expect(customer).toHaveProperty('updatedAt');
    });

    it('should have deletedAt from BaseEntity', () => {
      const customer = new Customer();
      expect(customer).toHaveProperty('deletedAt');
    });
  });

  describe('relationships', () => {
    it('should have OneToOne relationship with User', () => {
      const customer = new Customer();
      const user = new User();
      user.email = 'test@example.com';
      customer.user = user;

      expect(customer.user).toBe(user);
      expect(customer.user.email).toBe('test@example.com');
    });

    it('should store userId for the relationship', () => {
      const customer = new Customer();
      const userId = 'test-user-id';
      customer.userId = userId;

      expect(customer.userId).toBe(userId);
    });
  });
});
