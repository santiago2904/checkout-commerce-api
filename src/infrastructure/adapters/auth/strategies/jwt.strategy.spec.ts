import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from '@application/ports/auth';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret-key';
      return null;
    }),
  };

  const mockCustomerRepository = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'ICustomerRepository',
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return user information for valid payload', async () => {
      const payload: JwtPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
        roleName: 'CUSTOMER',
      };

      mockCustomerRepository.findByUserId.mockResolvedValue({
        id: 'customer-123',
      });

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roleId: payload.roleId,
        roleName: payload.roleName,
        customer: {
          id: 'customer-123',
        },
      });
      expect(mockCustomerRepository.findByUserId).toHaveBeenCalledWith(
        payload.sub,
      );
    });

    it('should throw UnauthorizedException if sub is missing', async () => {
      const payload = {
        email: 'test@example.com',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
        roleName: 'CUSTOMER',
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if email is missing', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
        roleName: 'CUSTOMER',
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if roleId is missing', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roleName: 'CUSTOMER',
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if roleName is missing', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
