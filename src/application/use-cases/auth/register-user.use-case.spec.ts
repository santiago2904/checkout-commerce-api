import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { RegisterUserUseCase } from './register-user.use-case';
import {
  EmailAlreadyExistsError,
  RoleNotFoundError,
  UserCreationError,
  CustomerCreationError,
} from './auth.errors';
import { IAuthRepository, ICustomerRepository } from '@application/ports/out';
import { IHashService, ITokenService } from '@application/ports/auth';
import { RegisterDto } from '@application/dtos';
import { RoleName } from '@domain/enums';
import { User } from '@infrastructure/adapters/database/typeorm/entities/user.entity';
import { Customer } from '@infrastructure/adapters/database/typeorm/entities/customer.entity';
import { Role } from '@infrastructure/adapters/database/typeorm/entities/role.entity';
import {
  AUTH_REPOSITORY,
  CUSTOMER_REPOSITORY,
  HASH_SERVICE,
  TOKEN_SERVICE,
} from '@application/tokens';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let authRepository: jest.Mocked<IAuthRepository>;
  let customerRepository: jest.Mocked<ICustomerRepository>;
  let hashService: jest.Mocked<IHashService>;
  let tokenService: jest.Mocked<ITokenService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockRole: Role = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: RoleName.CUSTOMER,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Role;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'newuser@example.com',
    password: 'hashedPassword123',
    roleId: mockRole.id,
    role: mockRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as User;

  const mockCustomer: Customer = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    firstName: 'John',
    lastName: 'Doe',
    phone: '',
    address: '',
    city: '',
    country: '',
    userId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Customer;

  beforeEach(async () => {
    // Create query runner mock
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
      },
    } as jest.Mocked<QueryRunner>;

    // Create data source mock
    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      getRepository: jest.fn(),
    } as unknown as DataSource;

    // Create repository mocks
    const mockAuthRepository: Partial<IAuthRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      emailExists: jest.fn(),
    };

    const mockCustomerRepository: Partial<ICustomerRepository> = {
      findByUserId: jest.fn(),
      create: jest.fn(),
    };

    // Create service mocks
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
        RegisterUserUseCase,
        {
          provide: AUTH_REPOSITORY,
          useValue: mockAuthRepository,
        },
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: mockCustomerRepository,
        },
        {
          provide: HASH_SERVICE,
          useValue: mockHashService,
        },
        {
          provide: TOKEN_SERVICE,
          useValue: mockTokenService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    authRepository = module.get(AUTH_REPOSITORY);
    customerRepository = module.get(CUSTOMER_REPOSITORY);
    hashService = module.get(HASH_SERVICE);
    tokenService = module.get(TOKEN_SERVICE);
  });

  describe('execute', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user with customer profile', async () => {
      // Arrange
      authRepository.emailExists.mockResolvedValue(false);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockRole);
      hashService.hashPassword.mockResolvedValue('hashedPassword123');
      authRepository.create.mockResolvedValue(mockUser);
      customerRepository.create.mockResolvedValue(mockCustomer);
      tokenService.generateToken.mockResolvedValue('jwt-token-123');

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          roleId: mockUser.roleId,
          roleName: mockRole.name,
        },
        customer: {
          id: mockCustomer.id,
          firstName: mockCustomer.firstName,
          lastName: mockCustomer.lastName,
        },
        accessToken: 'jwt-token-123',
      });

      const startTransactionSpy = queryRunner.startTransaction;
      const commitTransactionSpy = queryRunner.commitTransaction;
      const releaseSpy = queryRunner.release;
      const emailExistsSpy = authRepository.emailExists;
      const findOneSpy = queryRunner.manager.findOne;
      const hashPasswordSpy = hashService.hashPassword;
      const createUserSpy = authRepository.create;
      expect(startTransactionSpy).toHaveBeenCalled();
      expect(commitTransactionSpy).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
      expect(emailExistsSpy).toHaveBeenCalledWith(registerDto.email);
      expect(findOneSpy).toHaveBeenCalled();
      expect(hashPasswordSpy).toHaveBeenCalledWith(registerDto.password);
      expect(createUserSpy).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword123',
        roleId: mockRole.id,
      });
      expect(customerRepository.create).toHaveBeenCalledWith({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: '',
        address: '',
        city: '',
        country: '',
        userId: mockUser.id,
      });
    });

    it('should fail when email already exists', async () => {
      // Arrange
      authRepository.emailExists.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(EmailAlreadyExistsError);
      const rollbackSpy = queryRunner.rollbackTransaction;
      const releaseSpy = queryRunner.release;
      const createUserSpy = authRepository.create;
      expect(rollbackSpy).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
      expect(createUserSpy).not.toHaveBeenCalled();
    });

    it('should fail when customer role is not found', async () => {
      // Arrange
      authRepository.emailExists.mockResolvedValue(false);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(RoleNotFoundError);
      const rollbackSpy = queryRunner.rollbackTransaction;
      const releaseSpy = queryRunner.release;
      const createUserSpy = authRepository.create;
      expect(rollbackSpy).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
      expect(createUserSpy).not.toHaveBeenCalled();
    });

    it('should rollback transaction on user creation error', async () => {
      // Arrange
      authRepository.emailExists.mockResolvedValue(false);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockRole);
      hashService.hashPassword.mockResolvedValue('hashedPassword123');
      authRepository.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserCreationError);
      const rollbackSpy = queryRunner.rollbackTransaction;
      const releaseSpy = queryRunner.release;
      const createCustomerSpy = customerRepository.create;
      expect(rollbackSpy).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
      expect(createCustomerSpy).not.toHaveBeenCalled();
    });

    it('should rollback transaction on customer creation error', async () => {
      // Arrange
      authRepository.emailExists.mockResolvedValue(false);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockRole);
      hashService.hashPassword.mockResolvedValue('hashedPassword123');
      authRepository.create.mockResolvedValue(mockUser);
      customerRepository.create.mockResolvedValue(null); // Simulating customer creation failure

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(CustomerCreationError);
      const rollbackSpy = queryRunner.rollbackTransaction;
      const releaseSpy = queryRunner.release;
      expect(rollbackSpy).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
    });

    it('should release query runner even if commit fails', async () => {
      // Arrange
      authRepository.emailExists.mockResolvedValue(false);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockRole);
      hashService.hashPassword.mockResolvedValue('hashedPassword123');
      authRepository.create.mockResolvedValue(mockUser);
      customerRepository.create.mockResolvedValue(mockCustomer);
      queryRunner.commitTransaction.mockRejectedValue(new Error('Commit failed'));

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserCreationError);
      const releaseSpy = queryRunner.release;
      expect(releaseSpy).toHaveBeenCalled();
    });
  });
});
