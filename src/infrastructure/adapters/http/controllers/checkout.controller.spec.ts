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
  GetMyTransactionsUseCase,
} from '@application/use-cases/checkout';
import {
  CheckoutError,
  InsufficientStockError,
  ProductNotFoundError,
} from '@application/use-cases/checkout/process-checkout.use-case';
import { PaymentMethodType } from '@application/dtos/checkout/checkout.dto';
import { I18nService } from '@infrastructure/config/i18n';
import { Result } from '@application/utils';
import type { CheckoutResponseDto } from '@application/dtos/checkout';
import type { TransactionStatusResponse } from '@application/use-cases/checkout/check-transaction-status.use-case';
import { TransactionStatus } from '@domain/enums';
import { AuditInterceptor } from '@infrastructure/adapters/web/interceptors/audit.interceptor';
import type { Express } from 'express';

type RequestWithUser = Express.Request & {
  user: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    customer?: {
      id: string;
    };
  };
};

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

  const mockGetMyTransactionsUseCase = {
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
  } as unknown as RequestWithUser;

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
          provide: GetMyTransactionsUseCase,
          useValue: mockGetMyTransactionsUseCase,
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
        },
      ],
      paymentMethod: {
        type: PaymentMethodType.CARD,
        token: 'card-token-123',
      },
      shippingAddress: {
        addressLine1: '123 Main St',
        city: 'Bogotá',
        region: 'Cundinamarca',
        country: 'CO',
        recipientName: 'John Doe',
        recipientPhone: '+573001234567',
      },
      customerEmail: 'test@example.com',
      acceptanceToken: 'acceptance-token-123',
    };

    const mockCheckoutResponse: CheckoutResponseDto = {
      transactionId: 'transaction-123',
      wompiTransactionId: 'wompi-123',
      status: TransactionStatus.PENDING,
      amount: 100000,
      currency: 'COP',
      reference: 'REF-123',
      paymentMethod: 'CARD',
    };

    it('should process checkout successfully', async () => {
      const successResult = Result.ok<CheckoutResponseDto, Error>(
        mockCheckoutResponse,
      );
      mockProcessCheckoutUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.checkout(checkoutDto, mockRequest, 'es');

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
        controller.checkout(
          checkoutDto,
          requestWithoutCustomer as unknown as RequestWithUser,
          'es',
        ),
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
        controller.checkout(checkoutDto, mockRequest, 'es'),
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
        controller.checkout(checkoutDto, mockRequest, 'es'),
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
        controller.checkout(checkoutDto, mockRequest, 'es'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'checkout.errors.failed',
        'es',
      );
    });

    it('should throw BadRequestException for CheckoutError without code', async () => {
      const checkoutError = new CheckoutError(
        'Payment failed',
        'GENERIC_ERROR',
      );
      const errorResult = Result.fail<CheckoutResponseDto, Error>(
        checkoutError,
      );
      mockProcessCheckoutUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.checkout(checkoutDto, mockRequest, 'es'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for generic errors', async () => {
      const genericError = new Error('Unknown error');
      const errorResult = Result.fail<CheckoutResponseDto, Error>(genericError);
      mockProcessCheckoutUseCase.execute.mockResolvedValue(errorResult);

      await expect(
        controller.checkout(checkoutDto, mockRequest, 'es'),
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
      wompiTransactionId: 'wompi-123',
      status: TransactionStatus.APPROVED,
      amount: 100000,
      reference: 'REF-123',
      paymentMethod: 'CARD',
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
      const errorResult = Result.fail<
        TransactionStatusResponse,
        { code: string; message: string }
      >(notFoundError);
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
      const errorResult = Result.fail<
        TransactionStatusResponse,
        { code: string; message: string }
      >(genericError);
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
      };
      const successResult = Result.ok<TransactionStatusResponse, Error>(
        pendingResponse,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(
        successResult,
      );

      const result = await controller.getTransactionStatus(transactionId, 'es');

      expect(result.data.status).toBe(TransactionStatus.PENDING);
    });

    it('should handle DECLINED status', async () => {
      const declinedResponse: TransactionStatusResponse = {
        ...mockStatusResponse,
        status: TransactionStatus.DECLINED,
      };
      const successResult = Result.ok<TransactionStatusResponse, Error>(
        declinedResponse,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(
        successResult,
      );

      const result = await controller.getTransactionStatus(transactionId, 'es');

      expect(result.data.status).toBe(TransactionStatus.DECLINED);
    });

    it('should handle ERROR status', async () => {
      const errorResponse: TransactionStatusResponse = {
        ...mockStatusResponse,
        status: TransactionStatus.ERROR,
      };
      const successResult = Result.ok<TransactionStatusResponse, Error>(
        errorResponse,
      );
      mockCheckTransactionStatusUseCase.execute.mockResolvedValue(
        successResult,
      );

      const result = await controller.getTransactionStatus(transactionId, 'es');

      expect(result.data.status).toBe(TransactionStatus.ERROR);
    });
  });
});
