import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TypeOrmTransactionRepository } from './transaction.repository';
import { Transaction } from '../entities';
import { TransactionStatus } from '@domain/enums';

describe('TypeOrmTransactionRepository', () => {
  let repository: TypeOrmTransactionRepository;
  let mockRepository: jest.Mocked<Repository<Transaction>>;

  const mockTransaction = {
    id: 'transaction-123',
    reference: 'REF-123',
    customerId: 'customer-123',
    totalAmount: 100000,
    status: TransactionStatus.PENDING,
    wompiTransactionId: 'wompi-123',
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-123',
      userId: 'user-123',
      fullName: 'Test User',
      phone: '+573001234567',
      address: '123 Test St',
    },
  } as Transaction;

  beforeEach(async () => {
    const mockRepositoryMethods = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmTransactionRepository,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepositoryMethods,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmTransactionRepository>(
      TypeOrmTransactionRepository,
    );
    mockRepository = module.get(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new transaction', async () => {
      const transactionData: Partial<Transaction> = {
        reference: 'REF-123',
        customerId: 'customer-123',
        totalAmount: 100000,
        status: TransactionStatus.PENDING,
      };

      mockRepository.create.mockReturnValue(mockTransaction);
      mockRepository.save.mockResolvedValue(mockTransaction);

      const result = await repository.create(transactionData);

      expect(mockRepository.create).toHaveBeenCalledWith(transactionData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockTransaction);
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findById', () => {
    it('should find a transaction by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await repository.findById('transaction-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-123' },
        relations: ['customer'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByReference', () => {
    it('should find a transaction by reference', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await repository.findByReference('REF-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { reference: 'REF-123' },
        relations: ['customer'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByReference('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findByWompiTransactionId', () => {
    it('should find a transaction by Wompi transaction id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await repository.findByWompiTransactionId('wompi-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { wompiTransactionId: 'wompi-123' },
        relations: ['customer'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByWompiTransactionId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      await repository.updateStatus(
        'transaction-123',
        TransactionStatus.APPROVED,
        'wompi-456',
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'transaction-123' },
        {
          status: TransactionStatus.APPROVED,
          wompiTransactionId: 'wompi-456',
          errorCode: undefined,
          errorMessage: undefined,
        },
      );
    });

    it('should update status with error details', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      await repository.updateStatus(
        'transaction-123',
        TransactionStatus.ERROR,
        undefined,
        'ERR_001',
        'Payment failed',
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'transaction-123' },
        {
          status: TransactionStatus.ERROR,
          wompiTransactionId: undefined,
          errorCode: 'ERR_001',
          errorMessage: 'Payment failed',
        },
      );
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const updateData: Partial<Transaction> = {
        status: TransactionStatus.APPROVED,
        wompiTransactionId: 'wompi-789',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      await repository.update('transaction-123', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'transaction-123' },
        updateData,
      );
    });
  });

  describe('findByCustomerId', () => {
    it('should find all transactions by customer id', async () => {
      const transactions = [
        mockTransaction,
        { ...mockTransaction, id: 'transaction-456' },
      ];
      mockRepository.find.mockResolvedValue(transactions);

      const result = await repository.findByCustomerId('customer-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        relations: ['customer'],
        order: {
          createdAt: 'DESC',
        },
      });
      expect(result).toEqual(transactions);
    });

    it('should return empty array if no transactions found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findByCustomerId('customer-123');

      expect(result).toEqual([]);
    });
  });

  describe('findPending', () => {
    it('should find all pending transactions', async () => {
      const pendingTransactions = [
        mockTransaction,
        { ...mockTransaction, id: 'transaction-456' },
      ];
      mockRepository.find.mockResolvedValue(pendingTransactions);

      const result = await repository.findPending();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: TransactionStatus.PENDING },
        relations: ['customer'],
        order: {
          createdAt: 'ASC',
        },
      });
      expect(result).toEqual(pendingTransactions);
    });

    it('should return empty array if no pending transactions', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findPending();

      expect(result).toEqual([]);
    });
  });
});
