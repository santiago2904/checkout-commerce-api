# Database Seeders

This directory contains database seeders for populating initial data.

## Available Seeders

### 1. Role Seeder
Seeds initial system roles:
- **ADMIN**: Administrator with full system access
- **CUSTOMER**: Customer with checkout and purchase history access

### 2. Product Seeder
Seeds sample products for testing and demo:
- 10 sample products with realistic data
- Products include: laptops, phones, tablets, accessories, etc.

## Usage

### Run All Seeders
```bash
npm run seed:run
```

This will execute all seeders in the correct order:
1. Roles (must be seeded before users)
2. Products

### Create New Seeder

1. Create a new file in this directory (e.g., `user.seeder.ts`)
2. Implement the seeder class:

```typescript
import { DataSource } from 'typeorm';
import { YourEntity } from '../entities/your-entity.entity';

export class YourSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(YourEntity);
    
    // Check if already seeded
    const existing = await repository.count();
    if (existing > 0) {
      console.log('Already seeded. Skipping...');
      return;
    }
    
    // Create and save your data
    const data = repository.create({ /* your data */ });
    await repository.save(data);
  }
}
```

3. Add your seeder to the `index.ts` file:

```typescript
import { YourSeeder } from './your.seeder';

const seeders = [
  new RoleSeeder(),
  new ProductSeeder(),
  new YourSeeder(), // Add here
];
```

## Best Practices

1. **Idempotency**: Always check if data exists before seeding to make seeders idempotent
2. **Order**: Seed entities with no dependencies first (e.g., Roles before Users)
3. **Error Handling**: Use try-catch blocks for individual seeders to prevent cascade failures
4. **Logging**: Log progress and completion for visibility
5. **Data Quality**: Use realistic data that represents production scenarios

## Notes

- Seeders use the same TypeORM configuration as migrations
- Seeders should only be run in development/staging environments
- Production data should be seeded through proper deployment processes
- Seeders skip already seeded data to avoid duplicates
