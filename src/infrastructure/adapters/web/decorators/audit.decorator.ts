import { SetMetadata } from '@nestjs/common';
import type { AuditAction } from '@infrastructure/adapters/web/constants/audit-actions.constants';

/**
 * Audit Decorator
 * Marks an endpoint to be audited
 *
 * @param action - The action to be logged (use AUDIT_ACTIONS constants)
 *
 * @example
 * ```typescript
 * import { AUDIT_ACTIONS } from '@infrastructure/adapters/web/constants/audit-actions.constants';
 *
 * @Post('register')
 * @Audit(AUDIT_ACTIONS.USER_REGISTER)
 * async register(@Body() dto: RegisterDto) {
 *   // ...
 * }
 * ```
 */
export const AUDIT_KEY = 'audit_action';
export const Audit = (action: AuditAction) => SetMetadata(AUDIT_KEY, action);
