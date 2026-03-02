import { Delivery } from '@infrastructure/adapters/database/typeorm/entities';

/**
 * Delivery Repository Port (Output Port)
 * Defines the contract for delivery data access
 */
export interface IDeliveryRepository {
  /**
   * Create a new delivery
   */
  create(delivery: Partial<Delivery>): Promise<Delivery>;

  /**
   * Find delivery by id
   */
  findById(id: string): Promise<Delivery | null>;

  /**
   * Find delivery by transaction id
   */
  findByTransactionId(transactionId: string): Promise<Delivery | null>;

  /**
   * Update delivery status
   */
  updateStatus(id: string, status: string): Promise<void>;
}
