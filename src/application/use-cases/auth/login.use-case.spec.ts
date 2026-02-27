import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from './login.use-case';
import { InvalidCredentialsError, UserNotFoundError } from './auth.errors';
import { IAuthRepository } from '@application/ports/out';
import { IHashService, ITokenService } from '@application/ports/auth';
import { LoginDto } from '@application/dtos';
import { RoleName } from '@domain/enums';
import { User } from '@infrastructure/adapters/database/typeorm/entities/user.entity';
import { Role } from '@infrastructure/adapters/database/typeorm/entities/role.entity';
import {
  AUTH_REPOSITORY,
  HASH_SERVICE,
  TOKEN_SERVICE,
} from '@application/tokens';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let authRepository: jest.Mocked<IAuthRepository>;
  let hashService: jest.Mocked<IHashService>;
  let tokenService: jest.Mocked<ITokenService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    roleId: '123e4567-e89b-12d3-a456-426614174001',
    role: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: RoleName.CUSTOMER,
    } as Role,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as User;

  beforeEach(async () => {
    // Create mocks
    const mockAuthRepository: Partial<IAuthRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      emailExists: jest.fn(),
    };

    const mockHashService: Partial<IHashService> = {
      hashPassword: jest.fn(),
      comparePasswords: jest.fn(),
    };

    const mockTokenService: Partial<ITokenService> = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: AUTH_REPOSITORY,
          useValue: mockAuthRepository,
        },
        {
          provide: HASH_SERVICE,
          useValue: mockHashService,
        },
        {
          provide: TOKEN_SERVICE,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    authRepository = module.get(AUTH_REPOSITORY);
    hashService = module.get(HASH_SERVICE);
    tokenService = module.get(TOKEN_SERVICE);
  });

  describe('execute', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUser);
      hashService.comparePasswords.mockResolvedValue(true);
      tokenService.generateToken.mockResolvedValue('jwt-token-123');

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          roleId: mockUser.roleId,
          roleName: mockUser.role.name,
        },
        accessToken: 'jwt-token-123',
      });
      const findByEmailSpy = authRepository.findByEmail;
      const comparePasswordsSpy = hashService.comparePasswords;
      const generateTokenSpy = tokenService.generateToken;
      expect(findByEmailSpy).toHaveBeenCalledWith(loginDto.email);
      expect(comparePasswordsSpy).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(generateTokenSpy).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        roleId: mockUser.roleId,
        roleName: mockUser.role.name,
      });
    });

    it('should fail when user is not found', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserNotFoundError);
      const comparePasswordsSpy = hashService.comparePasswords;
      const generateTokenSpy = tokenService.generateToken;
      expect(comparePasswordsSpy).not.toHaveBeenCalled();
      expect(generateTokenSpy).not.toHaveBeenCalled();
    });

    it('should fail when password is invalid', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUser);
      hashService.comparePasswords.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsError);
      const generateTokenSpy = tokenService.generateToken;
      expect(generateTokenSpy).not.toHaveBeenCalled();
    });

    it('should fail when user role is not loaded', async () => {
      // Arrange
      const userWithoutRole = { ...mockUser, role: null };
      authRepository.findByEmail.mockResolvedValue(userWithoutRole as User);
      hashService.comparePasswords.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsError);
      expect(result.error.message).toContain('User role not found');
      const generateTokenSpy = tokenService.generateToken;
      expect(generateTokenSpy).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      authRepository.findByEmail.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsError);
    });
  });
});
