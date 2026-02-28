/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { WompiStrategy } from './wompi.strategy';
import {
  TransactionData,
  PaymentMethodData,
  InvalidPaymentDataError,
  PaymentGatewayError,
} from '@application/ports/out';
import {
  WompiTransactionResponse,
  WompiTransactionStatus,
  WompiErrorResponse,
} from './wompi.types';
import { I18nService } from '@infrastructure/config/i18n';

describe('WompiStrategy', () => {
  let strategy: WompiStrategy;
  let httpService: HttpService;
  // ConfigService is used in the beforeEach setup
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  const mockWompiConfig = {
    publicKey: 'pub_test_123',
    privateKey: 'prv_test_456',
    apiUrl: 'https://sandbox.wompi.co/v1',
    eventsSecret: 'test_secret',
    integritySecret: 'integrity_test_secret',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WompiStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'wompi') return mockWompiConfig;
              return null;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn(
              (
                key: string,
                _lang: string,
                params?: Record<string, string | number>,
              ) => {
                // Mock translations for error messages
                const translations: Record<string, string> = {
                  'payment.wompi.errors.400': `Datos de ${params?.context || 'transacción'} inválidos. Verifique que todos los campos requeridos sean correctos (token de tarjeta, método de pago, acceptance_token)`,
                  'payment.wompi.errors.401':
                    'Error de autenticación con Wompi. Verifique que la clave privada (private key) sea correcta',
                  'payment.wompi.errors.422': `Error de validación en ${params?.context || 'transacción'}. Posibles causas: referencia duplicada, monto inválido, token de aceptación ya usado o inválido`,
                  'payment.wompi.errors.404': 'Recurso no encontrado en Wompi',
                  'payment.wompi.errors.500':
                    'Error interno del servidor de Wompi. Intente nuevamente más tarde',
                  'payment.wompi.errors.503':
                    'Servicio de Wompi temporalmente no disponible. Intente nuevamente más tarde',
                  'payment.wompi.errors.default': `Error HTTP ${params?.statusCode || 'desconocido'}`,
                };
                return translations[key] || key;
              },
            ),
            translate: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<WompiStrategy>(WompiStrategy);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getName', () => {
    it('should return "Wompi"', () => {
      expect(strategy.getName()).toBe('Wompi');
    });
  });

  describe('processPayment', () => {
    const validTransactionData: TransactionData = {
      amount: 100, // 100 COP (pesos) = 10000 centavos
      currency: 'COP',
      reference: 'TEST-001',
      customerEmail: 'test@example.com',
      ipAddress: '192.168.1.1',
      paymentMethod: {
        type: 'CARD',
        token: 'tok_test_123',
        installments: 1,
      } as PaymentMethodData,
    };

    it('should process a successful CARD payment', async () => {
      const mockResponse: WompiTransactionResponse = {
        data: {
          id: 'txn_123',
          created_at: '2024-01-01T00:00:00Z',
          amount_in_cents: 10000,
          reference: 'TEST-001',
          customer_email: 'test@example.com',
          currency: 'COP',
          payment_method_type: 'CARD',
          payment_method: {
            type: 'CARD',
            installments: 1,
          },
          status: WompiTransactionStatus.APPROVED,
        },
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(axiosResponse));

      const result = await strategy.processPayment(validTransactionData);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.transactionId).toBe('txn_123');
        expect(result.value.status).toBe('APPROVED');
        expect(result.value.reference).toBe('TEST-001');
        expect(result.value.paymentMethod).toBe('CARD');
      }

      expect(httpService.post).toHaveBeenCalledWith(
        `${mockWompiConfig.apiUrl}/transactions`,
        expect.objectContaining({
          amount_in_cents: 10000,
          currency: 'COP',
          reference: 'TEST-001',
          customer_email: 'test@example.com',
        }),
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockWompiConfig.privateKey}`,
          }),
        }),
      );
    });

    it('should process a PENDING transaction', async () => {
      const mockResponse: WompiTransactionResponse = {
        data: {
          id: 'txn_124',
          created_at: '2024-01-01T00:00:00Z',
          amount_in_cents: 10000,
          reference: 'TEST-002',
          customer_email: 'test@example.com',
          currency: 'COP',
          payment_method_type: 'NEQUI',
          payment_method: {
            type: 'NEQUI',
          },
          status: WompiTransactionStatus.PENDING,
        },
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(axiosResponse));

      const transactionData: TransactionData = {
        ...validTransactionData,
        reference: 'TEST-002',
        paymentMethod: {
          type: 'NEQUI',
          phoneNumber: '3001234567',
        } as PaymentMethodData,
      };

      const result = await strategy.processPayment(transactionData);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('PENDING');
      }
    });

    it('should return error for DECLINED transactions', async () => {
      const mockResponse: WompiTransactionResponse = {
        data: {
          id: 'txn_125',
          created_at: '2024-01-01T00:00:00Z',
          amount_in_cents: 10000,
          reference: 'TEST-003',
          customer_email: 'test@example.com',
          currency: 'COP',
          payment_method_type: 'CARD',
          payment_method: {
            type: 'CARD',
          },
          status: WompiTransactionStatus.DECLINED,
          status_message: 'Insufficient funds',
        },
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(axiosResponse));

      const result = await strategy.processPayment(validTransactionData);

      // DECLINED is a valid final state that returns ok(), not err()
      // This allows client polling to see the DECLINED status
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('DECLINED');
        expect(result.value.errorMessage).toContain('Insufficient funds');
      }
    });

    it('should validate amount is greater than zero', async () => {
      const invalidData: TransactionData = {
        ...validTransactionData,
        amount: 0,
      };

      const result = await strategy.processPayment(invalidData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidPaymentDataError);
        expect(result.error.message).toContain(
          'Amount must be greater than zero',
        );
      }
    });

    it('should validate currency is COP', async () => {
      const invalidData: TransactionData = {
        ...validTransactionData,
        currency: 'USD',
      };

      const result = await strategy.processPayment(invalidData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidPaymentDataError);
        expect(result.error.message).toContain('Currency must be COP');
      }
    });

    it('should validate reference is not empty', async () => {
      const invalidData: TransactionData = {
        ...validTransactionData,
        reference: '',
      };

      const result = await strategy.processPayment(invalidData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidPaymentDataError);
        expect(result.error.message).toContain('Reference is required');
      }
    });

    it('should validate customer email is present', async () => {
      const invalidData: TransactionData = {
        ...validTransactionData,
        customerEmail: '',
      };

      const result = await strategy.processPayment(invalidData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidPaymentDataError);
        expect(result.error.message).toContain('Customer email is required');
      }
    });

    it('should validate IP address is present', async () => {
      const invalidData: TransactionData = {
        ...validTransactionData,
        ipAddress: '',
      };

      const result = await strategy.processPayment(invalidData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidPaymentDataError);
        expect(result.error.message).toContain('IP address is required');
      }
    });

    it('should handle Wompi 400 error (bad request)', async () => {
      const errorResponse: WompiErrorResponse = {
        error: {
          type: 'INPUT_VALIDATION_ERROR',
          reason: 'Invalid payment method',
          messages: {
            'payment_method.token': ['is required'],
          },
        },
      };

      const axiosError = {
        response: {
          data: errorResponse,
          status: 400,
        },
      } as AxiosError;

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => axiosError));

      const result = await strategy.processPayment(validTransactionData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidPaymentDataError);
        expect(result.error.message).toContain('is required');
      }
    });

    it('should handle Wompi 401 error (authentication)', async () => {
      const errorResponse: WompiErrorResponse = {
        error: {
          type: 'AUTHENTICATION_ERROR',
          reason: 'Invalid API key',
        },
      };

      const axiosError = {
        response: {
          data: errorResponse,
          status: 401,
        },
      } as AxiosError;

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => axiosError));

      const result = await strategy.processPayment(validTransactionData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PaymentGatewayError);
        expect(result.error.message).toContain('Invalid API key');
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => networkError));

      const result = await strategy.processPayment(validTransactionData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PaymentGatewayError);
        expect(result.error.message).toContain('Error connecting to Wompi');
      }
    });
  });

  describe('getTransactionStatus', () => {
    it('should get transaction status successfully', async () => {
      const mockResponse: WompiTransactionResponse = {
        data: {
          id: 'txn_123',
          created_at: '2024-01-01T00:00:00Z',
          amount_in_cents: 10000,
          reference: 'TEST-001',
          customer_email: 'test@example.com',
          currency: 'COP',
          payment_method_type: 'CARD',
          payment_method: {
            type: 'CARD',
          },
          status: WompiTransactionStatus.APPROVED,
        },
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));

      const result = await strategy.getTransactionStatus('txn_123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.transactionId).toBe('txn_123');
        expect(result.value.status).toBe('APPROVED');
      }

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockWompiConfig.apiUrl}/transactions/txn_123`,
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockWompiConfig.publicKey}`,
          }),
        }),
      );
    });

    it('should handle errors when getting transaction status', async () => {
      const errorResponse: WompiErrorResponse = {
        error: {
          type: 'NOT_FOUND',
          reason: 'Transaction not found',
        },
      };

      const axiosError = {
        response: {
          data: errorResponse,
          status: 404,
        },
      } as AxiosError;

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => axiosError));

      const result = await strategy.getTransactionStatus('invalid_txn');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PaymentGatewayError);
      }
    });
  });
});
