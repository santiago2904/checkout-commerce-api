/* eslint-disable @typescript-eslint/unbound-method */ import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCustomerRepository } from './customer.repository';
import { Customer } from '../entities/customer.entity';

describe('TypeOrmCustomerRepository', () => {
  let repository: TypeOrmCustomerRepository;
  let mockRepository: jest.Mocked<Repository<Customer>>;

  const mockCustomer = {
    id: 'customer-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+573001234567',
    address: '123 Test St',
    city: 'Bogotá',
    country: 'Colombia',
    userId: 'user-123',
    user: {
      id: 'user-123',
      email: 'john@example.com',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Customer;

  beforeEach(async () => {
    const mockRepositoryMethods = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmCustomerRepository,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepositoryMethods,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmCustomerRepository>(
      TypeOrmCustomerRepository,
    );
    mockRepository = module.get(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find a customer by user id', async () => {
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await repository.findByUserId('user-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        relations: ['user'],
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should return null if customer not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByUserId('non-existent');

      expect(result).toBeNull();
    });

    it('should include user relation', async () => {
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      await repository.findByUserId('user-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user'],
        }),
      );
    });
  });

  describe('create', () => {
    const customerData = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+573001234567',
      address: '123 Test St',
      city: 'Bogotá',
      country: 'Colombia',
      userId: 'user-123',
    };

    it('should create and save a new customer', async () => {
      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      const result = await repository.create(customerData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phone: '+573001234567',
        address: '123 Test St',
        city: 'Bogotá',
        country: 'Colombia',
        userId: 'user-123',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockCustomer);
      expect(result).toEqual(mockCustomer);
    });

    it('should create customer with empty strings for optional fields', async () => {
      const minimalData = {
        firstName: 'Jane',
        lastName: 'Smith',
        userId: 'user-456',
      };

      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      await repository.create(minimalData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '',
        address: '',
        city: '',
        country: '',
        userId: 'user-456',
      });
    });

    it('should handle customer with all fields provided', async () => {
      const fullData = {
        firstName: 'Maria',
        lastName: 'Garcia',
        phone: '+573009876543',
        address: '456 Main Ave',
        city: 'Medellín',
        country: 'Colombia',
        userId: 'user-789',
      };

      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      const result = await repository.create(fullData);

      expect(mockRepository.create).toHaveBeenCalledWith(fullData);
      expect(result).toEqual(mockCustomer);
    });

    it('should handle customer with partial optional fields', async () => {
      const partialData = {
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        phone: '+573001111111',
        userId: 'user-999',
      };

      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      await repository.create(partialData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        phone: '+573001111111',
        address: '',
        city: '',
        country: '',
        userId: 'user-999',
      });
    });
  });
});
