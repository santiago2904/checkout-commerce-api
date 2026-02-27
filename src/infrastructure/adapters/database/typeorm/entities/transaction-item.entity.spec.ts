import { TransactionItem } from './transaction-item.entity';

describe('TransactionItem Entity', () => {
  describe('instantiation', () => {
    it('should create a TransactionItem instance', () => {
      const item = new TransactionItem();
      expect(item).toBeInstanceOf(TransactionItem);
    });

    it('should have all required properties', () => {
      const item = new TransactionItem();
      item.id = 'test-id';
      item.transactionId = 'test-transaction-id';
      item.productId = 'test-product-id';
      item.productName = 'Test Product';
      item.quantity = 2;
      item.unitPrice = 100.5;
      item.subtotal = 201.0;

      expect(item.id).toBe('test-id');
      expect(item.transactionId).toBe('test-transaction-id');
      expect(item.productId).toBe('test-product-id');
      expect(item.productName).toBe('Test Product');
      expect(item.quantity).toBe(2);
      expect(item.unitPrice).toBe(100.5);
      expect(item.subtotal).toBe(201.0);
    });
  });

  describe('BaseEntity properties', () => {
    it('should extend BaseEntity', () => {
      const item = new TransactionItem();
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('deletedAt');
    });
  });
});
