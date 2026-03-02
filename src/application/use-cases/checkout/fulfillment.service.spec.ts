import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { FulfillmentService, FulfillmentError } from './fulfillment.service';
import type {
  IProductRepository,
  IDeliveryRepository,
  ITransactionItemRepository,
  IAuditLogRepository,
  ITransactionRepository,
} from '@application/ports/out';
import { Transaction } from '@infrastructure/adapters/database/typeorm/entities';
import { TransactionStatus } from '@domain/enums';
import { AUDIT_ACTIONS } from '@infrastructure/adapters/web/constants';

describe('FulfillmentService', () => {
  let service: FulfillmentService;
  let productRepository: jest.Mocked<IProductRepository>;
  let deliveryRepository: jest.Mocked<IDeliveryRepository>;
  let transactionItemRepository: jest.Mocked<ITransactionItemRepository>;
  let auditLogRepository: jest.Mocked<IAuditLogRepository>;
  let transactionRepository: jest.Mocked<ITransactionRepository>;

  const mockTransaction: Partial<Transaction> = {
    id: 'trans-123',
    customerId: 'customer-123',
    amount: 100.0,
    status: TransactionStatus.APPROVED,
    wompiTransactionId: 'wompi-123',
    customer: {
      id: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+573001234567',
      address: '123 Main St',
    } as Partial<Transaction['customer']>,
  };

  beforeEach(async () => {
    productRepository = {
      updateStock: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    deliveryRepository = {
      create: jest.fn(),
    } as jest.Mocked<IDeliveryRepository>;

    transactionItemRepository = {
      findByTransactionId: jest.fn(),
    } as jest.Mocked<ITransactionItemRepository>;

    auditLogRepository = {
      create: jest.fn(),
    } as jest.Mocked<IAuditLogRepository>;
    transactionRepository = {
      findByWompiTransactionId: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<ITransactionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillmentService,
        {
          provide: 'IProductRepository',
          useValue: productRepository,
        },
        {
          provide: 'IDeliveryRepository',
          useValue: deliveryRepository,
        },
        {
          provide: 'ITransactionItemRepository',
          useValue: transactionItemRepository,
        },
        {
          provide: 'IAuditLogRepository',
          useValue: auditLogRepository,
        },
        {
          provide: 'ITransactionRepository',
          useValue: transactionRepository,
        },
      ],
    }).compile();

    service = module.get<FulfillmentService>(FulfillmentService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processApprovedTransaction', () => {
    const mockItems = [
      {
        id: 'item-1',
        transactionId: 'trans-123',
        productId: 'prod-1',
        productName: 'Product 1',
        quantity: 2,
        unitPrice: 30.0,
        subtotal: 60.0,
      },
      {
        id: 'item-2',
        transactionId: 'trans-123',
        productId: 'prod-2',
        productName: 'Product 2',
        quantity: 1,
        unitPrice: 40.0,
        subtotal: 40.0,
      },
    ];

    const mockDelivery = {
      id: 'delivery-123',
      transactionId: 'trans-123',
      customerId: 'customer-123',
      status: 'PENDING',
      address: '123 Main St',
      city: 'Bogotá',
      postalCode: '110111',
      recipientName: 'John Doe',
      recipientPhone: '+573001234567',
    };

    it('should process approved transaction successfully', async () => {
      transactionItemRepository.findByTransactionId.mockResolvedValue(
        mockItems,
      );
      deliveryRepository.create.mockResolvedValue(
        mockDelivery as Partial<typeof mockDelivery>,
      );

      const result = await service.processApprovedTransaction(
        mockTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.deliveryId).toBe('delivery-123');
        expect(result.value.stockReduced).toBe(true);
        expect(result.value.deliveryCreated).toBe(true);
      }

      // Verify stock was reduced for each item
      expect(productRepository.updateStock).toHaveBeenCalledTimes(2);
      expect(productRepository.updateStock).toHaveBeenCalledWith('prod-1', 2);
      expect(productRepository.updateStock).toHaveBeenCalledWith('prod-2', 1);

      // Verify delivery was created
      expect(deliveryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'trans-123',
          customerId: 'customer-123',
          status: 'PENDING',
        }),
      );

      // Verify audit logs were created
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.FULFILLMENT_APPROVED_START,
        }),
      );
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.FULFILLMENT_STOCK_REDUCED,
        }),
      );
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.FULFILLMENT_DELIVERY_CREATED,
        }),
      );
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.FULFILLMENT_APPROVED_SUCCESS,
        }),
      );
    });

    it('should use provided shipping address', async () => {
      transactionItemRepository.findByTransactionId.mockResolvedValue(
        mockItems,
      );
      deliveryRepository.create.mockResolvedValue(
        mockDelivery as Partial<typeof mockDelivery>,
      );

      const customAddress = {
        addressLine1: '456 Custom St',
        city: 'Medellín',
        postalCode: '050001',
        recipientName: 'Jane Doe',
        recipientPhone: '+573009876543',
      };

      await service.processApprovedTransaction(
        mockTransaction as Transaction,
        customAddress,
      );

      expect(deliveryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '456 Custom St',
          city: 'Medellín',
          postalCode: '050001',
          recipientName: 'Jane Doe',
          recipientPhone: '+573009876543',
        }),
      );
    });

    it('should return error if no transaction items found', async () => {
      transactionItemRepository.findByTransactionId.mockResolvedValue([]);

      const result = await service.processApprovedTransaction(
        mockTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(FulfillmentError);
        expect(result.error.code).toBe('FULFILLMENT_PROCESSING_ERROR');
      }

      // Verify failure was logged
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.FULFILLMENT_APPROVED_FAILED,
        }),
      );
    });

    it('should return error and log failure if stock update fails', async () => {
      transactionItemRepository.findByTransactionId.mockResolvedValue(
        mockItems,
      );
      productRepository.updateStock.mockRejectedValue(
        new Error('Insufficient stock'),
      );

      const result = await service.processApprovedTransaction(
        mockTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(FulfillmentError);
        expect(result.error.message).toContain('Insufficient stock');
      }

      // Verify failure was logged
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.FULFILLMENT_APPROVED_FAILED,
        }),
      );
    });
  });

  describe('processDeclinedTransaction', () => {
    it('should process declined transaction successfully', async () => {
      const declinedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.DECLINED,
        errorMessage: 'Insufficient funds',
        errorCode: 'DECLINED_BY_BANK',
      };

      const result = await service.processDeclinedTransaction(
        declinedTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(true);

      // Verify audit log was created with decline reason
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'SYSTEM',
          roleName: 'SYSTEM',
          action: AUDIT_ACTIONS.FULFILLMENT_DECLINED_PROCESSED,
          metadata: expect.objectContaining({
            transactionId: 'trans-123',
            customerId: 'customer-123',
            amount: 100.0,
            declineReason: 'Insufficient funds',
            errorCode: 'DECLINED_BY_BANK',
          }),
        }),
      );
    });

    it('should handle declined transaction without error message', async () => {
      const declinedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.DECLINED,
      };

      const result = await service.processDeclinedTransaction(
        declinedTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(true);

      // Verify audit log was created with default reason
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            declineReason: 'Unknown reason',
          }),
        }),
      );
    });

    it('should return error if audit log creation fails', async () => {
      auditLogRepository.create.mockRejectedValue(new Error('DB error'));

      const result = await service.processDeclinedTransaction(
        mockTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(FulfillmentError);
        expect(result.error.code).toBe('DECLINED_PROCESSING_ERROR');
      }
    });
  });

  describe('processErrorTransaction', () => {
    it('should process error transaction successfully', async () => {
      const errorTransaction = {
        ...mockTransaction,
        status: TransactionStatus.ERROR,
        errorMessage: 'Gateway timeout',
        errorCode: 'GATEWAY_ERROR',
      };

      const result = await service.processErrorTransaction(
        errorTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(true);

      // Verify audit log was created with error details
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'SYSTEM',
          roleName: 'SYSTEM',
          action: AUDIT_ACTIONS.FULFILLMENT_ERROR_LOGGED,
          metadata: expect.objectContaining({
            transactionId: 'trans-123',
            customerId: 'customer-123',
            amount: 100.0,
            errorMessage: 'Gateway timeout',
            errorCode: 'GATEWAY_ERROR',
            wompiTransactionId: 'wompi-123',
          }),
        }),
      );
    });

    it('should handle error transaction without error message', async () => {
      const errorTransaction = {
        ...mockTransaction,
        status: TransactionStatus.ERROR,
      };

      const result = await service.processErrorTransaction(
        errorTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(true);

      // Verify audit log was created with default error
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            errorMessage: 'Unknown error',
          }),
        }),
      );
    });

    it('should return error if audit log creation fails', async () => {
      auditLogRepository.create.mockRejectedValue(new Error('DB error'));

      const result = await service.processErrorTransaction(
        mockTransaction as Transaction,
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(FulfillmentError);
        expect(result.error.code).toBe('ERROR_PROCESSING_ERROR');
      }
    });
  });
});
