import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsUseCase } from './get-products.use-case';
import { ProductsFetchError } from './product.errors';
import { IProductRepository } from '@application/ports/out';
import { Product } from '@infrastructure/adapters/database/typeorm/entities';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  const mockProducts: Product[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Laptop HP',
      description: 'Laptop HP 15.6" 8GB RAM',
      price: 1200.0,
      stock: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Mouse Logitech',
      description: 'Mouse inalámbrico',
      price: 25.99,
      stock: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(async () => {
    // Create mock repository
    mockProductRepository = {
      findAllWithStock: jest.fn(),
      findById: jest.fn(),
      updateStock: jest.fn(),
      hasStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        {
          provide: 'IProductRepository',
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProductsUseCase>(GetProductsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return list of products successfully', async () => {
      // Arrange
      mockProductRepository.findAllWithStock.mockResolvedValue(mockProducts);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProductRepository.findAllWithStock).toHaveBeenCalledTimes(1);

      const products = result.value;
      expect(products).toHaveLength(2);
      expect(products[0]).toEqual({
        id: mockProducts[0].id,
        name: mockProducts[0].name,
        description: mockProducts[0].description,
        price: mockProducts[0].price,
        stock: mockProducts[0].stock,
      });
    });

    it('should return empty array when no products available', async () => {
      // Arrange
      mockProductRepository.findAllWithStock.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBeTruthy();
      expect(result.value).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProductRepository.findAllWithStock).toHaveBeenCalledTimes(1);
    });

    it('should return error when repository throws exception', async () => {
      // Arrange
      mockProductRepository.findAllWithStock.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isFailure).toBeTruthy();
      const error = result.fold(
        () => null,
        (err) => err,
      );
      expect(error).toBeInstanceOf(ProductsFetchError);
      expect(error?.message).toBe('Failed to fetch products');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProductRepository.findAllWithStock).toHaveBeenCalledTimes(1);
    });

    it('should convert decimal price to number correctly', async () => {
      // Arrange
      const productWithDecimal = [
        {
          ...mockProducts[0],
          price: 1299.99,
        },
      ];
      mockProductRepository.findAllWithStock.mockResolvedValue(
        productWithDecimal,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBeTruthy();
      expect(result.value[0].price).toBe(1299.99);
      expect(typeof result.value[0].price).toBe('number');
    });

    it('should handle products with null description', async () => {
      // Arrange
      const productWithNullDesc = [
        {
          ...mockProducts[0],
          description: null,
        },
      ];
      mockProductRepository.findAllWithStock.mockResolvedValue(
        productWithNullDesc,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBeTruthy();
      expect(result.value[0].description).toBeNull();
    });
  });
});
