import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerRepository } from '@application/ports/out';
import { Customer } from '../entities/customer.entity';

/**
 * TypeORM implementation of ICustomerRepository
 */
@Injectable()
export class TypeOrmCustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findByUserId(userId: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(customerData: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    userId: string;
  }): Promise<Customer> {
    const customer = this.customerRepository.create({
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone || '',
      address: customerData.address || '',
      city: customerData.city || '',
      country: customerData.country || '',
      userId: customerData.userId,
    });
    return this.customerRepository.save(customer);
  }
}
