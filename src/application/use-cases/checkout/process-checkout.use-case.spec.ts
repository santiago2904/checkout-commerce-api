/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  ProcessCheckoutUseCase,
  CheckoutError,
  InsufficientStockError,
  ProductNotFoundError,
} from './process-checkout.use-case';
import {
  IProductRepository,
  ITransactionRepository,
  ITransactionItemRepository,
  IDeliveryRepository,
  IPaymentGateway,
} from '@application/ports/out';
import { CheckoutRequestDto } from '@application/dtos/checkout';
import { PaymentMethodType } from '@application/dtos/checkout/checkout.dto';
import { ok, err } from '@application/utils';
import { TransactionStatus } from '@domain/enums';
import {
  Product,
  Transaction,
} from '@infrastructure/adapters/database/typeorm/entities';

describe('ProcessCheckoutUseCase', () => {
  let useCase: ProcessCheckoutUseCase;
  let productRepository: jest.Mocked<IProductRepository>;
  let transactionRepository: jest.Mocked<ITransactionRepository>;
  let transactionItemRepository: jest.Mocked<ITransactionItemRepository>;
  let deliveryRepository: jest.Mocked<IDeliveryRepository>;
  let paymentGateway: jest.Mocked<IPaymentGateway>;

  const mockProduct = {
    id: 'product-id-1',
    name: 'Test Product',
    price: 10000,
    stock: 50,
  } as Product;

  const mockTransaction = {
    id: 'transaction-id',
    reference: 'REF-001',
    amount: 20000,
    status: TransactionStatus.PENDING,
    customerId: 'customer-id',
    customerEmail: 'test@example.com',
  } as Transaction;

  const mockCheckoutRequest: CheckoutRequestDto = {
    items: [
      {
        productId: 'product-id-1',
        quantity: 2,
      },
    ],
    paymentMethod: {
      type: PaymentMethodType.CARD,
      token: 'tok_test_12345',
      installments: 1,
    },
    shippingAddress: {
      addressLine1: '123 Main St',
      city: 'Bogotá',
      region: 'Cundinamarca',
      country: 'CO',
      postalCode: '110111',
      recipientName: 'John Doe',
      recipientPhone: '+573001234567',
    },
  };

  beforeEach(async () => {
    // Create mock implementations
    const mockProductRepo = {
      findById: jest.fn(),
      hasStock: jest.fn(),
      updateStock: jest.fn(),
      findAllWithStock: jest.fn(),
    };

    const mockTransactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
      updateStatus: jest.fn(),
      findByCustomerId: jest.fn(),
      findPending: jest.fn(),
    };

    const mockTransactionItemRepo = {
      createMany: jest.fn(),
      findByTransactionId: jest.fn(),
      findById: jest.fn(),
    };

    const mockDeliveryRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTransactionId: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockPaymentGateway = {
      processPayment: jest.fn(),
      getTransactionStatus: jest.fn(),
      getName: jest.fn().mockReturnValue('Wompi'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessCheckoutUseCase,
        {
          provide: 'IProductRepository',
          useValue: mockProductRepo,
        },
        {
          provide: 'ITransactionRepository',
          useValue: mockTransactionRepo,
        },
        {
          provide: 'ITransactionItemRepository',
          useValue: mockTransactionItemRepo,
        },
        {
          provide: 'IDeliveryRepository',
          useValue: mockDeliveryRepo,
        },
        {
          provide: 'IPaymentGateway',
          useValue: mockPaymentGateway,
        },
      ],
    }).compile();

    useCase = module.get<ProcessCheckoutUseCase>(ProcessCheckoutUseCase);
    productRepository = module.get('IProductRepository');
    transactionRepository = module.get('ITransactionRepository');
    transactionItemRepository = module.get('ITransactionItemRepository');
    deliveryRepository = module.get('IDeliveryRepository');
    paymentGateway = module.get('IPaymentGateway');

    // Suppress logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Set up default mock behavior for transactionItemRepository
    transactionItemRepository.createMany.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - Happy Path', () => {
    it('should successfully initiate checkout with pending payment (async Wompi)', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.hasStock.mockResolvedValue(true);
      transactionRepository.create.mockResolvedValue(mockTransaction);
      transactionRepository.updateStatus.mockResolvedValue(undefined);

      // Wompi ALWAYS returns PENDING initially (async payments)
      paymentGateway.processPayment.mockResolvedValue(
        ok({
          status: 'PENDING',
          transactionId: 'wompi-txn-123',
          reference: 'REF-001',
          paymentMethod: 'CARD',
        }),
      );

      // Act
      const result = await useCase.execute(
        mockCheckoutRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert - Wompi is async, so we get PENDING status
      expect(result.isOk()).toBe(true);
      expect(result.value).toMatchObject({
        transactionId: 'transaction-id',
        status: 'PENDING', // NOT 'APPROVED' - Wompi is async!
        amount: 20000,
        currency: 'COP',
        wompiTransactionId: 'wompi-txn-123',
      });

      // Stock reduction and delivery creation DON'T happen until APPROVED
      // (happens via polling endpoint when status becomes APPROVED)
      expect(result.value.deliveryId).toBeUndefined();

      // Verify correct repository calls
      expect(productRepository.findById).toHaveBeenCalledWith('product-id-1');
      expect(productRepository.hasStock).toHaveBeenCalledWith(
        'product-id-1',
        2,
      );
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(paymentGateway.processPayment).toHaveBeenCalled();

      // Stock and delivery are NOT updated immediately (async flow)
      expect(productRepository.updateStock).not.toHaveBeenCalled();
      expect(deliveryRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('execute - Product Validation Errors', () => {
    it('should return error when product is not found', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(
        mockCheckoutRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(ProductNotFoundError);
      expect(result.error.code).toBe('PRODUCT_NOT_FOUND');
      expect(transactionRepository.create).not.toHaveBeenCalled();
      expect(paymentGateway.processPayment).not.toHaveBeenCalled();
    });

    it('should return error when product has insufficient stock', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.hasStock.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(
        mockCheckoutRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(InsufficientStockError);
      expect(result.error.code).toBe('INSUFFICIENT_STOCK');
      expect(transactionRepository.create).not.toHaveBeenCalled();
      expect(paymentGateway.processPayment).not.toHaveBeenCalled();
    });
  });

  describe('execute - Payment Errors', () => {
    it('should handle declined payment and update transaction', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.hasStock.mockResolvedValue(true);
      transactionRepository.create.mockResolvedValue(mockTransaction);
      transactionRepository.updateStatus.mockResolvedValue(undefined);

      paymentGateway.processPayment.mockResolvedValue(
        err({
          code: 'PAYMENT_DECLINED',
          message: 'Card was declined',
        } as any),
      );

      // Act
      const result = await useCase.execute(
        mockCheckoutRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(CheckoutError);
      expect(result.error.code).toBe('PAYMENT_DECLINED');
      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
        'transaction-id',
        TransactionStatus.ERROR,
        undefined,
        undefined,
        'PAYMENT_DECLINED',
        'Card was declined',
      );
      expect(productRepository.updateStock).not.toHaveBeenCalled();
      expect(deliveryRepository.create).not.toHaveBeenCalled();
    });

    it('should handle payment gateway error', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.hasStock.mockResolvedValue(true);
      transactionRepository.create.mockResolvedValue(mockTransaction);
      transactionRepository.updateStatus.mockResolvedValue(undefined);

      paymentGateway.processPayment.mockResolvedValue(
        err({
          code: 'GATEWAY_ERROR',
          message: 'Gateway connection failed',
        } as any),
      );

      // Act
      const result = await useCase.execute(
        mockCheckoutRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('GATEWAY_ERROR');
      expect(productRepository.updateStock).not.toHaveBeenCalled();
    });
  });

  describe('execute - Pending Payment', () => {
    it('should handle pending payment without creating delivery', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.hasStock.mockResolvedValue(true);
      transactionRepository.create.mockResolvedValue(mockTransaction);
      transactionRepository.updateStatus.mockResolvedValue(undefined);

      paymentGateway.processPayment.mockResolvedValue(
        ok({
          status: 'PENDING',
          transactionId: 'wompi-txn-123',
          reference: 'REF-001',
          amount: 20000,
          currency: 'COP',
          paymentMethod: 'PSE',
        }),
      );

      // Act
      const result = await useCase.execute(
        mockCheckoutRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value.status).toBe('PENDING');
      expect(result.value.deliveryId).toBeUndefined();
      expect(productRepository.updateStock).not.toHaveBeenCalled();
      expect(deliveryRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('execute - Multiple Products', () => {
    it('should handle checkout with multiple products', async () => {
      // Arrange
      const mockProduct2 = { ...mockProduct, id: 'product-id-2', price: 15000 };
      const multiItemRequest: CheckoutRequestDto = {
        ...mockCheckoutRequest,
        items: [
          { productId: 'product-id-1', quantity: 2 },
          { productId: 'product-id-2', quantity: 1 },
        ],
      };

      productRepository.findById
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockProduct2);
      productRepository.hasStock.mockResolvedValue(true);
      transactionRepository.create.mockResolvedValue({
        ...mockTransaction,
        amount: 35000, // 2 * 10000 + 1 * 15000
      });
      transactionRepository.updateStatus.mockResolvedValue(undefined);
      productRepository.updateStock.mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      deliveryRepository.create.mockResolvedValue({ id: 'delivery-id' } as any);

      paymentGateway.processPayment.mockResolvedValue(
        ok({
          status: 'PENDING',
          transactionId: 'wompi-txn-123',
          reference: 'REF-001',
          amount: 35000,
          currency: 'COP',
          paymentMethod: 'CARD',
        }),
      );

      // Act
      const result = await useCase.execute(
        multiItemRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value.status).toBe('PENDING');
      expect(result.value.amount).toBe(35000);
      expect(result.value.wompiTransactionId).toBe('wompi-txn-123');
      expect(result.value.deliveryId).toBeUndefined();
      expect(productRepository.updateStock).not.toHaveBeenCalled();
      expect(deliveryRepository.create).not.toHaveBeenCalled();
    });

    it('should fail if any product in multi-item checkout has insufficient stock', async () => {
      // Arrange
      const mockProduct2 = { ...mockProduct, id: 'product-id-2' };
      const multiItemRequest: CheckoutRequestDto = {
        ...mockCheckoutRequest,
        items: [
          { productId: 'product-id-1', quantity: 2 },
          { productId: 'product-id-2', quantity: 1 },
        ],
      };

      productRepository.findById
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockProduct2);
      productRepository.hasStock
        .mockResolvedValueOnce(true) // First product OK
        .mockResolvedValueOnce(false); // Second product out of stock

      // Act
      const result = await useCase.execute(
        multiItemRequest,
        'customer-id',
        'test@example.com',
        '192.168.1.1',
      );

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(InsufficientStockError);
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });
  });
});
