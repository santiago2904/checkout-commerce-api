import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThan, UpdateResult } from 'typeorm';
import { TypeOrmProductRepository } from './product.repository';
import { Product } from '../entities';

describe('TypeOrmProductRepository', () => {
  let repository: TypeOrmProductRepository;
  let mockRepository: jest.Mocked<Repository<Product>>;

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    description: 'Test Description',
    price: 50000,
    stock: 100,
    imageUrl: 'https://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product;

  beforeEach(async () => {
    const mockRepositoryMethods = {
      find: jest.fn(),
      findOne: jest.fn(),
      decrement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmProductRepository,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepositoryMethods,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmProductRepository>(TypeOrmProductRepository);
    mockRepository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWithStock', () => {
    it('should find all products with stock greater than 0', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 'product-456', stock: 50 },
      ];
      mockRepository.find.mockResolvedValue(products);

      const result = await repository.findAllWithStock();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          stock: MoreThan(0),
        },
        order: {
          name: 'ASC',
        },
      });
      expect(result).toEqual(products);
    });

    it('should return empty array if no products with stock', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAllWithStock();

      expect(result).toEqual([]);
    });

    it('should order products by name ascending', async () => {
      const products = [
        { ...mockProduct, name: 'A Product' },
        { ...mockProduct, name: 'B Product' },
        { ...mockProduct, name: 'C Product' },
      ];
      mockRepository.find.mockResolvedValue(products);

      const result = await repository.findAllWithStock();

      expect(result[0].name).toBe('A Product');
      expect(result[1].name).toBe('B Product');
      expect(result[2].name).toBe('C Product');
    });
  });

  describe('findById', () => {
    it('should find a product by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await repository.findById('product-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-123' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should return null if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateStock', () => {
    it('should decrease product stock by specified quantity', async () => {
      mockRepository.decrement.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      await repository.updateStock('product-123', 5);

      expect(mockRepository.decrement).toHaveBeenCalledWith(
        { id: 'product-123' },
        'stock',
        5,
      );
    });

    it('should handle updating stock with quantity 1', async () => {
      mockRepository.decrement.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      await repository.updateStock('product-123', 1);

      expect(mockRepository.decrement).toHaveBeenCalledWith(
        { id: 'product-123' },
        'stock',
        1,
      );
    });

    it('should handle updating stock with large quantity', async () => {
      mockRepository.decrement.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      await repository.updateStock('product-123', 100);

      expect(mockRepository.decrement).toHaveBeenCalledWith(
        { id: 'product-123' },
        'stock',
        100,
      );
    });
  });

  describe('hasStock', () => {
    it('should return true if product has enough stock', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await repository.hasStock('product-123', 50);

      expect(result).toBe(true);
    });

    it('should return false if product does not have enough stock', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await repository.hasStock('product-123', 150);

      expect(result).toBe(false);
    });

    it('should return false if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.hasStock('non-existent', 10);

      expect(result).toBe(false);
    });

    it('should return true if requested quantity equals available stock', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await repository.hasStock('product-123', 100);

      expect(result).toBe(true);
    });

    it('should return true if requested quantity is 0', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await repository.hasStock('product-123', 0);

      expect(result).toBe(true);
    });
  });
});
