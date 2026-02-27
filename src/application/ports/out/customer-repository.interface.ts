import { Customer } from '@infrastructure/adapters/database/typeorm/entities/customer.entity';

/**
 * Customer Repository Port (Output Port)
 * Defines the contract for customer data persistence operations
 */
export interface ICustomerRepository {
  /**
   * Find a customer by user ID
   * @param userId User ID
   * @returns Customer if found, null otherwise
   */
  findByUserId(userId: string): Promise<Customer | null>;

  /**
   * Create a new customer
   * @param customerData Customer data to create
   * @returns Created customer
   */
  create(customerData: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    userId: string;
  }): Promise<Customer>;
}
