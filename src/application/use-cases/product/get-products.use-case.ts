import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '@application/ports/out';
import { Result } from '@application/utils';
import { ProductsFetchError } from './product.errors';

/**
 * Response structure for product list
 */
export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

/**
 * Get Products Use Case
 * Retrieves all products with available stock
 * Implements Railway Oriented Programming (ROP) pattern
 */
@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  /**
   * Execute the get products use case
   * @returns Result containing product list or error
   */
  async execute(): Promise<Result<ProductResponse[], ProductsFetchError>> {
    try {
      // Fetch all products with stock
      const products = await this.productRepository.findAll();

      // Map to response DTOs
      const productResponses: ProductResponse[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        stock: product.stock,
        imageUrl: product.imageUrl,
      }));

      return Result.ok(productResponses);
    } catch {
      // In case of unexpected errors, return ProductsFetchError
      return Result.fail(new ProductsFetchError());
    }
  }
}
