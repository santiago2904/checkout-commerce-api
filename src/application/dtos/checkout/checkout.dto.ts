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
 * Payment Method DTO
 */
export class PaymentMethodDto {
  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  type: PaymentMethodType;

  // For CARD
  @IsOptional()
  @IsString()
  token?: string;

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
}

/**
 * Checkout Response DTO
 */
export class CheckoutResponseDto {
  transactionId: string;
  transactionNumber: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  amount: number;
  currency: string;
  reference: string;
  paymentMethod: string;
  deliveryId?: string;
  errorCode?: string;
  errorMessage?: string;
  redirectUrl?: string;
}
