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
  WompiTokenizeCardRequest,
  WompiTokenizeCardResponse,
} from './wompi.types';
import { WompiConfig } from './wompi.config';
import { I18nService, SupportedLanguage } from '@infrastructure/config/i18n';

/**
 * Wompi Payment Gateway Strategy
 * Implements IPaymentGateway for Wompi integration
 * Docs: https://docs.wompi.co/docs/en/transacciones
 */
@Injectable()
export class WompiStrategy implements IPaymentGateway {
  private readonly logger = new Logger(WompiStrategy.name);
  private readonly wompiConfig: WompiConfig;
  private readonly defaultLanguage: SupportedLanguage = 'es';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly i18n: I18nService,
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

      // 2. Build Wompi request (acceptance token comes from frontend via transactionData)
      const wompiRequest = this.buildWompiRequest(transactionData);

      // 3. Calculate integrity signature
      // IMPORTANT: Signature must use amount in CENTS (same as amount_in_cents in request)
      wompiRequest.signature = this.calculateSignature(
        wompiRequest.reference,
        wompiRequest.amount_in_cents, // Use the converted amount in cents
        wompiRequest.currency,
      );

      // DEBUG: Log complete request body (sanitized tokens)
      this.logger.debug('=== WOMPI REQUEST DEBUG ===');
      this.logger.debug(
        `Full request body: ${JSON.stringify(wompiRequest, null, 2)}`,
      );
      this.logger.debug(
        `Headers: Authorization: Bearer ${this.wompiConfig.privateKey.slice(0, 15)}...`,
      );
      this.logger.debug('========================');

      // Log request (sanitized)
      this.logger.debug(`Wompi request: ${JSON.stringify(wompiRequest)}`);

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

      // DEBUG: Log complete response
      this.logger.debug('=== WOMPI RESPONSE DEBUG ===');
      this.logger.debug(`Status: ${response.status}`);
      this.logger.debug(
        `Response body: ${JSON.stringify(response.data, null, 2)}`,
      );
      this.logger.debug('===========================');

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

        // Log detailed error information from Wompi
        this.logger.error(
          `Wompi payment error (${error.response.status}): ${JSON.stringify(wompiError)}`,
        );

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

