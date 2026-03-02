import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TypeOrmDeliveryRepository } from './delivery.repository';
import { Delivery } from '../entities';

describe('TypeOrmDeliveryRepository', () => {
  let repository: TypeOrmDeliveryRepository;
  let mockRepository: jest.Mocked<Repository<Delivery>>;

  const mockDelivery = {
    id: 'delivery-123',
    transactionId: 'transaction-123',
    customerId: 'customer-123',
    customerName: 'John Doe',
    deliveryAddress: '123 Test St',
    deliveryCity: 'Bogotá',
    deliveryCountry: 'Colombia',
    customerPhone: '+573001234567',
    customerEmail: 'john@example.com',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-123',
      firstName: 'John',
      lastName: 'Doe',
    },
  } as Delivery;

  beforeEach(async () => {
    const mockRepositoryMethods = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmDeliveryRepository,
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockRepositoryMethods,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmDeliveryRepository>(
      TypeOrmDeliveryRepository,
    );
    mockRepository = module.get(getRepositoryToken(Delivery));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new delivery', async () => {
      const deliveryData: Partial<Delivery> = {
        transactionId: 'transaction-123',
        customerId: 'customer-123',
        customerName: 'John Doe',
        deliveryAddress: '123 Test St',
        deliveryCity: 'Bogotá',
        status: 'PENDING',
      };

      mockRepository.create.mockReturnValue(mockDelivery);
      mockRepository.save.mockResolvedValue(mockDelivery);

      const result = await repository.create(deliveryData);

      expect(mockRepository.create).toHaveBeenCalledWith(deliveryData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockDelivery);
      expect(result).toEqual(mockDelivery);
    });

    it('should create delivery with all fields', async () => {
      const fullData: Partial<Delivery> = {
        transactionId: 'transaction-456',
        customerId: 'customer-456',
        customerName: 'Jane Smith',
        deliveryAddress: '456 Main Ave',
        deliveryCity: 'Medellín',
        deliveryCountry: 'Colombia',
        customerPhone: '+573009876543',
        customerEmail: 'jane@example.com',
        status: 'PENDING',
      };

      mockRepository.create.mockReturnValue(mockDelivery);
      mockRepository.save.mockResolvedValue(mockDelivery);

      await repository.create(fullData);

      expect(mockRepository.create).toHaveBeenCalledWith(fullData);
    });
  });

  describe('findById', () => {
    it('should find a delivery by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockDelivery);

      const result = await repository.findById('delivery-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        relations: ['customer'],
      });
      expect(result).toEqual(mockDelivery);
    });

    it('should return null if delivery not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should include customer relation', async () => {
      mockRepository.findOne.mockResolvedValue(mockDelivery);

      await repository.findById('delivery-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['customer'],
        }),
      );
    });
  });

  describe('findByTransactionId', () => {
    it('should find a delivery by transaction id', async () => {
      mockRepository.findOne.mockResolvedValue(mockDelivery);

      const result = await repository.findByTransactionId('transaction-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { transactionId: 'transaction-123' },
        relations: ['customer'],
      });
      expect(result).toEqual(mockDelivery);
    });

    it('should return null if delivery not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByTransactionId('non-existent');

      expect(result).toBeNull();
    });

    it('should include customer relation', async () => {
      mockRepository.findOne.mockResolvedValue(mockDelivery);

      await repository.findByTransactionId('transaction-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['customer'],
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update delivery status', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      await repository.updateStatus('delivery-123', 'SHIPPED');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'delivery-123' },
        { status: 'SHIPPED' },
      );
    });

    it('should update to DELIVERED status', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      await repository.updateStatus('delivery-123', 'DELIVERED');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'delivery-123' },
        { status: 'DELIVERED' },
      );
    });

    it('should update to CANCELLED status', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      await repository.updateStatus('delivery-123', 'CANCELLED');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'delivery-123' },
        { status: 'CANCELLED' },
      );
    });
  });
});
