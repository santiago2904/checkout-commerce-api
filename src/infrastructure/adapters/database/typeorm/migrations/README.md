# TypeORM Migrations Guide

This project uses TypeORM migrations to manage database schema changes in a controlled and version-controlled manner.

## Prerequisites

- PostgreSQL database running
- Environment variables configured in `.env` file

## Migration Scripts

### Generate Migration (from entity changes)
```bash
npm run migration:generate -- src/infrastructure/adapters/database/typeorm/migrations/MigrationName
```
This command compares your entities with the current database schema and generates a migration file with the necessary changes.

### Create Empty Migration
```bash
npm run migration:create -- src/infrastructure/adapters/database/typeorm/migrations/MigrationName
```
Creates an empty migration file for manual schema modifications.

### Run Migrations
```bash
npm run migration:run
```
Executes all pending migrations in order.

### Revert Last Migration
```bash
npm run migration:revert
```
Reverts the most recently executed migration.

### Show Migration Status
```bash
npm run migration:show
```
Displays which migrations have been executed and which are pending.

## Migration Workflow

1. **Make Entity Changes**: Modify your entity classes in `src/infrastructure/adapters/database/typeorm/entities/`

2. **Generate Migration**: 
   ```bash
   npm run migration:generate -- src/infrastructure/adapters/database/typeorm/migrations/AddUserTable
   ```

3. **Review Migration**: Check the generated file in `src/infrastructure/adapters/database/typeorm/migrations/`

4. **Run Migration**:
   ```bash
   npm run migration:run
   ```

## Important Notes

- **Never modify executed migrations**: Once a migration has been run in production, create a new migration instead
- **Test migrations**: Always test migrations in development before applying to production
- **Backup production data**: Always backup before running migrations in production
- **Synchronize is disabled**: `synchronize: false` in production to prevent auto-schema changes

## Example Migration

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

## Environment Configuration

Ensure your `.env` file contains:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=checkout_commerce
```

## Troubleshooting

### Migration fails with "relation already exists"
- Check if `synchronize: true` was used previously
- Drop and recreate the database, or manually drop conflicting tables

### Cannot find module errors
- Ensure `ts-node` and `tsconfig-paths` are installed
- Check that path aliases in `tsconfig.json` match the migration configuration

### Connection errors
- Verify PostgreSQL is running
- Check `.env` database credentials
- Ensure the database exists (create it if needed)
