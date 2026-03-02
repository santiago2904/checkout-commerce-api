/* eslint-disable @typescript-eslint/no-require-imports */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WompiWebhookValidatorService } from './wompi-webhook-validator.service';
import {
  WompiEventDto,
  EWompiEventType,
} from '../../../../application/dtos/webhook';

describe('WompiWebhookValidatorService', () => {
  let service: WompiWebhookValidatorService;
  const mockEventsSecret = 'stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N';

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'wompi.eventsSecret') {
        return mockEventsSecret;
      }
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WompiWebhookValidatorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WompiWebhookValidatorService>(
      WompiWebhookValidatorService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateEventSignature', () => {
    it('should validate a correct signature', () => {
      // Example event from Wompi documentation
      const mockEvent: WompiEventDto = {
        event: EWompiEventType.TRANSACTION_UPDATED,
        data: {
          transaction: {
            id: '1234-1610641025-49201',
            amount_in_cents: 4490000,
            reference: 'MZQ3X2DE2SMX',
            customer_email: 'juan.perez@gmail.com',
            currency: 'COP',
            payment_method_type: 'NEQUI',
            redirect_url: 'https://mitienda.com.co/pagos/redireccion',
            status: 'APPROVED',
            shipping_address: null,
            payment_link_id: null,
            payment_source_id: null,
          },
        },
        environment: 'test',
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: '', // Will be calculated
        },
        timestamp: 1530291411,
        sent_at: '2018-07-20T16:45:05.000Z',
      };

      // Calculate the expected checksum manually
      // Concatenation: '1234-1610641025-49201' + 'APPROVED' + '4490000' + '1530291411' + secret
      const concatenated =
        '1234-1610641025-49201' +
        'APPROVED' +
        '4490000' +
        '1530291411' +
        mockEventsSecret;

      const crypto = require('crypto');
      const expectedChecksum = crypto
        .createHash('sha256')
        .update(concatenated)
        .digest('hex')
        .toUpperCase();

      mockEvent.signature.checksum = expectedChecksum;

      const result = service.validateEventSignature(mockEvent);
      expect(result).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const mockEvent: WompiEventDto = {
        event: EWompiEventType.TRANSACTION_UPDATED,
        data: {
          transaction: {
            id: '1234-1610641025-49201',
            amount_in_cents: 4490000,
            reference: 'MZQ3X2DE2SMX',
            customer_email: 'juan.perez@gmail.com',
            currency: 'COP',
            payment_method_type: 'NEQUI',
            redirect_url: 'https://mitienda.com.co/pagos/redireccion',
            status: 'APPROVED',
            shipping_address: null,
            payment_link_id: null,
            payment_source_id: null,
          },
        },
        environment: 'test',
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: 'INVALID_CHECKSUM_1234567890',
        },
        timestamp: 1530291411,
        sent_at: '2018-07-20T16:45:05.000Z',
      };

      const result = service.validateEventSignature(mockEvent);
      expect(result).toBe(false);
    });

    it('should handle case-insensitive checksum comparison', () => {
      const mockEvent: WompiEventDto = {
        event: EWompiEventType.TRANSACTION_UPDATED,
        data: {
          transaction: {
            id: 'test-123',
            amount_in_cents: 10000,
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
          checksum: '', // Will be set below
        },
        timestamp: 1234567890,
        sent_at: '2024-01-01T00:00:00.000Z',
      };

      const crypto = require('crypto');
      const concatenated =
        'test-123' + 'APPROVED' + '1234567890' + mockEventsSecret;
      const checksum = crypto
        .createHash('sha256')
        .update(concatenated)
        .digest('hex');

      // Test with lowercase checksum
      mockEvent.signature.checksum = checksum.toLowerCase();
      expect(service.validateEventSignature(mockEvent)).toBe(true);

      // Test with uppercase checksum
      mockEvent.signature.checksum = checksum.toUpperCase();
      expect(service.validateEventSignature(mockEvent)).toBe(true);
    });

    it('should handle errors gracefully', () => {
      const invalidEvent = {
        event: EWompiEventType.TRANSACTION_UPDATED,
        data: null, // Invalid data
        signature: {
          properties: ['transaction.id'],
          checksum: 'test',
        },
        timestamp: 1234567890,
      } as WompiEventDto;

      const result = service.validateEventSignature(invalidEvent);
      expect(result).toBe(false);
    });

    it('should correctly extract nested property values', () => {
      const mockEvent: WompiEventDto = {
        event: EWompiEventType.TRANSACTION_UPDATED,
        data: {
          transaction: {
            id: 'tx-456',
            amount_in_cents: 50000,
            reference: 'REF456',
            customer_email: 'customer@test.com',
            currency: 'COP',
            payment_method_type: 'PSE',
            status: 'DECLINED',
            shipping_address: null,
            payment_link_id: null,
            payment_source_id: null,
          },
        },
        environment: 'test',
        signature: {
          properties: [
            'transaction.id',
            'transaction.amount_in_cents',
            'transaction.reference',
          ],
          checksum: '',
        },
        timestamp: 9876543210,
        sent_at: '2024-02-01T00:00:00.000Z',
      };

      const crypto = require('crypto');
      const concatenated =
        'tx-456' + '50000' + 'REF456' + '9876543210' + mockEventsSecret;

      const expectedChecksum = crypto
        .createHash('sha256')
        .update(concatenated)
        .digest('hex')
        .toUpperCase();

      mockEvent.signature.checksum = expectedChecksum;

      const result = service.validateEventSignature(mockEvent);
      expect(result).toBe(true);
    });
  });
});
