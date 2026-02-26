import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * Base Entity with automatic timestamps and soft delete support
 * All domain entities should extend from this class
 * 
 * Features:
 * - createdAt: Automatically set when entity is created
 * - updatedAt: Automatically updated when entity is modified
 * - deletedAt: Soft delete support (entity marked as deleted without removal)
 */
export abstract class BaseEntity {
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;
}
