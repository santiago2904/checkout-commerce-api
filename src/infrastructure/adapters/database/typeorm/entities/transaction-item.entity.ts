import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Transaction } from './transaction.entity';
import { Product } from './product.entity';

/**
 * TransactionItem Entity
 * Represents an individual item within a transaction
 * Stores product snapshot at the time of purchase
 */
@Entity('transaction_items')
export class TransactionItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'int' })
  quantity: number;

  // Price at the time of purchase (snapshot)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  // Total for this item (quantity * unitPrice)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // Relations
  @ManyToOne(() => Transaction, (transaction) => transaction.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
