import { Test, TestingModule } from '@nestjs/testing';
import {
  GetMyTransactionsUseCase,
  GetMyTransactionsError,
} from './get-my-transactions.use-case';
import type {
  ITransactionRepository,
  ITransactionItemRepository,
  IDeliveryRepository,
} from '@application/ports/out';
import {
  Transaction,
  TransactionItem,
  Delivery,
} from '@infrastructure/adapters/database/typeorm/entities';
import { TransactionStatus } from '@domain/enums';

describe('GetMyTransactionsUseCase', () => {
  let useCase: GetMyTransactionsUseCase;
  let transactionRepository: jest.Mocked<ITransactionRepository>;
  let transactionItemRepository: jest.Mocked<ITransactionItemRepository>;
  let deliveryRepository: jest.Mocked<IDeliveryRepository>;

  beforeEach(async () => {
    transactionRepository = {
      findByCustomerId: jest.fn(),
      findByCustomerEmail: jest.fn(),
    } as any;

    transactionItemRepository = {
      findByTransactionId: jest.fn(),
    } as any;

    deliveryRepository = {
      findByTransactionId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyTransactionsUseCase,
        {
          provide: 'ITransactionRepository',
          useValue: transactionRepository,
        },
        {
          provide: 'ITransactionItemRepository',
          useValue: transactionItemRepository,
        },
        {
          provide: 'IDeliveryRepository',
          useValue: deliveryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetMyTransactionsUseCase>(GetMyTransactionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return empty array when customer has no transactions', async () => {
      transactionRepository.findByCustomerId.mockResolvedValue([]);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual([]);
      }
      expect(transactionRepository.findByCustomerId).toHaveBeenCalledWith(
        'customer-123',
      );
    });

    it('should return transactions for a customer', async () => {
      const mockTransaction = {
        id: 'trans-123',
        reference: 'REF-123',
        status: TransactionStatus.APPROVED,
        amount: 100.0,
        paymentMethod: 'CARD',
        wompiTransactionId: 'wompi-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      const mockItems = [
        {
          productId: 'prod-1',
          productName: 'Product 1',
          quantity: 2,
          unitPrice: 50.0,
          subtotal: 100.0,
          product: {
            imageUrl: 'http://example.com/image.jpg',
          },
        },
      ] as TransactionItem[];

      const mockDelivery = {
        id: 'delivery-123',
        status: 'PENDING',
        trackingNumber: 'TRACK-123',
        recipientName: 'John Doe',
        address: '123 Main St',
        city: 'Bogotá',
        estimatedDelivery: new Date('2024-01-05'),
      } as Delivery;

      transactionRepository.findByCustomerId.mockResolvedValue([
        mockTransaction,
      ]);
      transactionRepository.findByCustomerEmail.mockResolvedValue([
        mockTransaction,
      ]);
      transactionItemRepository.findByTransactionId.mockResolvedValue(
        mockItems,
      );
      deliveryRepository.findByTransactionId.mockResolvedValue(mockDelivery);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toMatchObject({
          transactionId: 'trans-123',
          reference: 'REF-123',
          status: TransactionStatus.APPROVED,
          amount: 100.0,
          currency: 'COP',
          paymentMethod: 'CARD',
          wompiTransactionId: 'wompi-123',
        });
        expect(result.value[0].items).toHaveLength(1);
        expect(result.value[0].items![0]).toMatchObject({
          productId: 'prod-1',
          productName: 'Product 1',
          quantity: 2,
          unitPrice: 50.0,
          subtotal: 100.0,
          imageUrl: 'http://example.com/image.jpg',
        });
        expect(result.value[0].delivery).toMatchObject({
          deliveryId: 'delivery-123',
          status: 'PENDING',
          trackingNumber: 'TRACK-123',
          recipientName: 'John Doe',
          address: '123 Main St',
          city: 'Bogotá',
        });
      }
    });

    it('should handle transactions without delivery', async () => {
      const mockTransaction = {
        id: 'trans-123',
        reference: 'REF-123',
        status: TransactionStatus.PENDING,
        amount: 100.0,
        paymentMethod: 'CARD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      transactionRepository.findByCustomerId.mockResolvedValue([
        mockTransaction,
      ]);
      transactionRepository.findByCustomerEmail.mockResolvedValue([
        mockTransaction,
      ]);
      transactionItemRepository.findByTransactionId.mockResolvedValue([]);
      deliveryRepository.findByTransactionId.mockResolvedValue(null);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].delivery).toBeUndefined();
      }
    });

    it('should handle error codes and messages', async () => {
      const mockTransaction = {
        id: 'trans-123',
        reference: 'REF-123',
        status: TransactionStatus.DECLINED,
        amount: 100.0,
        paymentMethod: 'CARD',
        errorCode: 'DECLINED_BY_BANK',
        errorMessage: 'Insufficient funds',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      transactionRepository.findByCustomerId.mockResolvedValue([
        mockTransaction,
      ]);
      transactionRepository.findByCustomerEmail.mockResolvedValue([]);
      transactionItemRepository.findByTransactionId.mockResolvedValue([]);
      deliveryRepository.findByTransactionId.mockResolvedValue(null);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value[0].errorCode).toBe('DECLINED_BY_BANK');
        expect(result.value[0].errorMessage).toBe('Insufficient funds');
      }
    });

    it('should deduplicate transactions from both queries', async () => {
      const mockTransaction = {
        id: 'trans-123',
        reference: 'REF-123',
        status: TransactionStatus.APPROVED,
        amount: 100.0,
        paymentMethod: 'CARD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      // Both queries return the same transaction
      transactionRepository.findByCustomerId.mockResolvedValue([
        mockTransaction,
      ]);
      transactionRepository.findByCustomerEmail.mockResolvedValue([
        mockTransaction,
      ]);
      transactionItemRepository.findByTransactionId.mockResolvedValue([]);
      deliveryRepository.findByTransactionId.mockResolvedValue(null);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // Should only have one transaction, not two
        expect(result.value).toHaveLength(1);
      }
    });

    it('should sort transactions by createdAt descending', async () => {
      const transaction1 = {
        id: 'trans-1',
        reference: 'REF-1',
        status: TransactionStatus.APPROVED,
        amount: 100.0,
        paymentMethod: 'CARD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      const transaction2 = {
        id: 'trans-2',
        reference: 'REF-2',
        status: TransactionStatus.APPROVED,
        amount: 200.0,
        paymentMethod: 'CARD',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      transactionRepository.findByCustomerId.mockResolvedValue([
        transaction1,
        transaction2,
      ]);
      transactionRepository.findByCustomerEmail.mockResolvedValue([]);
      transactionItemRepository.findByTransactionId.mockResolvedValue([]);
      deliveryRepository.findByTransactionId.mockResolvedValue(null);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toHaveLength(2);
        // Newest first
        expect(result.value[0].transactionId).toBe('trans-2');
        expect(result.value[1].transactionId).toBe('trans-1');
      }
    });

    it('should handle delivery lookup errors gracefully', async () => {
      const mockTransaction = {
        id: 'trans-123',
        reference: 'REF-123',
        status: TransactionStatus.APPROVED,
        amount: 100.0,
        paymentMethod: 'CARD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      transactionRepository.findByCustomerId.mockResolvedValue([
        mockTransaction,
      ]);
      transactionRepository.findByCustomerEmail.mockResolvedValue([]);
      transactionItemRepository.findByTransactionId.mockResolvedValue([]);
      deliveryRepository.findByTransactionId.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value[0].delivery).toBeUndefined();
      }
    });

    it('should return error when repository throws', async () => {
      transactionRepository.findByCustomerId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await useCase.execute('customer-123');

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(GetMyTransactionsError);
        expect(result.error.code).toBe('GET_TRANSACTIONS_FAILED');
        expect(result.error.message).toBe('Failed to retrieve transactions');
      }
    });

    it('should handle transactions without customer email', async () => {
      const mockTransaction = {
        id: 'trans-123',
        reference: 'REF-123',
        status: TransactionStatus.APPROVED,
        amount: 100.0,
        paymentMethod: 'CARD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: null, // No user/email
        },
      } as Transaction;

      transactionRepository.findByCustomerId.mockResolvedValue([
        mockTransaction,
      ]);
      transactionItemRepository.findByTransactionId.mockResolvedValue([]);
      deliveryRepository.findByTransactionId.mockResolvedValue(null);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toHaveLength(1);
      }
      // Should not call findByCustomerEmail since there's no email
      expect(transactionRepository.findByCustomerEmail).not.toHaveBeenCalled();
    });

    it('should handle items without product imageUrl', async () => {
      const mockTransaction = {
        id: 'trans-123',
        reference: 'REF-123',
        status: TransactionStatus.APPROVED,
        amount: 100.0,
        paymentMethod: 'CARD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        customerId: 'customer-123',
        customer: {
          user: {
            email: 'test@example.com',
          },
        },
      } as Transaction;

      const mockItems = [
        {
          productId: 'prod-1',
          productName: 'Product 1',
          quantity: 1,
          unitPrice: 100.0,
          subtotal: 100.0,
          product: null, // No product relation
        },
      ] as TransactionItem[];

      transactionRepository.findByCustomerId.mockResolvedValue([
        mockTransaction,
      ]);
      transactionRepository.findByCustomerEmail.mockResolvedValue([]);
      transactionItemRepository.findByTransactionId.mockResolvedValue(
        mockItems,
      );
      deliveryRepository.findByTransactionId.mockResolvedValue(null);

      const result = await useCase.execute('customer-123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value[0].items![0].imageUrl).toBeUndefined();
      }
    });
  });
});
