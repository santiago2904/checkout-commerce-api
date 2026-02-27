import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAuthRepository } from '@application/ports/out';
import { User } from '../entities/user.entity';

/**
 * TypeORM implementation of IAuthRepository
 */
@Injectable()
export class TypeOrmAuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async create(userData: {
    email: string;
    password: string;
    roleId: string;
  }): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { email },
    });
    return count > 0;
  }
}
