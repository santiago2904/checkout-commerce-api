import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  GetProductsUseCase,
  ProductResponse,
} from '@application/use-cases/product';

/**
 * Products Controller
 * Public endpoint for product listing
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly getProductsUseCase: GetProductsUseCase) {}

  /**
   * Get all products with available stock
   * Public endpoint
   * @returns List of products
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getProducts(): Promise<{
    statusCode: number;
    data: ProductResponse[];
  }> {
    const result = await this.getProductsUseCase.execute();

    return result.fold(
      (products) => ({
        statusCode: HttpStatus.OK,
        data: products,
      }),
      () => {
        // In case of error, return empty array with 200
        // This is intentional for public endpoint
        return {
          statusCode: HttpStatus.OK,
          data: [],
        };
      },
    );
  }
}
