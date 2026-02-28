import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { TransactionStatus } from '@domain/enums';
import type { TransactionItem } from './transaction-item.entity';

/**
 * Transaction Entity
 * Represents a payment transaction in the system
 * Extended with Wompi integration fields
 */
@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  reference: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  // Payment method type: CARD, PSE, NEQUI, BANCOLOMBIA_TRANSFER, etc.
  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  // IP address of the device making the transaction
  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  // Wompi transaction ID for tracking
  @Column({ type: 'varchar', length: 255, nullable: true })
  wompiTransactionId: string | null;

  // Error code if transaction failed (422, 400, 401, etc.)
  @Column({ type: 'varchar', length: 50, nullable: true })
  errorCode: string | null;

  // Descriptive error message
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid' })
  customerId: string;

  // Transaction items (products purchased in this transaction)
  @OneToMany('TransactionItem', 'transaction', { cascade: true })
  items: TransactionItem[];
}
