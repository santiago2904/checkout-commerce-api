import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from '@infrastructure/config/i18n';

/**
 * JWT Exception Filter
 * Catches JWT-related errors and returns translated messages
 * Handles: TokenExpiredError, JsonWebTokenError, and generic Unauthorized errors
 */
@Catch(UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(I18nService)
    private readonly i18nService: I18nService,
  ) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Extract the original error from UnauthorizedException
    // The error can be in exception.getResponse() (when passed to UnauthorizedException constructor)
    // or in exception itself
    let originalError: { name?: string; message?: string } = {};

    const exceptionResponse = exception.getResponse();
    if (exceptionResponse) {
      // If response.message exists and is an object, use that
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse &&
        typeof exceptionResponse.message === 'object'
      ) {
        originalError = exceptionResponse.message as {
          name?: string;
          message?: string;
        };
      } else if (typeof exceptionResponse === 'object') {
        originalError = exceptionResponse as {
          name?: string;
          message?: string;
        };
      }
    } else {
      originalError = exception as unknown as {
        name?: string;
        message?: string;
      };
    }

    // Check if it's a JWT-related error by examining the original error's name
    if (originalError?.name === 'TokenExpiredError') {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.tokenExpired'),
        error: 'Unauthorized',
      });
    }

    if (originalError?.name === 'JsonWebTokenError') {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.invalidToken'),
        error: 'Unauthorized',
      });
    }

    if (originalError?.name === 'NotBeforeError') {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.invalidToken'),
        error: 'Unauthorized',
      });
    }

    // Check if message contains 'No auth token' or similar
    const exceptionResp = exception.getResponse();
    const responseMessage =
      typeof exceptionResp === 'object' &&
      exceptionResp &&
      'message' in exceptionResp
        ? exceptionResp.message
        : '';
    const errorMessage =
      originalError?.message ||
      exception?.message ||
      (typeof responseMessage === 'string' ? responseMessage : '') ||
      '';

    if (
      typeof errorMessage === 'string' &&
      (errorMessage.toLowerCase().includes('no auth token') ||
        errorMessage.toLowerCase().includes('no authorization'))
    ) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: this.i18nService.translate('auth.jwt.errors.noToken'),
        error: 'Unauthorized',
      });
    }

    // Generic unauthorized error
    return response.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: this.i18nService.translate('auth.jwt.errors.unauthorized'),
      error: 'Unauthorized',
    });
  }
}
