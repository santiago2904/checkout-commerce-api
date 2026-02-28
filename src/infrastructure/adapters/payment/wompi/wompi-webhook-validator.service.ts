import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WompiEventDto } from '../../../../application/dtos/webhook';

@Injectable()
export class WompiWebhookValidatorService {
  private readonly logger = new Logger(WompiWebhookValidatorService.name);
  private readonly eventsSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.eventsSecret = this.configService.get<string>(
      'wompi.eventsSecret',
      '',
    );
  }

  /**
   * Validates the authenticity of a Wompi webhook event by verifying its SHA256 checksum
   * @param event The Wompi event to validate
   * @returns true if the event is authentic, false otherwise
   */
  validateEventSignature(event: WompiEventDto): boolean {
    try {
      const calculatedChecksum = this.calculateChecksum(event);
      const receivedChecksum = event.signature.checksum;

      const isValid =
        calculatedChecksum.toUpperCase() === receivedChecksum.toUpperCase();

      if (!isValid) {
        this.logger.warn(
          `Invalid webhook signature. Expected: ${calculatedChecksum}, Received: ${receivedChecksum}`,
        );
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Calculates the SHA256 checksum for a Wompi event
   * Following Wompi's documentation:
   * 1. Concatenate property values from signature.properties
   * 2. Concatenate timestamp
   * 3. Concatenate events secret
   * 4. Calculate SHA256 hash
   */
  private calculateChecksum(event: WompiEventDto): string {
    // Step 1: Extract and concatenate property values
    const propertyValues = this.extractPropertyValues(
      event.data,
      event.signature.properties,
    );

    // Step 2: Concatenate timestamp
    const concatenatedString = propertyValues + event.timestamp;

    // Step 3: Concatenate events secret
    const finalString = concatenatedString + this.eventsSecret;

    // Step 4: Calculate SHA256 hash
    const hash = crypto.createHash('sha256').update(finalString).digest('hex');

    this.logger.debug(`Calculated checksum for event: ${hash}`);

    return hash.toUpperCase();
  }

  /**
   * Extracts property values from the event data object based on the property paths
   * Example: ['transaction.id', 'transaction.status'] => '1234-123APPROVED'
   */

  private extractPropertyValues(data: any, properties: string[]): string {
    return properties
      .map((propertyPath) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const value = this.getNestedValue(data, propertyPath);
        return value !== undefined && value !== null ? String(value) : '';
      })
      .join('');
  }

  /**
   * Gets a nested value from an object using a dot-notation path
   * Example: getNestedValue({transaction: {id: '123'}}, 'transaction.id') => '123'
   */

  private getNestedValue(obj: any, path: string): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
