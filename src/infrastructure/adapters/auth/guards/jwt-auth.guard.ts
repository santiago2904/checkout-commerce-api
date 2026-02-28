/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
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
    // If there's an error or info about the error, throw it
    // The info parameter contains details like TokenExpiredError, JsonWebTokenError, etc.
    if (err || info) {
      // Throw the info error (which contains TokenExpiredError, etc.)
      // or the err if info is not available
      throw info || err;
    }

    return user;
  }
}
