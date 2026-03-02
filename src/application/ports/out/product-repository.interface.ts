import { Product } from '@infrastructure/adapters/database/typeorm/entities';

/**
 * Product Repository Port (Output Port)
 * Defines the contract for product data access
 */
export interface IProductRepository {
  /**
   * Find all products with available stock
   */
  findAllWithStock(): Promise<Product[]>;

  findAll(): Promise<Product[]>;

  /**
   * Find product by id
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Update product stock
   * @param id Product id
   * @param quantity Quantity to subtract from stock
   */
  updateStock(id: string, quantity: number): Promise<void>;

  /**
   * Check if product has enough stock
   */
  hasStock(id: string, quantity: number): Promise<boolean>;
}
