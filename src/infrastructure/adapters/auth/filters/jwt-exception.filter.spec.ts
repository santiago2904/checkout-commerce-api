import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import { JwtExceptionFilter } from './jwt-exception.filter';
import { I18nService } from '@infrastructure/config/i18n';
import { ArgumentsHost } from '@nestjs/common';

describe('JwtExceptionFilter', () => {
  let filter: JwtExceptionFilter;
  let i18nService: jest.Mocked<I18nService>;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };

  beforeEach(() => {
    // Mock I18nService
    i18nService = {
      translate: jest.fn((key: string) => `translated.${key}`),
    } as jest.Mocked<I18nService>;

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ArgumentsHost;

    filter = new JwtExceptionFilter(i18nService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle TokenExpiredError', () => {
      const exception = new UnauthorizedException({
        name: 'TokenExpiredError',
        message: 'jwt expired',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'translated.auth.jwt.errors.tokenExpired',
        error: 'Unauthorized',
      });
    });

    it('should handle JsonWebTokenError', () => {
      const exception = new UnauthorizedException({
        name: 'JsonWebTokenError',
        message: 'invalid token',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'translated.auth.jwt.errors.invalidToken',
        error: 'Unauthorized',
      });
    });

    it('should handle NotBeforeError', () => {
      const exception = new UnauthorizedException({
        name: 'NotBeforeError',
        message: 'jwt not active',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'translated.auth.jwt.errors.invalidToken',
        error: 'Unauthorized',
      });
    });

    it('should handle "No auth token" error', () => {
      const exception = new UnauthorizedException(new Error('No auth token'));

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'translated.auth.jwt.errors.noToken',
        error: 'Unauthorized',
      });
    });

    it('should handle "no authorization" error', () => {
      const exception = new UnauthorizedException(
        new Error('No authorization header'),
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'translated.auth.jwt.errors.noToken',
        error: 'Unauthorized',
      });
    });

    it('should handle generic UnauthorizedException', () => {
      const exception = new UnauthorizedException('Generic unauthorized');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'translated.auth.jwt.errors.unauthorized',
        error: 'Unauthorized',
      });
    });

    it('should handle exception with nested error in response', () => {
      const tokenExpiredError = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      };

      const exception = new UnauthorizedException();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (exception as any).response = {
        message: tokenExpiredError,
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'translated.auth.jwt.errors.tokenExpired',
        error: 'Unauthorized',
      });
    });
  });
});
