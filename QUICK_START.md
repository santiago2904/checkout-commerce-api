# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git

## Setup (5 minutes)

### 1. Clone and Install

```bash
git clone https://github.com/santiago2904/checkout-commerce-api.git
cd checkout-commerce-api
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# Default values work if you use the docker command below
```

### 3. Start PostgreSQL

**Option A: Docker (Recommended)**
```bash
docker run --name checkout-postgres \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_USER=zarco \
  -e POSTGRES_DB=checkout \
  -p 5432:5432 \
  -d postgres:15-alpine
```

**Option B: Homebrew**
```bash
brew install postgresql@15
brew services start postgresql@15
psql -U postgres -c "CREATE DATABASE checkout;"
```

### 4. Setup Database

```bash
# Run migrations
npm run migration:run

# Run seeders
npm run seed:run
```

### 5. Verify Setup

```bash
# Run tests
npm test

# Check database
npm run migration:show
```

### 6. Start Development

```bash
npm run start:dev
```

API will be available at: http://localhost:3000

## What's Been Seeded?

### Roles (2)
- `ADMIN` - Full system access
- `CUSTOMER` - Checkout and purchase history

### Products (10)
Sample products with realistic data:
- Laptops, Phones, Tablets
- Accessories, Electronics
- All with price and stock

## Quick Commands

```bash
# Development
npm run start:dev              # Start with watch mode
npm run start:debug            # Start with debugger

# Testing
npm test                       # Run all tests
npm run test:watch             # Watch mode
npm run test:cov               # With coverage

# Database
npm run migration:run          # Run migrations
npm run migration:revert       # Rollback last migration
npm run migration:show         # Show migration status
npm run seed:run               # Run seeders

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format code with Prettier
```

## Project Structure

```
src/
├── domain/                    # Business entities and rules
│   ├── entities/             # Domain models
│   └── enums/                # Enums and constants
├── application/              # Use cases and business logic
│   ├── ports/                # Interface definitions
│   └── use-cases/            # Business operations
└── infrastructure/           # External implementations
    ├── adapters/             # Database, web, etc.
    │   ├── database/
    │   │   └── typeorm/
    │   │       ├── entities/  # TypeORM entities
    │   │       ├── migrations/ # Database migrations
    │   │       └── seeds/      # Data seeders
    │   └── web/              # Controllers, guards, etc.
    ├── config/               # Configuration files
    └── modules/              # NestJS modules
```

## Next Steps

1. ✅ Database setup complete
2. ✅ Initial data seeded
3. 🔜 Implement authentication (JWT)
4. 🔜 Create user registration endpoint
5. 🔜 Implement checkout flow with Wompi

## Troubleshooting

### Database connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# or
brew services list | grep postgresql
```

### Tests failing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Getting Help

- 📖 [Full Database Setup Guide](./DATABASE_SETUP.md)
- 📖 [Architecture Instructions](./arquitecture.instruction.md)
- 📖 [Seeder Documentation](./src/infrastructure/adapters/database/typeorm/seeds/README.md)

## Environment Variables

Required variables in `.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=zarco
DB_PASSWORD=admin123
DB_DATABASE=checkout

# Application
NODE_ENV=development
PORT=3000

# JWT (to be configured later)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

## Production Deployment

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for production considerations including:
- SSL connections
- Database backups
- Connection pooling
- Security best practices
