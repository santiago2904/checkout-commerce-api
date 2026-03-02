import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';

/**
 * Delivery Entity
 * Represents a delivery order for a customer
 */
@Entity('deliveries')
export class Delivery extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 255 })
  recipientName: string;

  @Column({ type: 'varchar', length: 50 })
  recipientPhone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  trackingNumber: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  estimatedDelivery: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDelivery: Date;

  @Column({ type: 'uuid', nullable: true })
  transactionId: string;

  // Guest checkout support: customer may be null for guest transactions
  @ManyToOne(() => Customer, { eager: true, nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;
}
