/**
 * Hash Service Port
 * Interface for password hashing operations
 */
export interface IHashService {
  /**
   * Hash a plain text password
   * @param password Plain text password
   * @returns Hashed password
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Compare a plain text password with a hashed password
   * @param password Plain text password
   * @param hashedPassword Hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  comparePasswords(password: string, hashedPassword: string): Promise<boolean>;
}
