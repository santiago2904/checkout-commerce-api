import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  UseInterceptors,
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
import { I18nService } from '@infrastructure/config/i18n';
import type { SupportedLanguage } from '@infrastructure/config/i18n';
import { Lang } from '@infrastructure/adapters/web/decorators/lang.decorator';
import { Audit } from '@infrastructure/adapters/web/decorators/audit.decorator';
import { AuditInterceptor } from '@infrastructure/adapters/web/interceptors/audit.interceptor';
import { AUDIT_ACTIONS } from '@infrastructure/adapters/web/constants';

/**
 * Authentication Controller
 * Handles user authentication endpoints
 */
@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Audit(AUDIT_ACTIONS.USER_REGISTER)
  async register(
    @Body() registerDto: RegisterDto,
    @Lang() lang: SupportedLanguage,
  ) {
    const result = await this.registerUserUseCase.execute(registerDto);

    return result.fold(
      // Success case
      (data) => ({
        statusCode: HttpStatus.CREATED,
        message: this.i18n.t('auth.register.success', lang),
        data,
      }),
      // Error case
      (error) => {
        if (error instanceof EmailAlreadyExistsError) {
          throw new ConflictException(
            this.i18n.t('auth.register.errors.emailExists', lang),
          );
        }
        if (error instanceof RoleNotFoundError) {
          throw new BadRequestException(
            this.i18n.t('auth.register.errors.roleNotFound', lang),
          );
        }
        if (error instanceof UserCreationError) {
          throw new BadRequestException(
            this.i18n.t('auth.register.errors.userCreation', lang),
          );
        }
        if (error instanceof CustomerCreationError) {
          throw new BadRequestException(
            this.i18n.t('auth.register.errors.customerCreation', lang),
          );
        }
        // Fallback for unknown errors
        throw new BadRequestException(
          this.i18n.t('auth.register.errors.failed', lang),
        );
      },
    );
  }

  /**
   * Login with email and password
   * POST /auth/login
   */
  @Post('login')
  @Audit(AUDIT_ACTIONS.USER_LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Lang() lang: SupportedLanguage) {
    const result = await this.loginUseCase.execute(loginDto);

    return result.fold(
      // Success case
      (data) => ({
        statusCode: HttpStatus.OK,
        message: this.i18n.t('auth.login.success', lang),
        data,
      }),
      // Error case
      (error) => {
        if (
          error instanceof InvalidCredentialsError ||
          error instanceof UserNotFoundError
        ) {
          throw new UnauthorizedException(
            this.i18n.t('auth.login.errors.invalidCredentials', lang),
          );
        }
        // Fallback for unknown errors
        throw new UnauthorizedException(
          this.i18n.t('auth.login.errors.failed', lang),
        );
      },
    );
  }
}
