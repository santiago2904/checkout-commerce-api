import { Delivery } from './delivery.entity';
import { Customer } from './customer.entity';

describe('Delivery Entity', () => {
  describe('instantiation', () => {
    it('should create a Delivery instance', () => {
      const delivery = new Delivery();
      expect(delivery).toBeInstanceOf(Delivery);
    });

    it('should have id property', () => {
      const delivery = new Delivery();
      delivery.id = 'test-id';
      expect(delivery.id).toBe('test-id');
    });

    it('should have address property', () => {
      const delivery = new Delivery();
      delivery.address = '123 Main St';
      expect(delivery.address).toBe('123 Main St');
    });

    it('should have city property', () => {
      const delivery = new Delivery();
      delivery.city = 'New York';
      expect(delivery.city).toBe('New York');
    });

    it('should have trackingNumber property', () => {
      const delivery = new Delivery();
      delivery.trackingNumber = 'TRACK123';
      expect(delivery.trackingNumber).toBe('TRACK123');
    });

    it('should have status property', () => {
      const delivery = new Delivery();
      delivery.status = 'PENDING';
      expect(delivery.status).toBe('PENDING');
    });

    it('should have estimatedDelivery property', () => {
      const delivery = new Delivery();
      const date = new Date();
      delivery.estimatedDelivery = date;
      expect(delivery.estimatedDelivery).toBe(date);
    });

    it('should have actualDelivery property', () => {
      const delivery = new Delivery();
      const date = new Date();
      delivery.actualDelivery = date;
      expect(delivery.actualDelivery).toBe(date);
    });

    it('should have customer property', () => {
      const delivery = new Delivery();
      const customer = new Customer();
      delivery.customer = customer;
      expect(delivery.customer).toBe(customer);
    });

    it('should have customerId property', () => {
      const delivery = new Delivery();
      delivery.customerId = 'customer-id';
      expect(delivery.customerId).toBe('customer-id');
    });
  });

  describe('inheritance', () => {
    it('should have createdAt from BaseEntity', () => {
      const delivery = new Delivery();
      expect(delivery).toHaveProperty('createdAt');
    });

    it('should have updatedAt from BaseEntity', () => {
      const delivery = new Delivery();
      expect(delivery).toHaveProperty('updatedAt');
    });

    it('should have deletedAt from BaseEntity', () => {
      const delivery = new Delivery();
      expect(delivery).toHaveProperty('deletedAt');
    });
  });

  describe('relationships', () => {
    it('should have ManyToOne relationship with Customer', () => {
      const delivery = new Delivery();
      const customer = new Customer();
      customer.firstName = 'John';
      delivery.customer = customer;

      expect(delivery.customer).toBe(customer);
      expect(delivery.customer.firstName).toBe('John');
    });

    it('should store customerId for the relationship', () => {
      const delivery = new Delivery();
      const customerId = 'test-customer-id';
      delivery.customerId = customerId;

      expect(delivery.customerId).toBe(customerId);
    });
  });
});
