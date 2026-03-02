import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for transaction status query parameters
 * Used to validate the JWT status token in query string
 */
export class TransactionStatusQueryDto {
  /**
   * JWT status token received from checkout response
   * Contains transactionId and email, expires in 24h
   */
  @IsNotEmpty()
  @IsString()
  token: string;
}
