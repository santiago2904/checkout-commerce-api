import { User } from '@infrastructure/adapters/database/typeorm/entities/user.entity';

/**
 * Authentication Repository Port (Output Port)
 * Defines the contract for user data persistence operations
 */
export interface IAuthRepository {
  /**
   * Find a user by email
   * @param email User email
   * @returns User if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by ID
   * @param id User ID
   * @returns User if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Created user
   */
  create(userData: {
    email: string;
    password: string;
    roleId: string;
  }): Promise<User>;

  /**
   * Check if email already exists
   * @param email Email to check
   * @returns True if exists, false otherwise
   */
  emailExists(email: string): Promise<boolean>;
}
