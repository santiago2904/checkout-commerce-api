/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LoginUseCase, RegisterUserUseCase } from '@application/use-cases/auth';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  RoleNotFoundError,
  UserCreationError,
  CustomerCreationError,
} from '@application/use-cases/auth/auth.errors';
import { I18nService } from '@infrastructure/config/i18n';
import { Result } from '@application/utils';
import { AuditInterceptor } from '@infrastructure/adapters/web/interceptors/audit.interceptor';
import { RegisterDto } from '@/application/dtos';

describe('AuthController', () => {
  let controller: AuthController;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let registerUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let i18nService: jest.Mocked<I18nService>;

  const mockLoginUseCase = {
    execute: jest.fn(),
  };

  const mockRegisterUserUseCase = {
    execute: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUseCase,
          useValue: mockLoginUseCase,
        },
        {
          provide: RegisterUserUseCase,
          useValue: mockRegisterUserUseCase,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    })
      .overrideInterceptor(AuditInterceptor)
      .useValue({
        intercept: (context: ExecutionContext, next: CallHandler) =>
          next.handle(),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    loginUseCase = module.get(LoginUseCase);
    registerUserUseCase = module.get(RegisterUserUseCase);
    i18nService = module.get(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockRegisterResponse = {
      userId: 'user-123',
      email: 'test@example.com',
      roleName: 'CUSTOMER',
      accessToken: 'jwt-token-123',
    };

    it('should register a new user successfully', async () => {
      const successResult = Result.ok(mockRegisterResponse);
      mockRegisterUserUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.register(registerDto, 'es');

      expect(result).toEqual({
        statusCode: 201,
        message: 'auth.register.success',
        data: mockRegisterResponse,
      });
      expect(registerUserUseCase.execute).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException for EmailAlreadyExistsError', async () => {
      const errorResult = Result.fail(
        new EmailAlreadyExistsError('test@example.com'),
      );
      mockRegisterUserUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.register(registerDto, 'es')).rejects.toThrow(
        ConflictException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.register.errors.emailExists',
        'es',
      );
    });

    it('should throw BadRequestException for RoleNotFoundError', async () => {
      const errorResult = Result.fail(new RoleNotFoundError('CUSTOMER'));
      mockRegisterUserUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.register(registerDto, 'es')).rejects.toThrow(
        BadRequestException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.register.errors.roleNotFound',
        'es',
      );
    });

    it('should throw BadRequestException for UserCreationError', async () => {
      const errorResult = Result.fail(new UserCreationError('Database error'));
      mockRegisterUserUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.register(registerDto, 'es')).rejects.toThrow(
        BadRequestException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.register.errors.userCreation',
        'es',
      );
    });

    it('should throw BadRequestException for CustomerCreationError', async () => {
      const errorResult = Result.fail(
        new CustomerCreationError('Database error'),
      );
      mockRegisterUserUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.register(registerDto, 'es')).rejects.toThrow(
        BadRequestException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.register.errors.customerCreation',
        'es',
      );
    });

    it('should throw BadRequestException for unknown errors', async () => {
      const errorResult = Result.fail(new Error('Unknown error'));
      mockRegisterUserUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.register(registerDto, 'es')).rejects.toThrow(
        BadRequestException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.register.errors.failed',
        'es',
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockLoginResponse = {
      accessToken: 'jwt-token-123',
      userId: 'user-123',
      email: 'test@example.com',
      roleName: 'CUSTOMER',
    };

    it('should login successfully', async () => {
      const successResult = Result.ok(mockLoginResponse);
      mockLoginUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.login(loginDto, 'es');

      expect(result).toEqual({
        statusCode: 200,
        message: 'auth.login.success',
        data: mockLoginResponse,
      });
      expect(loginUseCase.execute).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for InvalidCredentialsError', async () => {
      const errorResult = Result.fail(
        new InvalidCredentialsError('Invalid password'),
      );
      mockLoginUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.login(loginDto, 'es')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.login.errors.invalidCredentials',
        'es',
      );
    });

    it('should throw UnauthorizedException for UserNotFoundError', async () => {
      const errorResult = Result.fail(
        new UserNotFoundError('test@example.com'),
      );
      mockLoginUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.login(loginDto, 'es')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.login.errors.invalidCredentials',
        'es',
      );
    });

    it('should throw UnauthorizedException for unknown errors', async () => {
      const errorResult = Result.fail(new Error('Database connection failed'));
      mockLoginUseCase.execute.mockResolvedValue(errorResult);

      await expect(controller.login(loginDto, 'es')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'auth.login.errors.failed',
        'es',
      );
    });

    it('should handle login with different languages', async () => {
      const successResult = Result.ok(mockLoginResponse);
      mockLoginUseCase.execute.mockResolvedValue(successResult);

      // Test with English
      await controller.login(loginDto, 'en');
      expect(i18nService.t).toHaveBeenCalledWith('auth.login.success', 'en');

      // Test with Spanish
      await controller.login(loginDto, 'es');
      expect(i18nService.t).toHaveBeenCalledWith('auth.login.success', 'es');
    });
  });
});
