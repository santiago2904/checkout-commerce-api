import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Payload for transaction status JWT token
 */
export interface TransactionStatusTokenPayload {
  transactionId: string;
  email: string;
}

/**
 * Transaction Status Token Service
 * 
 * Generates and validates JWT tokens for secure public access to transaction status.
 * These tokens are separate from authentication tokens and have shorter expiration (24h).
 * 
 * Security benefits:
 * - Token cannot be forged (signed with secret)
 * - Contains both transactionId and email (dual verification)
 * - Expires automatically (reduces window for abuse)
 * - Even if transactionId is leaked, token is required
 */
@Injectable()
export class TransactionStatusTokenService {
  private readonly STATUS_TOKEN_EXPIRY = '24h';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a status token for a transaction
   * @param transactionId Transaction UUID
   * @param email Customer email
   * @returns JWT token string
   */
  async generateStatusToken(
    transactionId: string,
    email: string,
  ): Promise<string> {
    const payload: TransactionStatusTokenPayload = {
      transactionId,
      email,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.STATUS_TOKEN_EXPIRY,
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Verify and decode a status token
   * @param token JWT token to verify
   * @returns Decoded payload with transactionId and email
   * @throws Error if token is invalid or expired
   */
  async verifyStatusToken(
    token: string,
  ): Promise<TransactionStatusTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TransactionStatusTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );
    } catch (error) {
      throw new Error(`Invalid or expired status token: ${error.message}`);
    }
  }
}
