import { Transaction } from '@infrastructure/adapters/database/typeorm/entities';
import { TransactionStatus } from '@domain/enums';

/**
 * Transaction Repository Port (Output Port)
 * Defines the contract for transaction data access
 */
export interface ITransactionRepository {
  /**
   * Create a new transaction
   */
  create(transaction: Partial<Transaction>): Promise<Transaction>;

  /**
   * Find transaction by id
   */
  findById(id: string): Promise<Transaction | null>;

  /**
   * Find transaction by transaction number
   */
  findByNumber(transactionNumber: string): Promise<Transaction | null>;

  /**
   * Find transaction by reference
   */
  findByReference(reference: string): Promise<Transaction | null>;

  /**
   * Update transaction status
   */
  updateStatus(
    id: string,
    status: TransactionStatus,
    wompiTransactionId?: string,
    wompiReference?: string,
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void>;

  /**
   * Find all transactions by customer id
   */
  findByCustomerId(customerId: string): Promise<Transaction[]>;

  /**
   * Find all pending transactions
   */
  findPending(): Promise<Transaction[]>;
}
