/**
 * Wompi Transaction Status
 * Docs: https://docs.wompi.co/docs/en/transacciones
 */
export enum WompiTransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  ERROR = 'ERROR',
}

/**
 * Wompi Tokenize Card Request
 * POST /tokens/cards
 * Docs: https://docs.wompi.co/docs/en/crear-tokens-de-tarjetas
 */
export interface WompiTokenizeCardRequest {
  number: string; // Card number
  cvc: string; // Security code (3 or 4 digits)
  exp_month: string; // Expiration month (2 digits)
  exp_year: string; // Expiration year (2 digits)
  card_holder: string; // Cardholder name
}

/**
 * Wompi Tokenize Card Response
 */
export interface WompiTokenizeCardResponse {
  status: 'CREATED';
  data: {
    id: string; // Token ID (e.g., "tok_prod_1_BBb749EAB32e97a2D058Dd538a608301")
    created_at: string;
    brand: string; // e.g., "VISA", "MASTERCARD", "AMEX"
    name: string; // Masked card name
    last_four: string; // Last 4 digits of card
    bin: string; // First 6 digits of card
    exp_year: string;
    exp_month: string;
    card_holder: string;
    expires_at: string;
  };
}

/**
 * Wompi Payment Method Types
 */
export enum WompiPaymentMethodType {
  CARD = 'CARD',
  NEQUI = 'NEQUI',
  PSE = 'PSE',
  BANCOLOMBIA_TRANSFER = 'BANCOLOMBIA_TRANSFER',
}

/**
 * Wompi Transaction Request
 * POST /transactions
 */
export interface WompiTransactionRequest {
  amount_in_cents: number;
  currency: string;
  signature: string;
  customer_email: string;
  payment_method: WompiPaymentMethod;
  reference: string;
  acceptance_token: string;
  redirect_url?: string;
  customer_data?: WompiCustomerData;
  shipping_address?: WompiShippingAddress;
  sandbox_status?: WompiTransactionStatus;
  ip?: string;
}
/**
 * Wompi Payment Method (CARD)
 */
export interface WompiCardPaymentMethod {
  type: 'CARD';
  token: string;
  installments: number;
}

/**
 * Wompi Payment Method (NEQUI)
 */
export interface WompiNequiPaymentMethod {
  type: 'NEQUI';
  phone_number: string;
}

/**
 * Wompi Payment Method (PSE)
 */
export interface WompiPSEPaymentMethod {
  type: 'PSE';
  user_type: 'NATURAL' | 'JURIDICA';
  user_legal_id: string;
  user_legal_id_type: 'CC' | 'CE' | 'NIT';
  financial_institution_code: string;
  payment_description: string;
}

/**
 * Union type for all payment methods
 */
export type WompiPaymentMethod =
  | WompiCardPaymentMethod
  | WompiNequiPaymentMethod
  | WompiPSEPaymentMethod;

/**
 * Customer data for Wompi
 */
export interface WompiCustomerData {
  phone_number: string;
  full_name: string;
  legal_id?: string;
  legal_id_type?: 'CC' | 'CE' | 'NIT' | 'PP';
}

/**
 * Shipping address
 */
export interface WompiShippingAddress {
  address_line_1: string;
  address_line_2?: string;
  country: string;
  region: string;
  city: string;
  name: string;
  phone_number: string;
  postal_code?: string;
}

/**
 * Merchant information from Wompi
 */
export interface WompiMerchant {
  id: number;
  name: string;
  legal_name: string;
  contact_name: string;
  phone_number: string;
  logo_url: string | null;
  legal_id_type: string;
  email: string;
  legal_id: string;
  public_key: string;
}

/**
 * Wompi Transaction Response
 * Response from POST /transactions
 */
export interface WompiTransactionResponse {
  data: {
    id: string; // Transaction ID from Wompi
    created_at: string;
    finalized_at?: string;
    amount_in_cents: number;
    reference: string;
    customer_email: string;
    currency: string;
    payment_method_type: string;
    payment_method: WompiPaymentMethodInfo;
    status: WompiTransactionStatus;
    status_message?: string;
    shipping_address?: WompiShippingAddress;
    redirect_url?: string;
    payment_link_id?: string;
    payment_source_id?: number;
    merchant?: WompiMerchant;
    // Billing data
    billing_data?: {
      legal_id: string;
      legal_id_type: string;
    };
    // Errors
    error?: {
      type: string;
      reason: string;
      messages: Record<string, string[]>;
    };
  };
}

/**
 * Payment method info in response
 */
export interface WompiPaymentMethodInfo {
  type: string;
  extra?: {
    bin?: string;
    name?: string;
    brand?: string;
    exp_year?: string;
    exp_month?: string;
    last_four?: string;
    card_holder?: string;
    is_three_ds?: boolean;
    unique_code?: string;
    phone_number?: string;
    bank_url?: string;
    async_payment_url?: string;
  };
  installments?: number;
}

/**
 * Wompi Error Response
 */
export interface WompiErrorResponse {
  error: {
    type: string;
    reason: string;
    messages?: Record<string, string[]>;
  };
}

/**
 * Wompi Webhook Event
 * Sent by Wompi to notify transaction status changes
 */
export interface WompiWebhookEvent {
  event: 'transaction.updated';
  data: {
    transaction: {
      id: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      payment_method_type: string;
      redirect_url: string;
      status: WompiTransactionStatus;
      shipping_address: WompiShippingAddress | null;
      payment_link_id: string | null;
      payment_source_id: number | null;
    };
  };
  sent_at: string;
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
  environment: 'test' | 'production';
}
