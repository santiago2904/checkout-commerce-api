/**
 * JWT Payload structure
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roleId: string;
  roleName: string;
}

/**
 * Token Service Port
 * Interface for JWT token operations
 */
export interface ITokenService {
  /**
   * Generate a JWT token from payload
   * @param payload JWT payload containing user information
   * @returns JWT token string
   */
  generateToken(payload: JwtPayload): Promise<string>;

  /**
   * Verify and decode a JWT token
   * @param token JWT token to verify
   * @returns Decoded payload
   */
  verifyToken(token: string): Promise<JwtPayload>;
}
