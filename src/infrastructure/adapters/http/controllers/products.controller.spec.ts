/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import {
  GetProductsUseCase,
  ProductResponse,
} from '@application/use-cases/product';
import { Result } from '@application/utils';

describe('ProductsController', () => {
  let controller: ProductsController;
  let getProductsUseCase: jest.Mocked<GetProductsUseCase>;

  const mockGetProductsUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: GetProductsUseCase,
          useValue: mockGetProductsUseCase,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    getProductsUseCase = module.get(GetProductsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    const mockProducts: ProductResponse[] = [
      {
        id: 'product-1',
        name: 'Product 1',
        description: 'Description 1',
        price: 10000,
        availableStock: 50,
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        id: 'product-2',
        name: 'Product 2',
        description: 'Description 2',
        price: 20000,
        availableStock: 30,
        imageUrl: 'https://example.com/image2.jpg',
      },
      {
        id: 'product-3',
        name: 'Product 3',
        description: 'Description 3',
        price: 15000,
        availableStock: 0,
        imageUrl: 'https://example.com/image3.jpg',
      },
    ];

    it('should return all products successfully', async () => {
      const successResult = Result.ok<ProductResponse[], Error>(mockProducts);
      mockGetProductsUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.getProducts();

      expect(result).toEqual({
        statusCode: 200,
        data: mockProducts,
      });
      expect(getProductsUseCase.execute).toHaveBeenCalledWith();
    });

    it('should return empty array on error', async () => {
      const errorResult = Result.fail<ProductResponse[], Error>(
        new Error('Database error'),
      );
      mockGetProductsUseCase.execute.mockResolvedValue(errorResult);

      const result = await controller.getProducts();

      expect(result).toEqual({
        statusCode: 200,
        data: [],
      });
      expect(getProductsUseCase.execute).toHaveBeenCalledWith();
    });

    it('should return empty array when no products exist', async () => {
      const successResult = Result.ok<ProductResponse[], Error>([]);
      mockGetProductsUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.getProducts();

      expect(result).toEqual({
        statusCode: 200,
        data: [],
      });
    });

    it('should handle products with zero stock', async () => {
      const productsWithZeroStock: ProductResponse[] = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Description 1',
          price: 10000,
          availableStock: 0,
          imageUrl: 'https://example.com/image1.jpg',
        },
      ];
      const successResult = Result.ok<ProductResponse[], Error>(
        productsWithZeroStock,
      );
      mockGetProductsUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.getProducts();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].availableStock).toBe(0);
    });

    it('should return products with all required fields', async () => {
      const successResult = Result.ok<ProductResponse[], Error>([
        mockProducts[0],
      ]);
      mockGetProductsUseCase.execute.mockResolvedValue(successResult);

      const result = await controller.getProducts();

      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('description');
      expect(result.data[0]).toHaveProperty('price');
      expect(result.data[0]).toHaveProperty('availableStock');
      expect(result.data[0]).toHaveProperty('imageUrl');
    });
  });
});
