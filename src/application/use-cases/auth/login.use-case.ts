import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '@application/ports/out';
import type { IHashService, ITokenService } from '@application/ports/auth';
import {
  AUTH_REPOSITORY,
  HASH_SERVICE,
  TOKEN_SERVICE,
} from '@application/tokens';
import { Result } from '@application/utils';
import { LoginDto } from '@application/dtos';
import { InvalidCredentialsError, UserNotFoundError } from './auth.errors';

/**
 * Response structure for successful login
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
  };
  accessToken: string;
}

/**
 * Login Use Case
 * Handles user authentication with email and password
 * Implements Railway Oriented Programming (ROP) pattern
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(HASH_SERVICE)
    private readonly hashService: IHashService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * Execute the login use case
   * @param loginDto Login credentials
   * @returns Result containing login response or error
   */
  async execute(
    loginDto: LoginDto,
  ): Promise<
    Result<LoginResponse, InvalidCredentialsError | UserNotFoundError>
  > {
    try {
      // Find user by email
      const user = await this.authRepository.findByEmail(loginDto.email);

      if (!user) {
        return Result.fail(new UserNotFoundError());
      }

      // Verify password
      const isPasswordValid = await this.hashService.comparePasswords(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        return Result.fail(new InvalidCredentialsError());
      }

      // Ensure role is loaded
      if (!user.role) {
        return Result.fail(new InvalidCredentialsError('User role not found'));
      }

      // Generate JWT token
      const accessToken = await this.tokenService.generateToken({
        sub: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
      });

      // Return successful result
      return Result.ok({
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
        },
        accessToken,
      });
    } catch {
      // Convert unexpected errors to InvalidCredentialsError for security
      return Result.fail(new InvalidCredentialsError());
    }
  }
}
