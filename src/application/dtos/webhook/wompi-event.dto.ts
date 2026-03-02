import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum EWompiEventType {
  TRANSACTION_UPDATED = 'transaction.updated',
  NEQUI_TOKEN_UPDATED = 'nequi_token.updated',
  BANCOLOMBIA_TRANSFER_TOKEN_UPDATED = 'bancolombia_transfer_token.updated',
}

export class WompiEventSignatureDto {
  @IsString({ each: true })
  @IsNotEmpty()
  properties: string[];

  @IsString()
  @IsNotEmpty()
  checksum: string;
}

export class WompiTransactionDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsNotEmpty()
  amount_in_cents: number;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  customer_email: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  payment_method_type: string;

  @IsString()
  @IsOptional()
  redirect_url?: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  shipping_address?: Record<string, unknown> | null;

  @IsOptional()
  payment_link_id?: string;

  @IsOptional()
  payment_source_id?: string;
}

export class WompiEventDataDto {
  @IsObject()
  @IsNotEmpty()
  transaction: WompiTransactionDataDto;
}

export class WompiEventDto {
  @IsEnum(EWompiEventType)
  @IsNotEmpty()
  event: EWompiEventType;

  @IsObject()
  @IsNotEmpty()
  data: WompiEventDataDto;

  @IsString()
  @IsNotEmpty()
  environment: string;

  @IsObject()
  @IsNotEmpty()
  signature: WompiEventSignatureDto;

  @IsNumber()
  @IsNotEmpty()
  timestamp: number;

  @IsString()
  @IsNotEmpty()
  sent_at: string;
}
