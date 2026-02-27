import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  IAuthRepository,
  ICustomerRepository,
} from '@application/ports/out';
import type { IHashService, ITokenService } from '@application/ports/auth';
import {
  AUTH_REPOSITORY,
  CUSTOMER_REPOSITORY,
  HASH_SERVICE,
  TOKEN_SERVICE,
} from '@application/tokens';
import { Result } from '@application/utils';
import { RegisterDto } from '@application/dtos';
import { RoleName } from '@domain/enums';
import { Role } from '@infrastructure/adapters/database/typeorm/entities/role.entity';
import {
  EmailAlreadyExistsError,
  RoleNotFoundError,
  UserCreationError,
  CustomerCreationError,
} from './auth.errors';

/**
 * Response structure for successful registration
 */
export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  accessToken: string;
}

/**
 * Register User Use Case
 * Handles new user registration with automatic customer profile creation
 * Implements Railway Oriented Programming (ROP) pattern
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(HASH_SERVICE)
    private readonly hashService: IHashService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Execute the registration use case
   * @param registerDto Registration data
   * @returns Result containing registration response or error
   */
  async execute(
    registerDto: RegisterDto,
  ): Promise<
    Result<
      RegisterResponse,
      | EmailAlreadyExistsError
      | RoleNotFoundError
      | UserCreationError
      | CustomerCreationError
    >
  > {
    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if email already exists
      const emailExists = await this.authRepository.emailExists(
        registerDto.email,
      );

      if (emailExists) {
        await queryRunner.rollbackTransaction();
        return Result.fail(new EmailAlreadyExistsError(registerDto.email));
      }

      // Find CUSTOMER role
      const customerRole = await queryRunner.manager.findOne(Role, {
        where: { name: RoleName.CUSTOMER },
      });

      if (!customerRole) {
        await queryRunner.rollbackTransaction();
        return Result.fail(new RoleNotFoundError(RoleName.CUSTOMER));
      }

      // Hash password
      const hashedPassword = await this.hashService.hashPassword(
        registerDto.password,
      );

      // Create user
      const user = await this.authRepository.create({
        email: registerDto.email,
        password: hashedPassword,
        roleId: customerRole.id,
      });

      if (!user) {
        await queryRunner.rollbackTransaction();
        return Result.fail(new UserCreationError());
      }

      // Create customer profile
      const customer = await this.customerRepository.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: '',
        address: '',
        city: '',
        country: '',
        userId: user.id,
      });

      if (!customer) {
        await queryRunner.rollbackTransaction();
        return Result.fail(new CustomerCreationError());
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Generate JWT token
      const accessToken = await this.tokenService.generateToken({
        sub: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: customerRole.name,
      });

      // Return successful result
      return Result.ok({
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          roleName: customerRole.name,
        },
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
        accessToken,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return Result.fail(
        new UserCreationError(
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    } finally {
      await queryRunner.release();
    }
  }
}
