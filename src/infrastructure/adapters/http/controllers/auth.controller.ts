import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { LoginUseCase, RegisterUserUseCase } from '@application/use-cases/auth';
import { LoginDto, RegisterDto } from '@application/dtos';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  RoleNotFoundError,
  UserCreationError,
  CustomerCreationError,
} from '@application/use-cases/auth/auth.errors';

/**
 * Authentication Controller
 * Handles user authentication endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.registerUserUseCase.execute(registerDto);

    return result.fold(
      // Success case
      (data) => ({
        statusCode: HttpStatus.CREATED,
        message: 'User registered successfully',
        data,
      }),
      // Error case
      (error) => {
        if (error instanceof EmailAlreadyExistsError) {
          throw new ConflictException(error.message);
        }
        if (error instanceof RoleNotFoundError) {
          throw new BadRequestException(error.message);
        }
        if (error instanceof UserCreationError) {
          throw new BadRequestException(error.message);
        }
        if (error instanceof CustomerCreationError) {
          throw new BadRequestException(error.message);
        }
        // Fallback for unknown errors
        throw new BadRequestException('Registration failed');
      },
    );
  }

  /**
   * Login with email and password
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.loginUseCase.execute(loginDto);

    return result.fold(
      // Success case
      (data) => ({
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data,
      }),
      // Error case
      (error) => {
        if (
          error instanceof InvalidCredentialsError ||
          error instanceof UserNotFoundError
        ) {
          throw new UnauthorizedException(error.message);
        }
        // Fallback for unknown errors
        throw new UnauthorizedException('Login failed');
      },
    );
  }
}
