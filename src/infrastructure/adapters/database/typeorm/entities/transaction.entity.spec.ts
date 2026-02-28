import { Transaction } from './transaction.entity';
import { Customer } from './customer.entity';
import { TransactionStatus } from '@domain/enums';

describe('Transaction Entity', () => {
  describe('instantiation', () => {
    it('should create a Transaction instance', () => {
      const transaction = new Transaction();
      expect(transaction).toBeInstanceOf(Transaction);
    });

    it('should have id property', () => {
      const transaction = new Transaction();
      transaction.id = 'test-id';
      expect(transaction.id).toBe('test-id');
    });

    it('should have amount property', () => {
      const transaction = new Transaction();
      transaction.amount = 99.99;
      expect(transaction.amount).toBe(99.99);
    });

    it('should have reference property', () => {
      const transaction = new Transaction();
      transaction.reference = 'REF123';
      expect(transaction.reference).toBe('REF123');
    });

    it('should have status property', () => {
      const transaction = new Transaction();
      transaction.status = TransactionStatus.PENDING;
      expect(transaction.status).toBe(TransactionStatus.PENDING);
    });

    it('should have customer property', () => {
      const transaction = new Transaction();
      const customer = new Customer();
      transaction.customer = customer;
      expect(transaction.customer).toBe(customer);
    });

    it('should have customerId property', () => {
      const transaction = new Transaction();
      transaction.customerId = 'customer-id';
      expect(transaction.customerId).toBe('customer-id');
    });

    it('should have paymentMethod property', () => {
      const transaction = new Transaction();
      transaction.paymentMethod = 'CARD';
      expect(transaction.paymentMethod).toBe('CARD');
    });

    it('should have ipAddress property', () => {
      const transaction = new Transaction();
      transaction.ipAddress = '192.168.1.1';
      expect(transaction.ipAddress).toBe('192.168.1.1');
    });

    it('should have wompiTransactionId property', () => {
      const transaction = new Transaction();
      transaction.wompiTransactionId = 'wompi-123-456';
      expect(transaction.wompiTransactionId).toBe('wompi-123-456');
    });

    it('should have errorCode property', () => {
      const transaction = new Transaction();
      transaction.errorCode = '422';
      expect(transaction.errorCode).toBe('422');
    });

    it('should have errorMessage property', () => {
      const transaction = new Transaction();
      transaction.errorMessage = 'Insufficient funds';
      expect(transaction.errorMessage).toBe('Insufficient funds');
    });
  });

  describe('inheritance', () => {
    it('should have createdAt from BaseEntity', () => {
      const transaction = new Transaction();
      expect(transaction).toHaveProperty('createdAt');
    });

    it('should have updatedAt from BaseEntity', () => {
      const transaction = new Transaction();
      expect(transaction).toHaveProperty('updatedAt');
    });

    it('should have deletedAt from BaseEntity', () => {
      const transaction = new Transaction();
      expect(transaction).toHaveProperty('deletedAt');
    });
  });

  describe('transaction status', () => {
    it('should accept PENDING status', () => {
      const transaction = new Transaction();
      transaction.status = TransactionStatus.PENDING;
      expect(transaction.status).toBe(TransactionStatus.PENDING);
    });

    it('should accept APPROVED status', () => {
      const transaction = new Transaction();
      transaction.status = TransactionStatus.APPROVED;
      expect(transaction.status).toBe(TransactionStatus.APPROVED);
    });

    it('should accept DECLINED status', () => {
      const transaction = new Transaction();
      transaction.status = TransactionStatus.DECLINED;
      expect(transaction.status).toBe(TransactionStatus.DECLINED);
    });

    it('should accept VOIDED status', () => {
      const transaction = new Transaction();
      transaction.status = TransactionStatus.VOIDED;
      expect(transaction.status).toBe(TransactionStatus.VOIDED);
    });

    it('should accept ERROR status', () => {
      const transaction = new Transaction();
      transaction.status = TransactionStatus.ERROR;
      expect(transaction.status).toBe(TransactionStatus.ERROR);
    });
  });

  describe('relationships', () => {
    it('should have ManyToOne relationship with Customer', () => {
      const transaction = new Transaction();
      const customer = new Customer();
      customer.firstName = 'John';
      transaction.customer = customer;

      expect(transaction.customer).toBe(customer);
      expect(transaction.customer.firstName).toBe('John');
    });

    it('should store customerId for the relationship', () => {
      const transaction = new Transaction();
      const customerId = 'test-customer-id';
      transaction.customerId = customerId;

      expect(transaction.customerId).toBe(customerId);
    });
  });
});
