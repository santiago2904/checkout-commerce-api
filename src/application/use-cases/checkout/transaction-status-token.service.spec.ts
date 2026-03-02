import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  TransactionStatusTokenService,
  TransactionStatusTokenPayload,
} from './transaction-status-token.service';

describe('TransactionStatusTokenService', () => {
  let service: TransactionStatusTokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionStatusTokenService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<TransactionStatusTokenService>(
      TransactionStatusTokenService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateStatusToken', () => {
    it('should generate a token with correct payload', async () => {
      const mockToken = 'mock.jwt.token';
      const mockSecret = 'test-secret';

      configService.get.mockReturnValue(mockSecret);
      jwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.generateStatusToken(
        'trans-123',
        'test@example.com',
      );

      expect(result).toBe(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          transactionId: 'trans-123',
          email: 'test@example.com',
        },
        {
          expiresIn: '24h',
          secret: mockSecret,
        },
      );
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use correct expiration time', async () => {
      const mockSecret = 'test-secret';
      configService.get.mockReturnValue(mockSecret);
      jwtService.signAsync.mockResolvedValue('token');

      await service.generateStatusToken('trans-123', 'test@example.com');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          expiresIn: '24h',
        }),
      );
    });
  });

  describe('verifyStatusToken', () => {
    it('should verify and decode a valid token', async () => {
      const mockPayload: TransactionStatusTokenPayload = {
        transactionId: 'trans-123',
        email: 'test@example.com',
      };
      const mockSecret = 'test-secret';

      configService.get.mockReturnValue(mockSecret);
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.verifyStatusToken('valid.jwt.token');

      expect(result).toEqual(mockPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', {
        secret: mockSecret,
      });
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should throw error for invalid token', async () => {
      const mockSecret = 'test-secret';
      configService.get.mockReturnValue(mockSecret);
      jwtService.verifyAsync.mockRejectedValue(
        new Error('jwt malformed'),
      );

      await expect(
        service.verifyStatusToken('invalid.token'),
      ).rejects.toThrow('Invalid or expired status token');
    });

    it('should throw error for expired token', async () => {
      const mockSecret = 'test-secret';
      configService.get.mockReturnValue(mockSecret);
      jwtService.verifyAsync.mockRejectedValue(
        new Error('jwt expired'),
      );

      await expect(
        service.verifyStatusToken('expired.token'),
      ).rejects.toThrow('Invalid or expired status token');
    });

    it('should include original error message in thrown error', async () => {
      const mockSecret = 'test-secret';
      const originalError = new Error('specific jwt error');
      configService.get.mockReturnValue(mockSecret);
      jwtService.verifyAsync.mockRejectedValue(originalError);

      await expect(
        service.verifyStatusToken('bad.token'),
      ).rejects.toThrow('Invalid or expired status token: specific jwt error');
    });
  });
});
