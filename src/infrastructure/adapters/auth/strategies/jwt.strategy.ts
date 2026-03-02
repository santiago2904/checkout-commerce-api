import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@application/ports/auth';
import type { ICustomerRepository } from '@application/ports/out';
import { CUSTOMER_REPOSITORY } from '@application/tokens';

/**
 * JWT Strategy for Passport
 * Validates JWT tokens and extracts user information
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validate JWT payload and return user information
   * This method is called after the token is verified
   * @param payload Decoded JWT payload
   * @returns User information to be attached to request
   */
  async validate(payload: JwtPayload) {
    if (
      !payload.sub ||
      !payload.email ||
      !payload.roleId ||
      !payload.roleName
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Find customer associated with user (if exists)
    const customer = await this.customerRepository.findByUserId(payload.sub);

    return {
      userId: payload.sub,
      email: payload.email,
      roleId: payload.roleId,
      roleName: payload.roleName,
      customer: customer
        ? {
            id: customer.id,
          }
        : undefined,
    };
  }
}
