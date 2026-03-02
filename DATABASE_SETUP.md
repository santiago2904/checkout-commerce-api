# Database Setup Guide

## PostgreSQL Installation (macOS)

### Using Homebrew

1. **Install PostgreSQL**:
   ```bash
   brew install postgresql@15
   ```

2. **Start PostgreSQL Service**:
   ```bash
   brew services start postgresql@15
   ```

3. **Verify Installation**:
   ```bash
   psql --version
   ```

### Alternative: Using Docker

1. **Pull PostgreSQL Image**:
   ```bash
   docker pull postgres:15-alpine
   ```

2. **Run PostgreSQL Container**:
   ```bash
   docker run --name checkout-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_DB=checkout_commerce \
     -p 5432:5432 \
     -d postgres:15-alpine
   ```

3. **Verify Container is Running**:
   ```bash
   docker ps
   ```

## Database Creation

### Using psql CLI

1. **Connect to PostgreSQL**:
   ```bash
   psql -U postgres
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE checkout_commerce;
   ```

3. **Exit psql**:
   ```sql
   \q
   ```

### Using Docker

If you used the Docker command above, the database is already created.

## Running Migrations

1. **Ensure PostgreSQL is Running**:
   ```bash
   # For Homebrew installation
   brew services list
   
   # For Docker
   docker ps
   ```

2. **Check Environment Variables**:
   Verify your `.env` file contains correct database credentials.

3. **Run Migrations**:
   ```bash
   npm run migration:run
   ```

4. **Verify Migration Status**:
   ```bash
   npm run migration:show
   ```

## Running Seeders

After migrations are complete, populate the database with initial data.

1. **Run All Seeders**:
   ```bash
   npm run seed:run
   ```

   This will seed:
   - **Roles**: ADMIN and CUSTOMER roles
   - **Products**: 10 sample products for testing

2. **Verify Seeded Data**:
   ```bash
   # Connect to database
   psql -U postgres -d checkout_commerce
   
   # Check roles
   SELECT * FROM roles;
   
   # Check products
   SELECT id, name, price, stock FROM products;
   
   # Exit
   \q
   ```

### Seeder Details

**Role Seeder**:
- Creates ADMIN role (full system access)
- Creates CUSTOMER role (checkout and purchase history access)
- Idempotent: skips if roles already exist

**Product Seeder**:
- Creates 10 sample products with realistic data
- Products include: electronics, phones, accessories, etc.
- Idempotent: skips if products already exist

### Manual Database Verification

```sql
-- Check role count
SELECT COUNT(*) FROM roles;  -- Should return 2

-- Check product count
SELECT COUNT(*) FROM products;  -- Should return 10

-- View all roles
SELECT name, description FROM roles ORDER BY name;

-- View all products with stock
SELECT name, price, stock FROM products ORDER BY name;
```

## Migration Commands Reference

```bash
# Generate migration from entity changes
npm run migration:generate -- src/infrastructure/adapters/database/typeorm/migrations/MigrationName

# Create empty migration template
npm run migration:create -- src/infrastructure/adapters/database/typeorm/migrations/MigrationName

# Run all pending migrations
npm run migration:run

# Revert last executed migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## Troubleshooting

### Connection Refused Error

**Problem**: `ECONNREFUSED ::1:5432` or `ECONNREFUSED 127.0.0.1:5432`

**Solution**:
1. Check if PostgreSQL is running:
   ```bash
   # Homebrew
   brew services list
   
   # Docker
   docker ps | grep postgres
   ```

2. Start PostgreSQL if not running:
   ```bash
   # Homebrew
   brew services start postgresql@15
   
   # Docker
   docker start checkout-postgres
   ```

### Database Does Not Exist

**Problem**: `database "checkout_commerce" does not exist`

**Solution**:
```bash
# Using psql
psql -U postgres -c "CREATE DATABASE checkout_commerce;"

# Using Docker
docker exec -it checkout-postgres psql -U postgres -c "CREATE DATABASE checkout_commerce;"
```

### Authentication Failed

**Problem**: `password authentication failed for user "postgres"`

**Solution**:
1. Verify credentials in `.env` file
2. Reset PostgreSQL password:
   ```bash
   # Homebrew
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'postgres';
   
   # Docker
   docker exec -it checkout-postgres psql -U postgres
   ALTER USER postgres WITH PASSWORD 'postgres';
   ```

### Port Already in Use

**Problem**: `port 5432 is already allocated`

**Solution**:
1. Check what's using port 5432:
   ```bash
   lsof -i :5432
   ```

2. Either stop the existing process or change the port in `.env`:
   ```
   DB_PORT=5433
   ```

## Testing Database Connection

Create a test file `test-db-connection.ts`:

```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'checkout_commerce',
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connection successful!');
    return AppDataSource.destroy();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });
```

Run it:
```bash
ts-node -r tsconfig-paths/register test-db-connection.ts
```

## Next Steps

After successful database setup:
1. ✅ Install PostgreSQL
2. ✅ Create database
3. ✅ Run initial migration
4. ✅ Run seeders (ADMIN, CUSTOMER roles and sample products)
5. 🔜 Test application with database
6. 🔜 Create first admin user

## Complete Setup Flow

Here's the complete workflow from scratch:

```bash
# 1. Clone repository
git clone <repository-url>
cd checkout-commerce-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Ensure PostgreSQL is running
brew services start postgresql@15
# or
docker start checkout-postgres

# 5. Create database
psql -U postgres -c "CREATE DATABASE checkout_commerce;"

# 6. Run migrations
npm run migration:run

# 7. Run seeders
npm run seed:run

# 8. Verify setup
npm run migration:show
psql -U postgres -d checkout_commerce -c "SELECT COUNT(*) FROM roles;"

# 9. Run tests
npm test

# 10. Start development server
npm run start:dev
```

## Production Considerations

- Use strong passwords (not `postgres`)
- Enable SSL connections
- Set up database backups
- Configure connection pooling
- Use environment-specific databases
- Never commit `.env` file to version control
