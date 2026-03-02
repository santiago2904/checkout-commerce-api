import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService, JwtPayload } from '@application/ports/auth';

/**
 * JWT Token Service
 * Implementation of ITokenService using @nestjs/jwt
 */
@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generate a JWT token from payload
   * @param payload JWT payload containing user information
   * @returns JWT token string
   */
  async generateToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  /**
   * Verify and decode a JWT token
   * @param token JWT token to verify
   * @returns Decoded payload
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
