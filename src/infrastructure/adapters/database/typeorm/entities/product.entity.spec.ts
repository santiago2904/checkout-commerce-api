import { Product } from './product.entity';

describe('Product Entity', () => {
  describe('instantiation', () => {
    it('should create a Product instance', () => {
      const product = new Product();
      expect(product).toBeInstanceOf(Product);
    });

    it('should have id property', () => {
      const product = new Product();
      product.id = 'test-id';
      expect(product.id).toBe('test-id');
    });

    it('should have name property', () => {
      const product = new Product();
      product.name = 'Test Product';
      expect(product.name).toBe('Test Product');
    });

    it('should have description property', () => {
      const product = new Product();
      product.description = 'Test Description';
      expect(product.description).toBe('Test Description');
    });

    it('should have price property', () => {
      const product = new Product();
      product.price = 99.99;
      expect(product.price).toBe(99.99);
    });

    it('should have stock property', () => {
      const product = new Product();
      product.stock = 10;
      expect(product.stock).toBe(10);
    });
  });

  describe('inheritance', () => {
    it('should have createdAt from BaseEntity', () => {
      const product = new Product();
      expect(product).toHaveProperty('createdAt');
    });

    it('should have updatedAt from BaseEntity', () => {
      const product = new Product();
      expect(product).toHaveProperty('updatedAt');
    });

    it('should have deletedAt from BaseEntity', () => {
      const product = new Product();
      expect(product).toHaveProperty('deletedAt');
    });
  });

  describe('validation', () => {
    it('should accept positive price', () => {
      const product = new Product();
      product.price = 10.50;
      expect(product.price).toBeGreaterThan(0);
    });

    it('should accept zero or positive stock', () => {
      const product = new Product();
      product.stock = 0;
      expect(product.stock).toBeGreaterThanOrEqual(0);
    });
  });
});
