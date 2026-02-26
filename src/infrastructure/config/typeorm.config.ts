import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
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
 * TypeORM configuration factory for NestJS
 * Uses ConfigService to access environment variables
 */
export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_DATABASE', 'checkout_commerce'),
  entities: [Role, User, Product, Customer, Delivery, Transaction, AuditLog],
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  migrations: [__dirname + '/../adapters/database/typeorm/migrations/*{.ts,.js}'],
  migrationsRun: false,
});

/**
 * DataSource configuration for TypeORM CLI migrations
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'checkout_commerce',
  entities: [__dirname + '/../adapters/database/typeorm/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../adapters/database/typeorm/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
