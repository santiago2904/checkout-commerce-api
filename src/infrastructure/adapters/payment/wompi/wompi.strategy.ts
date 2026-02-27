import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash } from 'crypto';
import {
  IPaymentGateway,
  TransactionData,
  PaymentResult,
  PaymentError,
  PaymentGatewayError,
  InvalidPaymentDataError,
  TransactionDeclinedError,
} from '@application/ports/out';
import { Result, ok, err } from '@application/utils';
import {
  WompiTransactionRequest,
  WompiTransactionResponse,
  WompiTransactionStatus,
  WompiCardPaymentMethod,
  WompiNequiPaymentMethod,
  WompiPSEPaymentMethod,
  WompiErrorResponse,
} from './wompi.types';
import { WompiConfig } from './wompi.config';

/**
 * Wompi Payment Gateway Strategy
 * Implements IPaymentGateway for Wompi integration
 * Docs: https://docs.wompi.co/docs/en/transacciones
 */
@Injectable()
export class WompiStrategy implements IPaymentGateway {
  private readonly logger = new Logger(WompiStrategy.name);
  private readonly wompiConfig: WompiConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.wompiConfig = this.configService.get<WompiConfig>('wompi')!;
  }

  /**
   * Get gateway name
   */
  getName(): string {
    return 'Wompi';
  }

  /**
   * Process a payment with Wompi
   * ROP: Returns Result<PaymentResult, PaymentError>
   */
  async processPayment(
    transactionData: TransactionData,
  ): Promise<Result<PaymentResult, PaymentError>> {
    this.logger.log(
      `Processing payment with Wompi: ${transactionData.reference}`,
    );

    try {
      // 1. Validate input data
      const validationResult = this.validateTransactionData(transactionData);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // 2. Build Wompi request
      const wompiRequest = this.buildWompiRequest(transactionData);

      // 3. Calculate integrity signature
      wompiRequest.signature = this.calculateSignature(
        transactionData.reference,
        transactionData.amount,
        transactionData.currency,
      );

      // 4. Send request to Wompi
      const url = `${this.wompiConfig.apiUrl}/transactions`;
      const response = await firstValueFrom(
        this.httpService.post<WompiTransactionResponse>(url, wompiRequest, {
          headers: {
            Authorization: `Bearer ${this.wompiConfig.privateKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      // 5. Map response to PaymentResult
      return this.mapWompiResponse(response.data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing payment with Wompi: ${errorMessage}`,
        errorStack,
      );

      // Handle HTTP errors from Wompi
      if (this.isAxiosError(error) && error.response) {
        const wompiError = error.response.data as WompiErrorResponse;
        return this.handleWompiError(wompiError, error.response.status);
      }

      // Handle network or unexpected errors
      return err(
        new PaymentGatewayError('Error connecting to Wompi', errorMessage),
      );
    }
  }

  /**
   * Get transaction status from Wompi
   * GET /transactions/{id}
   */
  async getTransactionStatus(
    transactionId: string,
  ): Promise<Result<PaymentResult, PaymentError>> {
    this.logger.log(`Getting transaction status: ${transactionId}`);

    try {
      const url = `${this.wompiConfig.apiUrl}/transactions/${transactionId}`;
      const response = await firstValueFrom(
        this.httpService.get<WompiTransactionResponse>(url, {
          headers: {
            Authorization: `Bearer ${this.wompiConfig.publicKey}`,
          },
        }),
      );

      return this.mapWompiResponse(response.data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error getting transaction status: ${errorMessage}`,
        errorStack,
      );

      if (this.isAxiosError(error) && error.response) {
        const wompiError = error.response.data as WompiErrorResponse;
        return this.handleWompiError(wompiError, error.response.status);
      }

      return err(
        new PaymentGatewayError('Error connecting to Wompi', errorMessage),
      );
    }
  }

  /**
   * Validate transaction data before sending to Wompi
   */
  private validateTransactionData(
    data: TransactionData,
  ): Result<void, PaymentError> {
    if (!data.amount || data.amount <= 0) {
      return err(
        new InvalidPaymentDataError('Amount must be greater than zero'),
      );
    }

    if (!data.currency || data.currency !== 'COP') {
      return err(new InvalidPaymentDataError('Currency must be COP for Wompi'));
    }

    if (!data.reference || data.reference.length === 0) {
      return err(new InvalidPaymentDataError('Reference is required'));
    }

    if (!data.customerEmail) {
      return err(new InvalidPaymentDataError('Customer email is required'));
    }

    if (!data.ipAddress) {
      return err(new InvalidPaymentDataError('IP address is required'));
    }

    if (!data.paymentMethod || !data.paymentMethod.type) {
      return err(new InvalidPaymentDataError('Payment method is required'));
    }

    return ok(undefined);
  }

  /**
   * Build Wompi transaction request
   */
  private buildWompiRequest(data: TransactionData): WompiTransactionRequest {
    const request: WompiTransactionRequest = {
      amount_in_cents: data.amount, // Already in cents
      currency: data.currency,
      signature: '', // Will be calculated next
      customer_email: data.customerEmail,
      reference: data.reference,
      payment_method: this.buildPaymentMethod(data),
    };

    return request;
  }

  /**
   * Build payment method object based on type
   */
  private buildPaymentMethod(
    data: TransactionData,
  ): WompiCardPaymentMethod | WompiNequiPaymentMethod | WompiPSEPaymentMethod {
    const method = data.paymentMethod;

    switch (method.type) {
      case 'CARD':
        return {
          type: 'CARD',
          token: method.token || '',
          installments: method.installments || 1,
        };

      case 'NEQUI':
        return {
          type: 'NEQUI',
          phone_number: method.phoneNumber || '',
        };

      case 'PSE':
        return {
          type: 'PSE',
          user_type: method.userType || 'NATURAL',
          user_legal_id: '123456789', // Should come from customer data
          user_legal_id_type: 'CC',
          financial_institution_code: method.financialInstitutionCode || '',
          payment_description: 'Pago de productos',
        };

      default:
        throw new Error(`Unsupported payment method: ${method.type}`);
    }
  }

  /**
   * Calculate integrity signature for Wompi
   * Signature = SHA256(reference + amount_in_cents + currency + integrity_key)
   * Docs: https://docs.wompi.co/docs/en/integridad
   */
  private calculateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const integrityKey = this.wompiConfig.eventsSecret;
    const concatenated = `${reference}${amountInCents}${currency}${integrityKey}`;
    const hash = createHash('sha256').update(concatenated).digest('hex');
    return hash;
  }

  /**
   * Map Wompi response to PaymentResult
   */
  private mapWompiResponse(
    response: WompiTransactionResponse,
  ): Result<PaymentResult, PaymentError> {
    const { data } = response;

    const result: PaymentResult = {
      transactionId: data.id,
      reference: data.reference,
      status: this.mapWompiStatus(data.status),
      paymentMethod: data.payment_method_type,
      errorCode: data.error?.type,
      errorMessage: data.error?.reason,
    };

    // Check if transaction has errors
    if (data.error) {
      return err(
        new TransactionDeclinedError(
          data.error.reason || 'Transaction declined',
          data.error.type,
          data.error.messages,
        ),
      );
    }

    // If transaction is DECLINED or ERROR, return as error
    if (result.status === 'DECLINED' || result.status === 'ERROR') {
      return err(
        new TransactionDeclinedError(
          data.status_message || 'Transaction declined',
          data.status,
          result,
        ),
      );
    }

    return ok(result);
  }

  /**
   * Map Wompi status to our internal status
   */
  private mapWompiStatus(
    wompiStatus: WompiTransactionStatus,
  ): 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' {
    switch (wompiStatus) {
      case WompiTransactionStatus.PENDING:
        return 'PENDING';
      case WompiTransactionStatus.APPROVED:
        return 'APPROVED';
      case WompiTransactionStatus.DECLINED:
        return 'DECLINED';
      case WompiTransactionStatus.VOIDED:
        return 'DECLINED'; // Map VOIDED to DECLINED
      case WompiTransactionStatus.ERROR:
        return 'ERROR';
      default:
        return 'ERROR';
    }
  }

  /**
   * Handle Wompi API errors
   */
  private handleWompiError(
    errorResponse: WompiErrorResponse,
    statusCode: number,
  ): Result<PaymentResult, PaymentError> {
    const { error } = errorResponse;

    switch (statusCode) {
      case 400:
        return err(
          new InvalidPaymentDataError(
            error.reason || 'Invalid payment data',
            error.messages,
          ),
        );
      case 401:
        return err(
          new PaymentGatewayError('Authentication failed with Wompi', error),
        );
      case 422:
        return err(
          new InvalidPaymentDataError(
            error.reason || 'Validation error',
            error.messages,
          ),
        );
      default:
        return err(
          new PaymentGatewayError(
            error.reason || 'Unknown error from Wompi',
            error,
          ),
        );
    }
  }

  /**
   * Type guard to check if error is an Axios error
   */
  private isAxiosError(
    error: unknown,
  ): error is { response: { data: unknown; status: number } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof (error as any).response === 'object' &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (error as any).response !== null
    );
  }
}
