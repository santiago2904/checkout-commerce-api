/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from '@infrastructure/config/i18n';

/**
 * JWT Exception Filter
 * Catches JWT-related errors and returns translated messages
 * Handles: TokenExpiredError, JsonWebTokenError, and generic Unauthorized errors
 */
@Catch()
export class JwtExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(I18nService)
    private readonly i18nService: I18nService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check if it's a JWT-related error
    if (exception?.name === 'TokenExpiredError') {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.tokenExpired'),
        error: 'Unauthorized',
      });
    }

    if (exception?.name === 'JsonWebTokenError') {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.invalidToken'),
        error: 'Unauthorized',
      });
    }

    if (exception?.name === 'NotBeforeError') {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.invalidToken'),
        error: 'Unauthorized',
      });
    }

    // Check if it's UnauthorizedException from Passport
    if (
      exception?.status === HttpStatus.UNAUTHORIZED ||
      exception?.response?.statusCode === HttpStatus.UNAUTHORIZED
    ) {
      // If message contains 'No auth token' or similar, use noToken translation
      const originalMessage =
        exception?.message || exception?.response?.message || '';
      if (
        typeof originalMessage === 'string' &&
        originalMessage.toLowerCase().includes('no auth token')
      ) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: this.i18nService.translate('auth.jwt.errors.noToken'),
          error: 'Unauthorized',
        });
      }

      // Generic unauthorized (could be token expired caught by Passport)
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.unauthorized'),
        error: 'Unauthorized',
      });
    }

    // If it's not a JWT error, let it pass through to next filter
    throw exception;
  }
}
