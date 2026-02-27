import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
  IsEnum,
  IsOptional,
  Min,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payment Method Type
 */
export enum PaymentMethodType {
  CARD = 'CARD',
  NEQUI = 'NEQUI',
  PSE = 'PSE',
  BANCOLOMBIA_TRANSFER = 'BANCOLOMBIA_TRANSFER',
}

/**
 * Card Data DTO
 * For tokenizing cards - these fields should be sent instead of token
 * IMPORTANT: Card data is sensitive and should be transmitted over HTTPS only
 */
export class CardDataDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{13,19}$/, {
    message: 'Card number must be between 13 and 19 digits',
  })
  number: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3,4}$/, { message: 'CVC must be 3 or 4 digits' })
  cvc: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'Expiration month must be 2 digits (01-12)' })
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'Expiration month must be between 01 and 12',
  })
  exp_month: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'Expiration year must be 2 digits' })
  @Matches(/^\d{2}$/, { message: 'Expiration year must be 2 digits' })
  exp_year: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100, {
    message: 'Card holder name must be between 2 and 100 characters',
  })
  card_holder: string;
}

/**
 * Payment Method DTO
 * Two options for CARD payments:
 * 1. Provide a pre-generated token (from your frontend tokenization)
 * 2. Provide card data (backend will tokenize it)
 */
export class PaymentMethodDto {
  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  type: PaymentMethodType;

  // For CARD - Option 1: Pre-generated token
  @ValidateIf(
    (o: PaymentMethodDto) => o.type === PaymentMethodType.CARD && !o.cardData,
  )
  @IsString()
  @IsNotEmpty({ message: 'Token or cardData is required for CARD payment' })
  token?: string;

  // For CARD - Option 2: Card data (will be tokenized by backend)
  @ValidateIf(
    (o: PaymentMethodDto) => o.type === PaymentMethodType.CARD && !o.token,
  )
  @ValidateNested()
  @Type(() => CardDataDto)
  cardData?: CardDataDto;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  installments?: number;

  // For NEQUI
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // For PSE
  @IsOptional()
  @IsEnum(['NATURAL', 'JURIDICA'])
  userType?: 'NATURAL' | 'JURIDICA';

  @IsOptional()
  @IsString()
  financialInstitutionCode?: string;
}

/**
 * Shipping Address DTO
 */
export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone: string;
}

/**
 * Checkout Item DTO
 */
export class CheckoutItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}

/**
 * Checkout Request DTO
 */
export class CheckoutRequestDto {
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @IsNotEmpty()
  items: CheckoutItemDto[];

  @ValidateNested()
  @Type(() => PaymentMethodDto)
  @IsNotEmpty()
  paymentMethod: PaymentMethodDto;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsNotEmpty()
  shippingAddress: ShippingAddressDto;

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  /**
   * Wompi acceptance token
   * Frontend must obtain this from GET https://api-sandbox.co.uat.wompi.dev/v1/merchants/{public_key}
   * This represents user's acceptance of terms & conditions
   */
  @IsString()
  @IsNotEmpty()
  acceptanceToken: string;
}

/**
 * Checkout Response DTO
 * IMPORTANT: Wompi payments are async - status will be PENDING initially
 * Client should poll GET /checkout/status/:transactionId to get final status
 */
export class CheckoutResponseDto {
  transactionId: string; // Internal transaction ID
  wompiTransactionId?: string; // Wompi's transaction ID (for reference)
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  amount: number;
  currency: string;
  reference: string; // Unique reference for this transaction (sent to Wompi)
  paymentMethod: string;
  deliveryId?: string; // Only present when status is APPROVED
  errorCode?: string;
  errorMessage?: string;
  redirectUrl?: string; // For async payment methods (PSE, BANCOLOMBIA_TRANSFER)
}
