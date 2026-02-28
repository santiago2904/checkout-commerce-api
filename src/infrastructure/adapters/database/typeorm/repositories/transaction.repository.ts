import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities';
import { ITransactionRepository } from '@application/ports/out';
import { TransactionStatus } from '@domain/enums';

/**
 * TypeORM Transaction Repository
 * Implements ITransactionRepository port
 */
@Injectable()
export class TypeOrmTransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Create a new transaction
   */
  async create(transaction: Partial<Transaction>): Promise<Transaction> {
    const newTransaction = this.transactionRepository.create(transaction);
    return this.transactionRepository.save(newTransaction);
  }

  /**
   * Find transaction by id
   */
  async findById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
  }

  /**
   * Find transaction by reference
   */
  async findByReference(reference: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { reference },
      relations: ['customer'],
    });
  }

  /**
   * Update transaction status and Wompi details
   */
  async updateStatus(
    id: string,
    status: TransactionStatus,
    wompiTransactionId?: string,
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.transactionRepository.update(
      { id },
      {
        status,
        wompiTransactionId,
        errorCode,
        errorMessage,
      },
    );
  }

  /**
   * Find all transactions by customer id
   */
  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { customerId },
      relations: ['customer'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find all pending transactions
   */
  async findPending(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { status: TransactionStatus.PENDING },
      relations: ['customer'],
      order: {
        createdAt: 'ASC',
      },
    });
  }
}
