import { TransactionItem } from '@infrastructure/adapters/database/typeorm/entities';

/**
 * TransactionItem Repository Port (Output Port)
 * Defines the contract for transaction item data access
 */
export interface ITransactionItemRepository {
  /**
   * Create transaction items in batch
   */
  createMany(items: Partial<TransactionItem>[]): Promise<TransactionItem[]>;

  /**
   * Find all items for a specific transaction
   */
  findByTransactionId(transactionId: string): Promise<TransactionItem[]>;

  /**
   * Find a single item by id
   */
  findById(id: string): Promise<TransactionItem | null>;
}
