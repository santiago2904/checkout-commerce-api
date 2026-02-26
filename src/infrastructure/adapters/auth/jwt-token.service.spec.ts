import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtTokenService } from './jwt-token.service';
import { JwtPayload } from '@application/ports/auth';

describe('JwtTokenService', () => {
  let tokenService: JwtTokenService;
  let jwtService: JwtService;

  const mockPayload: JwtPayload = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    roleId: '123e4567-e89b-12d3-a456-426614174001',
    roleName: 'CUSTOMER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret-key',
                JWT_EXPIRES_IN: '1d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    tokenService = module.get<JwtTokenService>(JwtTokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('generateToken', () => {
    it('should generate a JWT token', async () => {
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const signAsyncSpy = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue(expectedToken);

      const token = await tokenService.generateToken(mockPayload);

      expect(token).toBe(expectedToken);
      expect(signAsyncSpy).toHaveBeenCalledWith(mockPayload);
    });

    it('should include all required fields in payload', async () => {
      const expectedToken = 'token';
      const signAsyncSpy = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue(expectedToken);

      await tokenService.generateToken(mockPayload);

      expect(signAsyncSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockPayload.sub,
          email: mockPayload.email,
          roleId: mockPayload.roleId,
          roleName: mockPayload.roleName,
        }),
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', async () => {
      const token = 'valid.jwt.token';
      const verifyAsyncSpy = jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue(mockPayload);

      const result = await tokenService.verifyToken(token);

      expect(result).toEqual(mockPayload);
      expect(verifyAsyncSpy).toHaveBeenCalledWith(token);
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid.token';
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Invalid token'));

      await expect(tokenService.verifyToken(token)).rejects.toThrow();
    });

    it('should throw error for expired token', async () => {
      const token = 'expired.token';
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Token expired'));

      await expect(tokenService.verifyToken(token)).rejects.toThrow();
    });
  });
});
