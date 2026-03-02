import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@infrastructure/adapters/web/decorators/public.decorator';

/**
 * JWT Authentication Guard
 * Protects routes requiring authentication
 * Uses JWT strategy to validate tokens
 * Intercepts JWT errors to provide better error messages
 * Respects @Public() decorator to allow unauthenticated access
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Check if route is public before authenticating
   * Routes marked with @Public() decorator bypass authentication
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Handle request and capture JWT-specific errors
   * This allows the exception filter to provide translated error messages
   */

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: unknown,
    info: Error | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _status?: unknown,
  ): TUser {
    // If there's an error or info about the error, wrap it in UnauthorizedException
    // The info parameter contains details like TokenExpiredError, JsonWebTokenError, etc.
    if (err || info) {
      // Wrap the error in UnauthorizedException so the JwtExceptionFilter can catch it
      // The error's name and message are preserved for specific handling in the filter

      const error = info || err;
      throw new UnauthorizedException(error);
    }

    return user as TUser;
  }
}
