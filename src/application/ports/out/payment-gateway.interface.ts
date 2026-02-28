import { Result } from '@application/utils';

/**
 * Card tokenization data
 */
export interface CardTokenizationData {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

/**
 * Transaction data required to process a payment
 */
export interface TransactionData {
  amount: number;
  currency: string;
  reference: string;
  customerEmail: string;
  paymentMethod: PaymentMethodData;
  ipAddress: string;
  acceptanceToken: string; // Wompi acceptance token from frontend
  redirectUrl?: string; // Optional redirect URL for frontend after payment
}

/**
 * Payment method details
 */
export interface PaymentMethodData {
  type: 'CARD' | 'PSE' | 'NEQUI' | 'BANCOLOMBIA_TRANSFER';
  token?: string; // For tokenized cards
  installments?: number;
  // PSE specific
  userType?: 'NATURAL' | 'JURIDICA';
  financialInstitutionCode?: string;
  // Phone for NEQUI
  phoneNumber?: string;
}

/**
 * Payment processing result
 */
export interface PaymentResult {
  transactionId: string; // Gateway transaction ID
  reference: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  paymentMethod: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Payment Gateway Interface (Output Port)
 * Strategy Pattern base interface for payment gateways
 * Allows switching between different payment providers (Wompi, Stripe, PayU, etc.)
 */
export interface IPaymentGateway {
  /**
   * Process a payment transaction
   * Returns Result monad for Railway Oriented Programming
   */
  processPayment(
    transactionData: TransactionData,
  ): Promise<Result<PaymentResult, PaymentError>>;

  /**
   * Get transaction status from the gateway
   * Useful for polling or webhook validation
   */
  getTransactionStatus(
    transactionId: string,
  ): Promise<Result<PaymentResult, PaymentError>>;

  /**
   * Tokenize a credit/debit card
   * Used for CARD payments where card details are provided instead of a pre-generated token
   * Returns a secure token that can be used for payment processing
   */
  tokenizeCard(
    cardData: CardTokenizationData,
  ): Promise<Result<string, PaymentError>>;

  /**
   * Get the name of the payment gateway
   */
  getName(): string;
}

/**
 * Base Payment Error
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Payment Gateway Connection Error
 */
export class PaymentGatewayError extends PaymentError {
  constructor(message: string, details?: any) {
    super(message, 'PAYMENT_GATEWAY_ERROR', details);
    this.name = 'PaymentGatewayError';
  }
}

/**
 * Invalid Payment Data Error
 */
export class InvalidPaymentDataError extends PaymentError {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_PAYMENT_DATA', details);
    this.name = 'InvalidPaymentDataError';
  }
}

/**
 * Transaction Declined Error
 */
export class TransactionDeclinedError extends PaymentError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'TransactionDeclinedError';
  }
}
