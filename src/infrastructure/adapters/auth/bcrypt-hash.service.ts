import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHashService } from '@application/ports/auth';

/**
 * Bcrypt Hash Service
 * Implementation of IHashService using bcrypt library
 */
@Injectable()
export class BcryptHashService implements IHashService {
  private readonly saltRounds = 10;

  /**
   * Hash a plain text password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password Plain text password
   * @param hashedPassword Hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      // Invalid hash format
      return false;
    }
  }
}
