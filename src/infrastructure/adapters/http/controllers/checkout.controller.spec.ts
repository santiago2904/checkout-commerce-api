/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import {
  ProcessCheckoutUseCase,
  CheckTransactionStatusUseCase,
} from '@application/use-cases/checkout';
import {
  CheckoutError,
  InsufficientStockError,
  ProductNotFoundError,
} from '@application/use-cases/checkout/process-checkout.use-case';
import { I18nService } from '@infrastructure/config/i18n';
import { Result } from '@application/utils';
import type { CheckoutResponseDto } from '@application/dtos/checkout';
import type { TransactionStatusResponse } from '@application/use-cases/checkout/check-transaction-status.use-case';
import { TransactionStatus } from '@domain/enums';
import { AuditInterceptor } from '@infrastructure/adapters/web/interceptors/audit.interceptor';

describe('CheckoutController', () => {
  let controller: CheckoutController;
  let processCheckoutUseCase: jest.Mocked<ProcessCheckoutUseCase>;
  let checkTransactionStatusUseCase: jest.Mocked<CheckTransactionStatusUseCase>;
  let i18nService: jest.Mocked<I18nService>;

  const mockProcessCheckoutUseCase = {
    execute: jest.fn(),
  };

  const mockCheckTransactionStatusUseCase = {
    execute: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key), // Just return the key for testing
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      email: 'test@example.com',
      roleId: 'role-123',
      roleName: 'CUSTOMER',
      customer: {
        id: 'customer-123',
      },
    },
    ip: '192.168.1.1',
    headers: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        {
          provide: ProcessCheckoutUseCase,
          useValue: mockProcessCheckoutUseCase,
        },
        {
          provide: CheckTransactionStatusUseCase,
          useValue: mockCheckTransactionStatusUseCase,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    })
      .overrideInterceptor(AuditInterceptor)
      .useValue({
        intercept: (context: ExecutionContext, next: CallHandler) =>
          next.handle(),
      })
      .compile();

    controller = module.get<CheckoutController>(CheckoutController);
    processCheckoutUseCase = module.get(ProcessCheckoutUseCase);
    checkTransactionStatusUseCase = module.get(CheckTransactionStatusUseCase);
    i18nService = module.get(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    const checkoutDto = {
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          priceAtPurchase: 50000,
        },
      ],
      paymentMethodType: 'CARD' as const,
      cardToken: 'card-token-123',
      customerEmail: 'test@example.com',
    };

    const mockCheckoutResponse: CheckoutResponseDto = {
      transactionId: 'transaction-123',
      status: TransactionStatus.PENDING,
      paymentUrl: 'https://checkout.wompi.co/l/test',
      totalAmount: 100000,
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          priceAtPurchase: 50000,
          productName: 'Test Product',
          total: 100000,
        },
      ],
    };

    it('should process checkout successfully', async () => {
      const successResult = Result.ok<CheckoutResponseDto, Error>(
        mockCheckoutResponse,
      );
      mockProcessCheckoutUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.checkout(
        checkoutDto,
        mockRequest as any,
        'es',
      );

      expect(result).toEqual({
        statusCode: 201,
        message: 'checkout.success',
        data: mockCheckoutResponse,
      });
      expect(processCheckoutUseCase.execute).toHaveBeenCalledWith(
        checkoutDto,
        'customer-123',
        'test@example.com',
        '192.168.1.1',
      );
    });

    it('should throw BadRequestException if customer ID not found', async () => {
      const requestWithoutCustomer = {
        ...mockRequest,
        user: {
          ...mockRequest.user,
          customer: undefined,
        },
      };

      await expect(
        controller.checkout(checkoutDto, requestWithoutCustomer as any, 'es'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.customerNotFound',
        'es',
      );
    });

    it('should throw BadRequestException for InsufficientStockError', async () => {
      const errorResult = Result.fail<CheckoutResponseDto, Error>(
        new InsufficientStockError('product-1', 10, 5),
      );
      mockProcessCheckoutUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.checkout(checkoutDto, mockRequest as any, 'es'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.insufficientStock',
        'es',
      );
    });

    it('should throw BadRequestException for ProductNotFoundError', async () => {
      const errorResult = Result.fail<CheckoutResponseDto, Error>(
        new ProductNotFoundError('product-1'),
      );
      mockProcessCheckoutUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.checkout(checkoutDto, mockRequest as any, 'es'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.productNotFound',
        'es',
      );
    });

    it('should throw BadRequestException for CheckoutError with code', async () => {
      const checkoutError = new CheckoutError(
        'Payment failed',
        'PAYMENT_ERROR',
      );
      const errorResult = Result.fail<CheckoutResponseDto, Error>(
        checkoutError,
      );
      mockProcessCheckoutUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.checkout(checkoutDto, mockRequest as any, 'es'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.failed',
        'es',
      );
    });

    it('should throw BadRequestException for CheckoutError without code', async () => {
      const checkoutError = new CheckoutError('Payment failed');
      const errorResult = Result.fail<CheckoutResponseDto, Error>(
        checkoutError,
      );
      mockProcessCheckoutUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.checkout(checkoutDto, mockRequest as any, 'es'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for generic errors', async () => {
      const genericError = new Error('Unknown error');
      const errorResult = Result.fail<CheckoutResponseDto, Error>(genericError);
      mockProcessCheckoutUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.checkout(checkoutDto, mockRequest as any, 'es'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.failed',
        'es',
      );
    });
  });

  describe('getTransactionStatus', () => {
    const transactionId = 'transaction-123';

    const mockStatusResponse: TransactionStatusResponse = {
      transactionId: 'transaction-123',
      status: TransactionStatus.APPROVED,
      paymentStatus: 'APPROVED',
      totalAmount: 100000,
      paymentReference: 'wompi-ref-123',
      isFinalStatus: true,
    };

    it('should return transaction status successfully', async () => {
      const successResult = Result.ok<TransactionStatusResponse, Error>(
        mockStatusResponse,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(
        successResult,
      );

      const result = await controller.getTransactionStatus(transactionId, 'es');

      expect(result).toEqual({
        statusCode: 200,
        message: 'checkout.statusChecked',
        data: mockStatusResponse,
      });
      expect(checkTransactionStatusUseCase.execute).toHaveBeenCalledWith(
        transactionId,
      );
    });

    it('should throw NotFoundException for transaction not found', async () => {
      const notFoundError = {
        code: 'TRANSACTION_NOT_FOUND',
        message: 'Transaction not found',
      };
      const errorResult = Result.fail<TransactionStatusResponse, any>(
        notFoundError,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.getTransactionStatus(transactionId, 'es'),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.transactionNotFound',
        'es',
      );
    });

    it('should throw BadRequestException for generic errors', async () => {
      const genericError = {
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
      };
      const errorResult = Result.fail<TransactionStatusResponse, any>(
        genericError,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.getTransactionStatus(transactionId, 'es'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.failedStatusCheck',
        'es',
      );
    });

    it('should handle PENDING status', async () => {
      const pendingResponse: TransactionStatusResponse = {
        ...mockStatusResponse,
        status: TransactionStatus.PENDING,
        paymentStatus: 'PENDING',
        isFinalStatus: false,
      };
      const successResult = Result.ok<TransactionStatusResponse, Error>(
        pendingResponse,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(
        successResult,
      );

      const result = await controller.getTransactionStatus(transactionId, 'es');

      expect(result.data.status).toBe(TransactionStatus.PENDING);
      expect(result.data.isFinalStatus).toBe(false);
    });

    it('should handle DECLINED status', async () => {
      const declinedResponse: TransactionStatusResponse = {
        ...mockStatusResponse,
        status: TransactionStatus.DECLINED,
        paymentStatus: 'DECLINED',
        isFinalStatus: true,
      };
      const successResult = Result.ok<TransactionStatusResponse, Error>(
        declinedResponse,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(
        successResult,
      );

      const result = await controller.getTransactionStatus(transactionId, 'es');

      expect(result.data.status).toBe(TransactionStatus.DECLINED);
      expect(result.data.isFinalStatus).toBe(true);
    });

    it('should handle ERROR status', async () => {
      const errorResponse: TransactionStatusResponse = {
        ...mockStatusResponse,
        status: TransactionStatus.ERROR,
        paymentStatus: 'ERROR',
        isFinalStatus: true,
      };
      const successResult = Result.ok<TransactionStatusResponse, Error>(
        errorResponse,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(
        successResult,
      );

      const result = await controller.getTransactionStatus(transactionId, 'es');

      expect(result.data.status).toBe(TransactionStatus.ERROR);
      expect(result.data.isFinalStatus).toBe(true);
    });
  });
});
