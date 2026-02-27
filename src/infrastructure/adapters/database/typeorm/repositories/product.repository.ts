import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Product } from '../entities';
import { IProductRepository } from '@application/ports/out';

/**
 * TypeORM Product Repository
 * Implements IProductRepository port
 */
@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Find all products with available stock (stock > 0)
   */
  async findAllWithStock(): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        stock: MoreThan(0),
      },
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Find product by id
   */
  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
    });
  }

  /**
   * Update product stock
   * Decreases stock by the specified quantity
   */
  async updateStock(id: string, quantity: number): Promise<void> {
    await this.productRepository.decrement({ id }, 'stock', quantity);
  }

  /**
   * Check if product has enough stock
   */
  async hasStock(id: string, quantity: number): Promise<boolean> {
    const product = await this.findById(id);
    if (!product) {
      return false;
    }
    return product.stock >= quantity;
  }
}
