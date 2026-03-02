import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  EWompiEventType,
  WompiEventDto,
} from '../../../../application/dtos/webhook';
import { WompiWebhookValidatorService } from '../../../adapters/payment/wompi/wompi-webhook-validator.service';
import { FulfillmentService } from '../../../../application/use-cases/checkout/fulfillment.service';
import { Public } from '../../../adapters/web/decorators/public.decorator';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookValidator: WompiWebhookValidatorService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  /**
   * Receives Wompi webhook events for transaction status updates
   * Endpoint: POST /webhooks/wompi
   *
   * This endpoint is called by Wompi when a transaction status changes.
   * It validates the event signature and triggers the fulfillment process.
   *
   * @returns HTTP 200 - Event received successfully
   * @returns HTTP 400 - Invalid signature or event type
   */
  @Public()
  @Post('wompi')
  @HttpCode(HttpStatus.OK)
  handleWompiWebhook(@Body() event: WompiEventDto): { received: boolean } {
    this.logger.log(
      `Webhook received: ${event.event} for transaction ${event.data.transaction.id}`,
    );

    // Validate event signature
    const isValid = this.webhookValidator.validateEventSignature(event);
    if (!isValid) {
      this.logger.warn(
        `Invalid webhook signature for transaction ${event.data.transaction.id}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    // Only process transaction.updated events
    if (event.event !== EWompiEventType.TRANSACTION_UPDATED) {
      this.logger.log(`Ignoring event type: ${event.event}`);
      return { received: true };
    }

    // Extract transaction status and ID
    const { id: wompiTransactionId, status } = event.data.transaction;

    this.logger.log(
      `Processing transaction ${wompiTransactionId} with status ${status}`,
    );

    // Trigger fulfillment process asynchronously
    // We don't await this to return 200 quickly to Wompi
    this.fulfillmentService
      .processFulfillmentByWompiId(wompiTransactionId, status)
      .catch((error) => {
        this.logger.error(
          `Error processing fulfillment for transaction ${wompiTransactionId}:`,
          error,
        );
      });

    // Return 200 immediately as per Wompi's requirements
    return { received: true };
  }
}
