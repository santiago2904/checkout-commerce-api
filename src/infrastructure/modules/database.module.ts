import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '@infrastructure/config/typeorm.config';
import {
  Role,
  User,
  Product,
  Customer,
  Delivery,
  Transaction,
  AuditLog,
} from '@infrastructure/adapters/database/typeorm/entities';

/**
 * Database Module
 * Configures TypeORM with PostgreSQL connection
 * Exports all repositories for use in other modules
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    TypeOrmModule.forFeature([
      Role,
      User,
      Product,
      Customer,
      Delivery,
      Transaction,
      AuditLog,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
