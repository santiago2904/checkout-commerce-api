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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return user information for valid payload', () => {
      const payload: JwtPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
        roleName: 'CUSTOMER',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roleId: payload.roleId,
        roleName: payload.roleName,
      });
    });

    it('should throw UnauthorizedException if sub is missing', () => {
      const payload = {
        email: 'test@example.com',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
        roleName: 'CUSTOMER',
      } as JwtPayload;

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email is missing', () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
        roleName: 'CUSTOMER',
      } as JwtPayload;

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if roleId is missing', () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roleName: 'CUSTOMER',
      } as JwtPayload;

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if roleName is missing', () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roleId: '123e4567-e89b-12d3-a456-426614174001',
      } as JwtPayload;

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });
  });
});
