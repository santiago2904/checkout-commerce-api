import { IHashService } from '@application/ports/auth';
import { BcryptHashService } from './bcrypt-hash.service';

describe('BcryptHashService', () => {
  let hashService: IHashService;

  beforeEach(() => {
    hashService = new BcryptHashService();
  });

  describe('hashPassword', () => {
    it('should hash a plain text password', async () => {
      const password = 'MySecurePassword123!';
      const hashedPassword = await hashService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'MySecurePassword123!';
      const hash1 = await hashService.hashPassword(password);
      const hash2 = await hashService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt uses salt
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = await hashService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.length).toBeGreaterThan(0);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'MySecurePassword123!';
      const hashedPassword = await hashService.hashPassword(password);
      const result = await hashService.comparePasswords(password, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'MySecurePassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await hashService.hashPassword(password);
      const result = await hashService.comparePasswords(wrongPassword, hashedPassword);

      expect(result).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const password = 'MySecurePassword123!';
      const invalidHash = 'invalid-hash';
      const result = await hashService.comparePasswords(password, invalidHash);

      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'MySecurePassword123!';
      const hashedPassword = await hashService.hashPassword(password);
      const result = await hashService.comparePasswords('mysecurepassword123!', hashedPassword);

      expect(result).toBe(false);
    });
  });
});
