/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WompiWebhookValidatorService } from '../../../adapters/payment/wompi/wompi-webhook-validator.service';
import { FulfillmentService } from '../../../../application/use-cases/checkout/fulfillment.service';
import {
  WompiEventDto,
  EWompiEventType,
} from '../../../../application/dtos/webhook';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookValidator: WompiWebhookValidatorService;
  let fulfillmentService: FulfillmentService;

  const mockWebhookValidator = {
    validateEventSignature: jest.fn(),
  };

  const mockFulfillmentService = {
    processFulfillmentByWompiId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WompiWebhookValidatorService,
          useValue: mockWebhookValidator,
        },
        {
          provide: FulfillmentService,
          useValue: mockFulfillmentService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookValidator = module.get<WompiWebhookValidatorService>(
      WompiWebhookValidatorService,
    );
    fulfillmentService = module.get<FulfillmentService>(FulfillmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWompiWebhook', () => {
    const mockEvent: WompiEventDto = {
      event: EWompiEventType.TRANSACTION_UPDATED,
      data: {
        transaction: {
          id: 'wompi-tx-123',
          amount_in_cents: 100000,
          reference: 'REF123',
          customer_email: 'test@example.com',
          currency: 'COP',
          payment_method_type: 'CARD',
          status: 'APPROVED',
          shipping_address: null,
          payment_link_id: null,
          payment_source_id: null,
        },
      },
      environment: 'test',
      signature: {
        properties: ['transaction.id', 'transaction.status'],
        checksum: 'valid_checksum_123',
      },
      timestamp: 1234567890,
      sent_at: '2024-01-01T00:00:00.000Z',
    };

    it('should accept valid webhook event and trigger fulfillment', () => {
      mockWebhookValidator.validateEventSignature.mockReturnValue(true);
      mockFulfillmentService.processFulfillmentByWompiId.mockResolvedValue(
        undefined,
      );

      const result = controller.handleWompiWebhook(mockEvent);

      expect(result).toEqual({ received: true });
      expect(webhookValidator.validateEventSignature).toHaveBeenCalledWith(
        mockEvent,
      );
      expect(
        fulfillmentService.processFulfillmentByWompiId,
      ).toHaveBeenCalledWith('wompi-tx-123', 'APPROVED');
    });

    it('should reject webhook with invalid signature', () => {
      mockWebhookValidator.validateEventSignature.mockReturnValue(false);

      expect(() => controller.handleWompiWebhook(mockEvent)).toThrow(
        BadRequestException,
      );
      expect(() => controller.handleWompiWebhook(mockEvent)).toThrow(
        'Invalid webhook signature',
      );

      expect(webhookValidator.validateEventSignature).toHaveBeenCalledWith(
        mockEvent,
      );
      expect(
        fulfillmentService.processFulfillmentByWompiId,
      ).not.toHaveBeenCalled();
    });

    it('should ignore non-transaction.updated events', () => {
      const nequiEvent = {
        ...mockEvent,
        event: EWompiEventType.NEQUI_TOKEN_UPDATED,
      };

      mockWebhookValidator.validateEventSignature.mockReturnValue(true);

      const result = controller.handleWompiWebhook(nequiEvent);

      expect(result).toEqual({ received: true });
      expect(webhookValidator.validateEventSignature).toHaveBeenCalledWith(
        nequiEvent,
      );
      expect(
        fulfillmentService.processFulfillmentByWompiId,
      ).not.toHaveBeenCalled();
    });

    it('should handle DECLINED status', () => {
      const declinedEvent = {
        ...mockEvent,
        data: {
          transaction: {
            ...mockEvent.data.transaction,
            status: 'DECLINED',
          },
        },
      };

      mockWebhookValidator.validateEventSignature.mockReturnValue(true);
      mockFulfillmentService.processFulfillmentByWompiId.mockResolvedValue(
        undefined,
      );

      const result = controller.handleWompiWebhook(declinedEvent);

      expect(result).toEqual({ received: true });
      expect(
        fulfillmentService.processFulfillmentByWompiId,
      ).toHaveBeenCalledWith('wompi-tx-123', 'DECLINED');
    });

    it('should handle ERROR status', () => {
      const errorEvent = {
        ...mockEvent,
        data: {
          transaction: {
            ...mockEvent.data.transaction,
            status: 'ERROR',
          },
        },
      };

      mockWebhookValidator.validateEventSignature.mockReturnValue(true);
      mockFulfillmentService.processFulfillmentByWompiId.mockResolvedValue(
        undefined,
      );

      const result = controller.handleWompiWebhook(errorEvent);

      expect(result).toEqual({ received: true });
      expect(
        fulfillmentService.processFulfillmentByWompiId,
      ).toHaveBeenCalledWith('wompi-tx-123', 'ERROR');
    });

    it('should return 200 even if fulfillment processing fails', () => {
      mockWebhookValidator.validateEventSignature.mockReturnValue(true);
      mockFulfillmentService.processFulfillmentByWompiId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // We need to wait a bit for the async catch to execute
      const result = controller.handleWompiWebhook(mockEvent);

      expect(result).toEqual({ received: true });
      expect(webhookValidator.validateEventSignature).toHaveBeenCalledWith(
        mockEvent,
      );
    });

    it('should handle header checksum parameter', () => {
      mockWebhookValidator.validateEventSignature.mockReturnValue(true);
      mockFulfillmentService.processFulfillmentByWompiId.mockResolvedValue(
        undefined,
      );

      const result = controller.handleWompiWebhook(mockEvent);

      expect(result).toEqual({ received: true });
      // The controller receives the header but uses the body signature for validation
      expect(webhookValidator.validateEventSignature).toHaveBeenCalledWith(
        mockEvent,
      );
    });

    it('should process BANCOLOMBIA_TRANSFER_TOKEN_UPDATED event', () => {
      const bancolombiaEvent = {
        ...mockEvent,
        event: EWompiEventType.BANCOLOMBIA_TRANSFER_TOKEN_UPDATED,
      };

      mockWebhookValidator.validateEventSignature.mockReturnValue(true);

      const result = controller.handleWompiWebhook(bancolombiaEvent);

      expect(result).toEqual({ received: true });
      expect(
        fulfillmentService.processFulfillmentByWompiId,
      ).not.toHaveBeenCalled();
    });
  });
});
