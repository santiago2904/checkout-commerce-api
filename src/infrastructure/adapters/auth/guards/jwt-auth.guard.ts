/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Protects routes requiring authentication
 * Uses JWT strategy to validate tokens
 * Intercepts JWT errors to provide better error messages
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Handle request and capture JWT-specific errors
   * This allows the exception filter to provide translated error messages
   */
  handleRequest(err: any, user: any, info: any) {
    // If there's an error or info about the error, wrap it in UnauthorizedException
    // The info parameter contains details like TokenExpiredError, JsonWebTokenError, etc.
    if (err || info) {
      // Wrap the error in UnauthorizedException so the JwtExceptionFilter can catch it
      // The error's name and message are preserved for specific handling in the filter
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const error = info || err;
      throw new UnauthorizedException(error);
    }

    return user;
  }
}
