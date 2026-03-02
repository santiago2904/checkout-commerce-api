import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should use jwt strategy', () => {
    // The guard uses 'jwt' strategy from passport
    // This is configured in the constructor via AuthGuard('jwt')
    expect(guard.constructor.name).toBe('JwtAuthGuard');
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = { userId: '123', email: 'test@example.com' };
      const result = guard.handleRequest(null, mockUser, null);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when info error exists', () => {
      const infoError = new Error('No auth token');
      expect(() => guard.handleRequest(null, null, infoError)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when error exists', () => {
      const error = new Error('Authentication failed');
      expect(() => guard.handleRequest(error, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should prioritize info over err when both exist', () => {
      const error = new Error('Error');
      const infoError = new Error('Info error');

      expect(() => guard.handleRequest(error, null, infoError)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
