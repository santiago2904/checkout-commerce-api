import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionItem } from '../entities';
import { ITransactionItemRepository } from '@application/ports/out';

/**
 * TypeORM TransactionItem Repository
 * Implements ITransactionItemRepository port
 */
@Injectable()
export class TypeOrmTransactionItemRepository implements ITransactionItemRepository {
  constructor(
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
  ) {}

  /**
   * Create multiple transaction items in batch
   */
  async createMany(
    items: Partial<TransactionItem>[],
  ): Promise<TransactionItem[]> {
    const entities = this.transactionItemRepository.create(items);
    return this.transactionItemRepository.save(entities);
  }

  /**
   * Find all items for a specific transaction
   */
  async findByTransactionId(transactionId: string): Promise<TransactionItem[]> {
    return this.transactionItemRepository.find({
      where: { transactionId },
      relations: ['product'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find a single item by id
   */
  async findById(id: string): Promise<TransactionItem | null> {
    return this.transactionItemRepository.findOne({
      where: { id },
      relations: ['transaction', 'product'],
    });
  }
}
