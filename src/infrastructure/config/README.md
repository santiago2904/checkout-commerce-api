# Database Configuration

This directory contains the database configuration for the checkout-commerce-api.

## Structure

- `typeorm.config.ts` - TypeORM configuration for NestJS and CLI migrations
- `database.config.spec.ts` - Unit tests for database configuration

## TypeORM Configuration

The configuration supports two modes:

### 1. NestJS Application Mode
Used by the application at runtime via `DatabaseModule`:
```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: getTypeOrmConfig,
})
```

### 2. CLI Mode
Used by TypeORM CLI for migrations:
```typescript
import dataSource from './typeorm.config';
export default dataSource;
```

## Features

- ✅ Configuration via environment variables
- ✅ Default values for development
- ✅ Separate synchronize settings per environment
- ✅ Migration support
- ✅ Logging in development mode
- ✅ All entities auto-loaded

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USERNAME` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `DB_DATABASE` | checkout_commerce | Database name |
| `NODE_ENV` | development | Environment mode |

## Synchronize Behavior

- **Development**: `synchronize: true` - Auto-creates schema from entities
- **Production**: `synchronize: false` - Requires migrations for schema changes

⚠️ **Warning**: Never use `synchronize: true` in production as it can cause data loss.

## Migrations

See [migrations/README.md](../adapters/database/typeorm/migrations/README.md) for detailed migration instructions.
