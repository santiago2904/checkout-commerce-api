import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities';
import { IDeliveryRepository } from '@application/ports/out';

/**
 * TypeORM Delivery Repository
 * Implements IDeliveryRepository port
 */
@Injectable()
export class TypeOrmDeliveryRepository implements IDeliveryRepository {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  /**
   * Create a new delivery
   */
  async create(delivery: Partial<Delivery>): Promise<Delivery> {
    const newDelivery = this.deliveryRepository.create(delivery);
    return this.deliveryRepository.save(newDelivery);
  }

  /**
   * Find delivery by id
   */
  async findById(id: string): Promise<Delivery | null> {
    return this.deliveryRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
  }

  /**
   * Find delivery by transaction id
   */
  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    return this.deliveryRepository.findOne({
      where: { transactionId },
      relations: ['customer'],
    });
  }

  /**
   * Update delivery status
   */
  async updateStatus(id: string, status: string): Promise<void> {
    await this.deliveryRepository.update({ id }, { status });
  }
}
