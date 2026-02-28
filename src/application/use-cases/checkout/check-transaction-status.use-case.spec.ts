/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  CheckTransactionStatusUseCase,
  CheckTransactionStatusError,
} from './check-transaction-status.use-case';
import { FulfillmentService } from './fulfillment.service';
import type {
  ITransactionRepository,
  IPaymentGateway,
  PaymentResult,
} from '@application/ports/out';
import { Result } from '@application/utils';
import { TransactionStatus } from '@domain/enums';
import type { Transaction } from '@infrastructure/adapters/database/typeorm/entities';

describe('CheckTransactionStatusUseCase', () => {
  let useCase: CheckTransactionStatusUseCase;

  const mockTransaction: Partial<Transaction> = {
    id: 'tx-123',
    reference: 'REF-123',
    wompiTransactionId: 'wompi-tx-456',
    status: TransactionStatus.PENDING,
    amount: 100000,
    paymentMethod: 'PSE',
  };

  const mockPendingPaymentResult: PaymentResult = {
    transactionId: 'wompi-tx-456',
    status: 'PENDING',
    reference: 'REF-123',
    amount: 100000,
    currency: 'COP',
    paymentMethod: 'PSE',
  };

  const mockApprovedPaymentResult: PaymentResult = {
    transactionId: 'wompi-tx-456',
    status: 'APPROVED',
    reference: 'REF-123',
    amount: 100000,
    currency: 'COP',
    paymentMethod: 'PSE',
  };

  const mockDeclinedPaymentResult: PaymentResult = {
    transactionId: 'wompi-tx-456',
    status: 'DECLINED',
    reference: 'REF-123',
    amount: 100000,
    currency: 'COP',
    paymentMethod: 'PSE',
    errorCode: 'DECLINED',
    errorMessage: 'Payment declined by bank',
  };

  const mockErrorPaymentResult: PaymentResult = {
    transactionId: 'wompi-tx-456',
    status: 'ERROR',
    reference: 'REF-123',
    amount: 100000,
    currency: 'COP',
    paymentMethod: 'PSE',
    errorCode: 'GATEWAY_ERROR',
    errorMessage: 'Gateway error occurred',
  };

  const mockTransactionRepository: jest.Mocked<ITransactionRepository> = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  } as any;

  const mockPaymentGateway: jest.Mocked<IPaymentGateway> = {
    getTransactionStatus: jest.fn(),
  } as any;

  const mockFulfillmentService: jest.Mocked<FulfillmentService> = {
    processApprovedTransaction: jest.fn(),
    processDeclinedTransaction: jest.fn(),
    processErrorTransaction: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckTransactionStatusUseCase,
        {
          provide: 'ITransactionRepository',
          useValue: mockTransactionRepository,
        },
        {
          provide: 'IPaymentGateway',
          useValue: mockPaymentGateway,
        },
        {
          provide: FulfillmentService,
          useValue: mockFulfillmentService,
        },
      ],
    }).compile();

    useCase = module.get<CheckTransactionStatusUseCase>(
      CheckTransactionStatusUseCase,
    );

    // Mock logger to prevent console spam
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return error when transaction not found', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute('non-existent-id');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(CheckTransactionStatusError);
        expect(result.error.code).toBe('TRANSACTION_NOT_FOUND');
        expect(result.error.message).toContain('non-existent-id');
      }
    });

    it('should return error when transaction has no wompiTransactionId', async () => {
      const txWithoutWompiId = { ...mockTransaction, wompiTransactionId: null };
      mockTransactionRepository.findById.mockResolvedValue(
        txWithoutWompiId as Transaction,
      );

      const result = await useCase.execute('tx-123');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(CheckTransactionStatusError);
        expect(result.error.code).toBe('NO_WOMPI_ID');
        expect(result.error.message).toContain('Wompi transaction ID');
      }
    });

    it('should return error when payment gateway fails', async () => {
      mockTransactionRepository.findById.mockResolvedValue(
        mockTransaction as Transaction,
      );
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.fail({ message: 'Gateway timeout', code: 'TIMEOUT' }),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(CheckTransactionStatusError);
        expect(result.error.code).toBe('TIMEOUT');
        expect(result.error.message).toContain('Gateway timeout');
      }
    });

    it('should return current status when no status change', async () => {
      mockTransactionRepository.findById.mockResolvedValue(
        mockTransaction as Transaction,
      );
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(mockPendingPaymentResult),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.transactionId).toBe('tx-123');
        expect(result.value.wompiTransactionId).toBe('wompi-tx-456');
        expect(result.value.status).toBe('PENDING');
        expect(result.value.amount).toBe(100000);
        expect(result.value.reference).toBe('REF-123');
        expect(result.value.paymentMethod).toBe('PSE');
      }
      // Should NOT call updateStatus if status hasn't changed
      expect(mockTransactionRepository.updateStatus).not.toHaveBeenCalled();
      expect(
        mockFulfillmentService.processApprovedTransaction,
      ).not.toHaveBeenCalled();
    });

    it('should update status and process fulfillment when APPROVED', async () => {
      const updatedTx = {
        ...mockTransaction,
        status: TransactionStatus.APPROVED,
      };
      mockTransactionRepository.findById
        .mockResolvedValueOnce(mockTransaction as Transaction)
        .mockResolvedValueOnce(updatedTx as Transaction);
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(mockApprovedPaymentResult),
      );
      mockFulfillmentService.processApprovedTransaction.mockResolvedValue(
        Result.ok({ deliveryId: 'delivery-123' }),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('APPROVED');
      }
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        'tx-123',
        TransactionStatus.APPROVED,
        'wompi-tx-456',
        undefined,
        undefined,
      );
      expect(mockTransactionRepository.findById).toHaveBeenCalledTimes(2); // Initial + after update
      expect(
        mockFulfillmentService.processApprovedTransaction,
      ).toHaveBeenCalledWith(updatedTx);
    });

    it('should update status and process DECLINED transaction', async () => {
      const updatedTx = {
        ...mockTransaction,
        status: TransactionStatus.DECLINED,
      };
      mockTransactionRepository.findById
        .mockResolvedValueOnce(mockTransaction as Transaction)
        .mockResolvedValueOnce(updatedTx as Transaction);
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(mockDeclinedPaymentResult),
      );
      mockFulfillmentService.processDeclinedTransaction.mockResolvedValue(
        Result.ok(null),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('DECLINED');
        expect(result.value.errorCode).toBe('DECLINED');
        expect(result.value.errorMessage).toBe('Payment declined by bank');
      }
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        'tx-123',
        TransactionStatus.DECLINED,
        'wompi-tx-456',
        'DECLINED',
        'Payment declined by bank',
      );
      expect(
        mockFulfillmentService.processDeclinedTransaction,
      ).toHaveBeenCalledWith(updatedTx);
    });

    it('should update status and process ERROR transaction', async () => {
      const updatedTx = {
        ...mockTransaction,
        status: TransactionStatus.ERROR,
      };
      mockTransactionRepository.findById
        .mockResolvedValueOnce(mockTransaction as Transaction)
        .mockResolvedValueOnce(updatedTx as Transaction);
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(mockErrorPaymentResult),
      );
      mockFulfillmentService.processErrorTransaction.mockResolvedValue(
        Result.ok(null),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('ERROR');
        expect(result.value.errorCode).toBe('GATEWAY_ERROR');
        expect(result.value.errorMessage).toBe('Gateway error occurred');
      }
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        'tx-123',
        TransactionStatus.ERROR,
        'wompi-tx-456',
        'GATEWAY_ERROR',
        'Gateway error occurred',
      );
      expect(
        mockFulfillmentService.processErrorTransaction,
      ).toHaveBeenCalledWith(updatedTx);
    });

    it('should handle fulfillment failure gracefully', async () => {
      const updatedTx = {
        ...mockTransaction,
        status: TransactionStatus.APPROVED,
      };
      mockTransactionRepository.findById
        .mockResolvedValueOnce(mockTransaction as Transaction)
        .mockResolvedValueOnce(updatedTx as Transaction);
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(mockApprovedPaymentResult),
      );
      mockFulfillmentService.processApprovedTransaction.mockResolvedValue(
        Result.fail(new Error('Stock update failed')),
      );

      const result = await useCase.execute('tx-123');

      // Transaction status should still be APPROVED even if fulfillment fails
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('APPROVED');
      }
      expect(
        mockFulfillmentService.processApprovedTransaction,
      ).toHaveBeenCalled();
    });

    it('should handle missing transaction after update', async () => {
      mockTransactionRepository.findById
        .mockResolvedValueOnce(mockTransaction as Transaction)
        .mockResolvedValueOnce(null); // Transaction not found after update
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(mockApprovedPaymentResult),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('APPROVED');
      }
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalled();
      // Fulfillment should NOT be called if transaction not found after update
      expect(
        mockFulfillmentService.processApprovedTransaction,
      ).not.toHaveBeenCalled();
    });

    it('should include payment details in response', async () => {
      const paymentResultWithDetails: PaymentResult = {
        ...mockPendingPaymentResult,
        redirectUrl: 'https://wompi.co/redirect/123',
        statusMessage: 'Waiting for payment confirmation',
        merchant: {
          merchantId: 'merchant-789',
          merchantName: 'Test Merchant',
        },
      };
      mockTransactionRepository.findById.mockResolvedValue(
        mockTransaction as Transaction,
      );
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(paymentResultWithDetails),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.redirectUrl).toBe('https://wompi.co/redirect/123');
        expect(result.value.statusMessage).toBe(
          'Waiting for payment confirmation',
        );
        expect(result.value.merchant).toEqual({
          merchantId: 'merchant-789',
          merchantName: 'Test Merchant',
        });
      }
    });

    it('should not trigger fulfillment if status was already APPROVED', async () => {
      const alreadyApprovedTx = {
        ...mockTransaction,
        status: TransactionStatus.APPROVED,
      };
      mockTransactionRepository.findById.mockResolvedValue(
        alreadyApprovedTx as Transaction,
      );
      mockPaymentGateway.getTransactionStatus.mockResolvedValue(
        Result.ok(mockApprovedPaymentResult),
      );

      const result = await useCase.execute('tx-123');

      expect(result.isOk()).toBe(true);
      // Should NOT call updateStatus if status is the same
      expect(mockTransactionRepository.updateStatus).not.toHaveBeenCalled();
      // Should NOT call fulfillment if status was already APPROVED
      expect(
        mockFulfillmentService.processApprovedTransaction,
      ).not.toHaveBeenCalled();
    });
  });
});
