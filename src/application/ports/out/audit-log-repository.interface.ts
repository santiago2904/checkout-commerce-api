import { AuditLog } from '@infrastructure/adapters/database/typeorm/entities';

/**
 * AuditLog Repository Port (Output Port)
 * Defines the contract for audit log data access
 */
export interface IAuditLogRepository {
  /**
   * Create a new audit log entry
   */
  create(auditLog: Partial<AuditLog>): Promise<AuditLog>;

  /**
   * Find audit logs by user id
   */
  findByUserId(userId: string): Promise<AuditLog[]>;

  /**
   * Find audit logs by action
   */
  findByAction(action: string): Promise<AuditLog[]>;

  /**
   * Find recent audit logs (last N entries)
   */
  findRecent(limit: number): Promise<AuditLog[]>;
}
