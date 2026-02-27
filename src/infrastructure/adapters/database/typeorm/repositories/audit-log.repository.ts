import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities';
import { IAuditLogRepository } from '@application/ports/out';

/**
 * TypeORM AuditLog Repository
 * Implements IAuditLogRepository port
 */
@Injectable()
export class TypeOrmAuditLogRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create a new audit log entry
   */
  async create(auditLog: Partial<AuditLog>): Promise<AuditLog> {
    const newAuditLog = this.auditLogRepository.create(auditLog);
    return this.auditLogRepository.save(newAuditLog);
  }

  /**
   * Find audit logs by user id
   */
  async findByUserId(userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: {
        timestamp: 'DESC',
      },
    });
  }

  /**
   * Find audit logs by action
   */
  async findByAction(action: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: {
        timestamp: 'DESC',
      },
    });
  }

  /**
   * Find recent audit logs (last N entries)
   */
  async findRecent(limit: number): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: {
        timestamp: 'DESC',
      },
      take: limit,
    });
  }
}