      this.logger.debug(
        `get status response: ${JSON.stringify(response.data, null, 2)}`,
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
   * Tokenize a credit/debit card
   * POST /tokens/cards
   * Docs: https://docs.wompi.co/docs/en/crear-tokens-de-tarjetas
   *
   * IMPORTANT: Use PUBLIC key for tokenization (not private key)
   */
  async tokenizeCard(
    cardData: WompiTokenizeCardRequest,
  ): Promise<Result<string, PaymentError>> {
    this.logger.log('Tokenizing card...');
    this.logger.debug(
      `Card data: ${JSON.stringify({ ...cardData, number: cardData.number.slice(-4), cvc: '***' })}`,
    );

    try {
      const url = `${this.wompiConfig.apiUrl}/tokens/cards`;
      const response = await firstValueFrom(
        this.httpService.post<WompiTokenizeCardResponse>(url, cardData, {
          headers: {
            Authorization: `Bearer ${this.wompiConfig.publicKey}`, // Use PUBLIC key
            'Content-Type': 'application/json',
          },
        }),
      );

      const token = response.data.data.id;
      this.logger.log(`Card tokenized successfully: ${token}`);

      return ok(token);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error tokenizing card: ${errorMessage}`, errorStack);

      if (this.isAxiosError(error) && error.response) {
        const wompiError = error.response.data as WompiErrorResponse;

        // Log detailed error information from Wompi
        this.logger.error(
          `Wompi tokenization error (${error.response.status}): ${JSON.stringify(wompiError)}`,
        );

        return this.handleTokenizationError(wompiError, error.response.status);
      }

      return err(
        new PaymentGatewayError('Error tokenizing card', errorMessage),
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
      amount_in_cents: Math.round(data.amount * 100),
      currency: data.currency,
      signature: '', // Will be calculated next
      customer_email: data.customerEmail,
      reference: data.reference,
      acceptance_token: data.acceptanceToken, // From frontend
      payment_method: this.buildPaymentMethod(data),
      sandbox_status: WompiTransactionStatus.DECLINED,
      redirect_url: data.redirectUrl || undefined,
      ip: data.ipAddress,
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
   *
   * CRITICAL: amountInCents MUST be the exact same value sent in amount_in_cents field
   * in the Wompi request (i.e., in CENTS/CENTAVOS, not pesos)
   *
   * Example: For $24,900.00 COP, use 2490000 (cents), NOT 24900.00
   *
   * Docs: https://docs.wompi.co/docs/en/integridad
   *
   * @param reference - Transaction reference (e.g., "REF-123456789-abcd1234")
   * @param amountInCents - Amount in CENTS/CENTAVOS (e.g., 2490000 for $24,900.00)
   * @param currency - Currency code (e.g., "COP")
   */
  private calculateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const integrityKey = this.wompiConfig.integritySecret;
    const concatenated = `${reference}${amountInCents}${currency}${integrityKey}`;
    const hash = createHash('sha256').update(concatenated).digest('hex');
    return hash;
  }

  /**
   * Map Wompi response to PaymentResult
   *
   * IMPORTANT: All transaction states (PENDING, APPROVED, DECLINED, ERROR) are valid states
   * that should return ok() with the status. This allows proper async polling by the client.
   *
   * Only return err() for communication/validation errors with Wompi API itself.
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
      errorCode:
        data.error?.type ||
        (data.status === WompiTransactionStatus.DECLINED ||
        data.status === WompiTransactionStatus.ERROR
          ? data.status
          : undefined),
      errorMessage: data.error?.reason || data.status_message,
      redirectUrl: data.redirect_url,
      statusMessage: data.status_message,
      merchant: data.merchant
        ? {
            id: data.merchant.id,
            name: data.merchant.name,
            legal_name: data.merchant.legal_name,
            contact_name: data.merchant.contact_name,
            phone_number: data.merchant.phone_number,
            logo_url: data.merchant.logo_url,
            legal_id_type: data.merchant.legal_id_type,
            email: data.merchant.email,
            legal_id: data.merchant.legal_id,
            public_key: data.merchant.public_key,
          }
        : undefined,
    };

    // All states (PENDING, APPROVED, DECLINED, ERROR) are valid and should return ok()
    // The client will check the status field to determine the outcome
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

    // Extract detailed error messages from Wompi response
    const wompiMessage = this.formatWompiErrorMessage(error);
    const errorMessage = wompiMessage || error.reason || 'Error desconocido';

    switch (statusCode) {
      case 400:
        return err(new InvalidPaymentDataError(errorMessage, error.messages));
      case 401:
        return err(new PaymentGatewayError(errorMessage, error));
      case 422:
        return err(new InvalidPaymentDataError(errorMessage, error.messages));
      default:
        return err(
          new PaymentGatewayError(
            `Error inesperado (${statusCode}): ${errorMessage}`,
            error,
          ),
        );
    }
  }

  /**
   * Handle Wompi API errors for tokenization
   */
  private handleTokenizationError(
    errorResponse: WompiErrorResponse,
    statusCode: number,
  ): Result<string, PaymentError> {
    const { error } = errorResponse;

    // Extract detailed error messages from Wompi response
    const wompiMessage = this.formatWompiErrorMessage(error);
    const errorMessage = wompiMessage || error.reason || 'Error desconocido';

    switch (statusCode) {
      case 400:
        return err(new InvalidPaymentDataError(errorMessage, error.messages));
      case 401:
        return err(new PaymentGatewayError(errorMessage, error));
      case 422:
        return err(new InvalidPaymentDataError(errorMessage, error.messages));
      default:
        return err(
          new PaymentGatewayError(
            `Error inesperado en tokenización (${statusCode}): ${errorMessage}`,
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
      typeof (error as Record<string, unknown>).response === 'object' &&
      (error as Record<string, unknown>).response !== null
    );
  }

  /**
   * Format Wompi error messages into a readable string
   */
  private formatWompiErrorMessage(error: {
    type?: string;
    reason?: string;
    messages?: Record<string, string[]>;
  }): string {
    if (!error.messages || Object.keys(error.messages).length === 0) {
      return error.reason || '';
    }

    // Extract all error messages with field names
    const allMessages: string[] = [];

    for (const [field, messages] of Object.entries(error.messages)) {
      if (Array.isArray(messages)) {
        // Include field name with each message
        const fieldMessages = messages.map((msg) => `${field}: ${msg}`);
        allMessages.push(...fieldMessages);
      }
    }

    // Return formatted message
    if (allMessages.length === 0) {
      return error.reason || '';
    }

    return allMessages.join('. ');
  }

  /**
   * Get descriptive error message based on HTTP status code
   */
  private getErrorDescriptionByStatusCode(
    statusCode: number,
    context: string = 'transacción',
  ): string {
    const key = `payment.wompi.errors.${statusCode}`;
    const translation = this.i18n.t(key, this.defaultLanguage, { context });

    // If translation not found (returns key), use default
    if (translation === key) {
      return this.i18n.t('payment.wompi.errors.default', this.defaultLanguage, {
        statusCode,
      });
    }

    return translation;
  }
}
