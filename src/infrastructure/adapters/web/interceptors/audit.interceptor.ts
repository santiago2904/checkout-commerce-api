import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { IAuditLogRepository } from '@application/ports/out';
import { AUDIT_LOG_REPOSITORY } from '@application/tokens';
import { AUDIT_KEY } from '@infrastructure/adapters/web/decorators/audit.decorator';
import {
  AUDIT_CATEGORIES,
  getActionCategory,
} from '@infrastructure/adapters/web/constants/audit-actions.constants';
import { extractRealIp } from '@infrastructure/adapters/web/utils';

interface RequestUser {
  userId?: string;
  email?: string;
  roleId?: string;
  roleName?: string;
  customer?: { id: string };
}

interface AuditRequest {
  user?: RequestUser;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  ip?: string;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
}

interface AuditResponse {
  data?: {
    user?: { id: string; roleName?: string };
    transactionId?: string;
    amount?: number;
    status?: string;
  };
}

/**
 * Audit Interceptor
 * Automatically logs actions to the audit_logs table
 *
 * Features:
 * - Extracts userId from JWT token in request
 * - Extracts roleName from user object
 * - Logs action marked with @Audit decorator
 * - Runs asynchronously (fire and forget)
 * - Does not block the response
 *
 * Usage:
 * Apply globally in main.ts or per-controller
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Get the action from @Audit decorator metadata
    const action = this.reflector.get<string>(AUDIT_KEY, context.getHandler());

    // If no @Audit decorator, skip auditing
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user; // Injected by JWT strategy (may be undefined for public endpoints)

    // Execute the handler and audit after successful execution
    return next.handle().pipe(
      tap({
        next: (response) => {
          // Fire and forget: audit asynchronously without blocking response
          // Pass response to extract userId for public endpoints (register/login)
          void this.auditAsync(
            user,
            action,
            request,
            response as AuditResponse,
          );
        },
        error: (error) => {
          // Log audit even on errors (optional)
          this.logger.warn(
            `Action ${action} failed but will still be audited: ${error.message}`,
          );

          void this.auditAsync(user, action, request, undefined, error);
        },
      }),
    );
  }

  /**
   * Audit asynchronously (fire and forget)
   * Does not block the HTTP response
   */

  private async auditAsync(
    user: RequestUser | undefined,
    action: string,
    request: AuditRequest,
    response?: AuditResponse,
    error?: Error,
  ): Promise<void> {
    try {
      // Extract user information
      // For authenticated endpoints: use request.user (from JWT strategy)
      // JWT strategy returns: { userId, email, roleId, roleName, customer }
      // For public endpoints (register/login): extract from response
      let userId: string = user?.userId || 'anonymous';
      let roleName: string = user?.roleName || 'UNKNOWN';

      // If no user in request, try to extract from response (for register/login)
      if (!user && response?.data?.user) {
        userId = response.data.user.id;
        roleName = response.data.user.roleName || 'CUSTOMER';
      }

      // Build metadata
      const metadata: Record<string, unknown> = {
        ip: extractRealIp(request),
        userAgent: request.headers?.['user-agent'],
        method: request.method,
        url: request.url,
      };

      // Include error information if present
      if (error) {
        metadata.error = {
          message: error.message,
          name: error.name,
        };
      }

      // Get action category and apply category-specific metadata
      const category = getActionCategory(action);

      if (category) {
        const categoryConfig = AUDIT_CATEGORIES[category];

        // Include email for actions in AUTH category
        if (categoryConfig.includeEmail) {
          metadata.email = request.body?.email;
        }

        // Include transaction data for CHECKOUT category
        if (categoryConfig.includeTransactionData && response?.data) {
          metadata.transactionId = response.data.transactionId;
          metadata.amount = response.data.amount;
          metadata.status = response.data.status;
        }

        // Include target user ID for ADMIN category
        if (categoryConfig.includeTargetUserId) {
          metadata.targetUserId =
            (request.params?.id as string) || (request.body?.userId as string);
        }
      }

      // Save audit log
      await this.auditLogRepository.create({
        userId,
        roleName,
        action,
        timestamp: new Date(),
        metadata,
      });

      this.logger.log(`Audit: ${action} by ${userId} (${roleName})`);
    } catch (auditError) {
      // Log audit failure but don't throw (to avoid breaking the main request)
      this.logger.error(
        `Failed to create audit log for action ${action}: ${auditError.message}`,
        auditError.stack,
      );
    }
  }
}
