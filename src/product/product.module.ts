import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@infrastructure/adapters/database/typeorm/entities';
import { TypeOrmProductRepository } from '@infrastructure/adapters/database/typeorm/repositories';
import { GetProductsUseCase } from '@application/use-cases/product';
import { ProductsController } from '@infrastructure/adapters/http/controllers/products.controller';

/**
 * Product Module
 * Provides product listing functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [
    // Repository
    {
      provide: 'IProductRepository',
      useClass: TypeOrmProductRepository,
    },
    // Use Cases
    GetProductsUseCase,
  ],
  exports: ['IProductRepository', GetProductsUseCase],
})
export class ProductModule {}
