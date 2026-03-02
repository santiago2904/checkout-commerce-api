# 🛒 Checkout Commerce API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<p align="center">
  <strong>Production-Ready E-Commerce Backend with Wompi Payment Integration</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM" />
  <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/coverage-81.97%25-brightgreen?style=flat-square" alt="Coverage" />
  <img src="https://img.shields.io/badge/tests-367%20passing-success?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/lint-0%20errors-success?style=flat-square" alt="Lint" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
</p>

---

## 📋 Table of Contents

- [Description](#-description)
- [Key Features](#-key-features)
- [Technology Stack](#️-technology-stack)
- [Architecture](#️-architecture)
- [Design Patterns](#-design-patterns)
- [Audit System](#-audit-system)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Wompi Integration](#-wompi-integration)
- [Database](#-database)
- [Security and Authentication](#-security-and-authentication)
- [Available Scripts](#-available-scripts)
- [Additional Documentation](#-additional-documentation)

---

## 🎯 Description

**Checkout Commerce API** is a robust and scalable backend for checkout flows and electronic payments, integrated with the **Wompi** payment gateway (Sandbox mode). The project is built with **NestJS**, **TypeScript**, and **TypeORM**, following modern software architecture best practices and design patterns.

This system handles the complete lifecycle of an e-commerce transaction:
- ✅ User registration and authentication with JWT
- ✅ Product and stock management in real-time
- ✅ Asynchronous payment processing with multiple methods (Card, Nequi, PSE, Bancolombia)
- ✅ Automatic fulfillment system (stock reduction, delivery creation)
- ✅ Complete audit trail of critical operations
- ✅ Webhook system for Wompi notifications
- ✅ Dynamic Role-Based Access Control (RBAC)

---

## ✨ Key Features

### 🏗️ Enterprise Architecture
- **Hexagonal Architecture (Ports & Adapters)**: Clear separation between business logic and infrastructure
- **Railway Oriented Programming (ROP)**: Elegant error handling with `Result<T>` monads
- **Dependency Inversion**: Interfaces instead of concrete implementations
- **Test-Driven Development (TDD)**: 367 tests with 81.97% coverage

### 🔐 Security and Access Control
- **JWT Authentication** with Passport.js
- **Role-Based Access Control (RBAC)** dynamically loaded from database
- **Complete Audit System** with `@Audit` decorator
- **SHA256 signature validation** for Wompi webhooks
- **PCI DSS Compliant**: No card data storage

### 💳 Payment Processing
- **Wompi Integration** (Sandbox)
- **Asynchronous payments** with client-side polling
- **Multiple payment methods**:
  - 💳 Cards (tokenization)
  - 🏦 Bancolombia Transfers
  - 📱 Nequi
  - 🏛️ PSE (Secure Online Payments)
  - 📲 Bancolombia QR
- **Webhooks** for real-time notifications
- **Automatic fulfillment system** post-payment

### 📊 Database and Persistence
- **PostgreSQL 15+** with TypeORM
- **Versioned migrations** (synchronize: false)
- **Soft Deletes** on all entities
- **Seeder system** for initial data
- **ACID transactions** guaranteed

### 🧪 Testing and Code Quality
- **367 tests passing** (39 suites)
- **81.97% statement coverage**
- **0 ESLint errors**
- Unit, integration, and E2E tests
- Mocks and stubs for external dependencies

---

## 🛠️ Technology Stack

### Core Framework
- **[NestJS](https://nestjs.com/) 11.0.1**: Progressive Node.js framework
- **[TypeScript](https://www.typescriptlang.org/) 5.6.2**: Typed superset of JavaScript
- **[Node.js](https://nodejs.org/) 20+**: Runtime environment

### Database & ORM
- **[PostgreSQL](https://www.postgresql.org/) 15+**: Relational database
- **[TypeORM](https://typeorm.io/) 0.3.28**: ORM for TypeScript
- **[pg](https://node-postgres.com/) 8.14.0**: PostgreSQL client

### Authentication & Security
- **[@nestjs/passport](https://docs.nestjs.com/recipes/passport) 11.0.0**: Authentication middleware
- **[@nestjs/jwt](https://docs.nestjs.com/security/authentication#jwt-token) 11.0.0**: JWT utilities
- **[passport-jwt](http://www.passportjs.org/packages/passport-jwt/) 4.0.1**: JWT strategy
- **[bcrypt](https://www.npmjs.com/package/bcrypt) 6.0.0**: Password hashing

### Validation & Serialization
- **[class-validator](https://github.com/typestack/class-validator) 0.14.1**: Decorator-based validation
- **[class-transformer](https://github.com/typestack/class-transformer) 0.5.1**: Object transformation

### Testing
- **[Jest](https://jestjs.io/) 30.0.0**: Testing framework
- **[@nestjs/testing](https://docs.nestjs.com/fundamentals/testing) 11.0.1**: NestJS test utilities
- **[ts-jest](https://github.com/kulshekhar/ts-jest) 30.0.0**: TypeScript preprocessor

### Payment Integration
- **[Wompi API](https://docs.wompi.co/)**: Colombian payment gateway
- **Sandbox Mode**: Test environment for development

### DevOps & Tools
- **[Docker](https://www.docker.com/)**: Containerization (PostgreSQL)
- **[ESLint](https://eslint.org/) 9.16.0**: Code linting
- **[Prettier](https://prettier.io/)**: Code formatting
- **[Reflect Metadata](https://rbuckton.github.io/reflect-metadata/)**: Decorator metadata

---

## 🏛️ Architecture

### Hexagonal Architecture (Ports & Adapters)

This project implements **Hexagonal Architecture** to keep the business logic completely independent of frameworks and infrastructure details.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   HTTP/REST  │  │   Database   │  │   Payment    │         │
│  │  Controllers │  │  TypeORM     │  │   Wompi      │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────────┐
│         ↓                  ↓                  ↓                  │
│              Application Layer (Use Cases)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RegisterUser  │  Login  │  ProcessCheckout  │  ...      │  │
│  └──────────────────────────────────────────────────────────┘  │
│         ↑                  ↑                  ↑                  │
│         │                  │                  │                  │
│    ┌────┴────┐        ┌────┴────┐       ┌────┴────┐            │
│    │  Ports  │        │  Ports  │       │  Ports  │            │
│    │   IN    │        │   OUT   │       │   OUT   │            │
│    └─────────┘        └─────────┘       └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                             ↓     Domain Layer                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Entities: User, Product, Transaction, Customer, ...     │  │
│  │  Value Objects: Money, Email, Address, ...               │  │
│  │  Domain Events: TransactionApproved, StockReduced, ...   │  │
│  │  Enums: TransactionStatus, RoleName, PaymentMethod       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                   ⚠️ NO FRAMEWORK DEPENDENCIES                   │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Rule

**Dependencies always point inward** (towards the domain):

```
Infrastructure Layer → Application Layer → Domain Layer
    (Adapters)              (Ports)          (Entities)
```

- **Domain Layer**: Pure business entities, no external dependencies
- **Application Layer**: Use cases, interfaces (ports), DTOs
- **Infrastructure Layer**: Concrete implementations (adapters): TypeORM, NestJS controllers, Wompi API

### Request Flow

```
1. HTTP Request → Controller (Infrastructure)
2. Controller → Use Case (Application)
3. Use Case → Domain Entity (Domain)
4. Use Case → Repository Interface (Port OUT)
5. Repository Implementation (Adapter) → Database
6. Response ← Result<T> monad (ROP)
```

---

## 🎨 Design Patterns

### 1. Railway Oriented Programming (ROP)

Functional error handling without exceptions using `Result<T>`:

```typescript
// application/utils/result.ts
export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly error?: string,
    private readonly _value?: T
  ) {}

  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }
}
```

**Usage in Use Cases:**

```typescript
async execute(dto: LoginDto): Promise<Result<TokenResponse>> {
  const user = await this.userRepository.findByEmail(dto.email);
  
  if (!user) {
    return Result.fail('Invalid credentials');
  }

  const isPasswordValid = await this.hashService.compare(
    dto.password,
    user.password
  );

  if (!isPasswordValid) {
    return Result.fail('Invalid credentials');
  }

  const token = this.tokenService.generateToken({ sub: user.id });
  return Result.ok({ accessToken: token });
}
```

### 2. Strategy Pattern

Abstraction of payment gateways to support multiple providers:

```typescript
// application/ports/out/payment-gateway.interface.ts
export interface IPaymentGateway {
  processPayment(
    transactionData: TransactionData,
  ): Promise<Result<PaymentResult, PaymentError>>;
  
  getTransactionStatus(
    transactionId: string,
  ): Promise<Result<PaymentResult, PaymentError>>;
  
  tokenizeCard(
    cardData: CardTokenizationData,
  ): Promise<Result<string, PaymentError>>;
  
  getName(): string;
}

// infrastructure/adapters/payment/wompi/wompi.strategy.ts
@Injectable()
export class WompiStrategy implements IPaymentGateway {
  async processPayment(
    transactionData: TransactionData,
  ): Promise<Result<PaymentResult, PaymentError>> {
    // Wompi-specific implementation using Railway Oriented Programming
    // Returns Result monad for error handling
  }
  
  async getTransactionStatus(
    transactionId: string,
  ): Promise<Result<PaymentResult, PaymentError>> {
    // Check transaction status from Wompi API
  }
  
  async tokenizeCard(
    cardData: CardTokenizationData,
  ): Promise<Result<string, PaymentError>> {
    // Tokenize card data using Wompi API
  }
  
  getName(): string {
    return 'Wompi';
  }
}
```

### 3. Repository Pattern

Data persistence abstraction:

```typescript
// domain/repositories/user.repository.interface.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
}

// infrastructure/adapters/database/typeorm/repositories/user.typeorm.repository.ts
@Injectable()
export class UserTypeOrmRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly ormRepository: Repository<UserEntity>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.ormRepository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }
  
  // ... more methods
}
```

### 4. Use Case Pattern

Each business operation is an independent use case:

```typescript
// application/use-cases/checkout/process-checkout.use-case.ts
@Injectable()
export class ProcessCheckoutUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(TOKENS.PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway
  ) {}

  @Audit('CHECKOUT_PROCESSED')
  async execute(dto: CheckoutDto): Promise<Result<TransactionResponse>> {
    // 1. Validate user
    // 2. Validate products and stock
    // 3. Calculate total
    // 4. Process payment with Wompi
    // 5. Create transaction
    // 6. Return result
  }
}
```

### 5. Dependency Inversion Principle (DIP)

Upper layers depend on abstractions (interfaces), not concrete implementations:

```typescript
// ✅ CORRECT: Dependency on interface (Port)
constructor(
  @Inject(TOKENS.USER_REPOSITORY)
  private readonly userRepository: UserRepository // Interface
) {}

// ❌ INCORRECT: Dependency on concrete implementation
constructor(
  private readonly userRepository: UserTypeOrmRepository // Concrete class
) {}
```

### 6. Decorator Pattern

Audit system through decorators:

```typescript
// infrastructure/adapters/audit/audit.decorator.ts
export function Audit(action: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Log audit entry
      await auditLogger.log({
        action,
        userId: getCurrentUserId(),
        timestamp: new Date(),
        details: { args, result }
      });
      
      return result;
    };
  };
}
```

---

## 🔍 Audit System

The audit system automatically records all critical system operations in the `audit_logs` table.

### Implementation

1. **`@Audit` Decorator**:

```typescript
import { Audit } from '@/infrastructure/adapters/audit/audit.decorator';

@Injectable()
export class ProcessCheckoutUseCase {
  @Audit('CHECKOUT_PROCESSED')
  async execute(dto: CheckoutDto): Promise<Result<TransactionResponse>> {
    // Critical operation
  }
}
```

2. **Audit Interceptor**:

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    const result = await next.handle().toPromise();
    
    // Save audit log
    await this.auditLogRepository.save({
      userId: user?.id,
      action: Reflect.getMetadata('audit:action', context.getHandler()),
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date(),
      requestBody: request.body,
      responseData: result
    });
    
    return result;
  }
}
```

3. **Entidad AuditLog**:

```typescript
@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column()
  userId: string;

  @Column()
  action: string; // 'CHECKOUT_PROCESSED', 'USER_REGISTERED', etc.

  @Column('json', { nullable: true })
  details: any;

  @Column()
  ip: string;

  @Column({ nullable: true })
  userAgent: string;
}
```

### Audited Operations

- ✅ `USER_REGISTERED`: New user registration
- ✅ `USER_LOGIN`: Login
- ✅ `CHECKOUT_PROCESSED`: Checkout processing
- ✅ `TRANSACTION_APPROVED`: Transaction approved
- ✅ `TRANSACTION_DECLINED`: Transaction declined
- ✅ `STOCK_REDUCED`: Inventory reduction
- ✅ `DELIVERY_CREATED`: Delivery creation
- ✅ `ROLE_ASSIGNED`: Role assignment

### Query Audit Logs

```bash
# View last 100 logs
curl http://localhost:3000/api/audit-logs?limit=100

# Filter by user
curl http://localhost:3000/api/audit-logs?userId=<uuid>

# Filter by action
curl http://localhost:3000/api/audit-logs?action=CHECKOUT_PROCESSED
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+
- **npm** or **yarn**

### Installation in 5 Minutes

```bash
# 1. Clone repository
git clone <repository-url>
cd checkout-commerce-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Start PostgreSQL with Docker (optional)
docker-compose up -d

# 5. Run migrations
npm run migration:run

# 6. Run seeders (roles and products)
npm run seed:run

# 7. Start server
npm run start:dev
```

### Environment Variables

Create `.env` file in the project root:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=checkout_commerce

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# Wompi (Sandbox)
WOMPI_PUBLIC_KEY=pub_test_your_public_key
WOMPI_PRIVATE_KEY=prv_test_your_private_key
WOMPI_API_URL=https://sandbox.wompi.co/v1
WOMPI_EVENTS_SECRET=test_events_your_events_secret

# App
PORT=3000
NODE_ENV=development

# Frontend (for CORS)
FRONTEND_URL=http://localhost:4200
```

### Verify Installation

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"2024-01-15T10:30:00.000Z"}
```

### First Test: Complete Flow

```bash
# 1. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "John",
    "lastName": "Doe"
  }'
# Response: { user: {...}, customer: {...}, accessToken: "..." }

# 2. Login (copy the accessToken from the response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
# Response: { user: {...}, accessToken: "..." }

# 3. View available products (no authentication - public endpoint)
curl -X GET http://localhost:3000/api/products
# Response: { statusCode: 200, data: [...] }

# 4. Get Wompi acceptance token (required before checkout)
# Get your PUBLIC_KEY from .env and replace below
curl -X GET "https://api-sandbox.co.uat.wompi.dev/v1/merchants/pub_test_your_public_key_here"
# Response: { presigned_acceptance: { acceptance_token: "..." } }

# 5. Process checkout (copy acceptance_token from previous step)
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "<product-uuid-from-step-3>",
        "quantity": 2
      }
    ],
    "paymentMethod": {
      "type": "CARD",
      "token": "tok_test_12345_1234567890",
      "installments": 1
    },
    "shippingAddress": {
      "addressLine1": "Calle 123 #45-67",
      "addressLine2": "Apto 301",
      "city": "Bogotá",
      "region": "Cundinamarca",
      "country": "CO",
      "postalCode": "110111",
      "recipientName": "John Doe",
      "recipientPhone": "+573001234567"
    },
    "customerEmail": "test@example.com",
    "acceptanceToken": "<acceptance-token-from-step-4>"
  }'
# Response: { statusCode: 201, data: { transactionId: "...", status: "PENDING", ... } }

# 6. Polling: Check transaction status every 5 seconds
curl -X GET http://localhost:3000/api/checkout/status/<transaction-id-from-step-5> \
  -H "Authorization: Bearer <your-access-token>"
# Response: { statusCode: 200, data: { status: "PENDING | APPROVED | DECLINED | ERROR", ... } }

# Repeat step 6 until status changes to APPROVED, DECLINED or ERROR

# 7. (Optional) Retrieve all your transactions - useful after a refresh
curl -X GET http://localhost:3000/api/checkout/my-transactions \
  -H "Authorization: Bearer <your-access-token>"
# Response: { statusCode: 200, data: [{ transactionId, status, items, delivery, ... }, ...] }
# Useful for: recovering progress after refresh, viewing purchase history, finding PENDING transactions
```

---

## 📁 Project Structure

```
checkout-commerce-api/
├── src/
│   ├── domain/                           # 🟦 Domain Layer (Core Business Logic)
│   │   ├── entities/                     # Business entities
│   │   │   ├── user.entity.ts
│   │   │   ├── product.entity.ts
│   │   │   ├── transaction.entity.ts
│   │   │   ├── customer.entity.ts
│   │   │   └── delivery.entity.ts
│   │   ├── enums/                        # Domain enumerations
│   │   │   ├── role-name.enum.ts         # ADMIN, CUSTOMER
│   │   │   └── transaction-status.enum.ts # PENDING, APPROVED, DECLINED
│   │   ├── repositories/                 # Repository interfaces (Ports OUT)
│   │   │   ├── user.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   └── transaction.repository.ts
│   │   └── value-objects/                # Value objects
│   │       ├── money.vo.ts
│   │       └── email.vo.ts
│   │
│   ├── application/                      # 🟨 Application Layer (Use Cases)
│   │   ├── dtos/                         # Data Transfer Objects
│   │   │   ├── auth/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   ├── checkout/
│   │   │   │   └── checkout.dto.ts
│   │   │   └── product/
│   │   │       └── get-products.dto.ts
│   │   ├── ports/                        # Interfaces (Ports)
│   │   │   ├── in/                       # Input Ports (Use Cases)
│   │   │   └── out/                      # Output Ports (External services)
│   │   │       ├── payment-gateway.port.ts
│   │   │       ├── hash.service.port.ts
│   │   │       └── token.service.port.ts
│   │   ├── use-cases/                    # Use cases
│   │   │   ├── auth/
│   │   │   │   ├── login.use-case.ts
│   │   │   │   ├── login.use-case.spec.ts
│   │   │   │   ├── register-user.use-case.ts
│   │   │   │   └── register-user.use-case.spec.ts
│   │   │   ├── checkout/
│   │   │   │   ├── process-checkout.use-case.ts
│   │   │   │   ├── process-checkout.use-case.spec.ts
│   │   │   │   └── check-transaction-status.use-case.ts
│   │   │   ├── product/
│   │   │   │   ├── get-products.use-case.ts
│   │   │   │   └── get-products.use-case.spec.ts
│   │   │   └── admin/
│   │   │       └── ...
│   │   ├── utils/                        # Application utilities
│   │   │   └── result.ts                 # Railway Oriented Programming
│   │   └── tokens.ts                     # Dependency Injection tokens
│   │
│   ├── infrastructure/                   # 🟩 Infrastructure Layer (Adapters)
│   │   ├── adapters/
│   │   │   ├── auth/
│   │   │   │   ├── bcrypt-hash.service.ts
│   │   │   │   └── jwt-token.service.ts
│   │   │   ├── database/
│   │   │   │   └── typeorm/
│   │   │   │       ├── entities/         # TypeORM entities
│   │   │   │       │   ├── user.typeorm-entity.ts
│   │   │   │       │   ├── product.typeorm-entity.ts
│   │   │   │       │   └── ...
│   │   │   │       ├── repositories/     # Repository implementations
│   │   │   │       │   ├── user.typeorm.repository.ts
│   │   │   │       │   └── ...
│   │   │   │       ├── migrations/       # Database migrations
│   │   │   │       │   ├── 1701234567890-CreateUsersTable.ts
│   │   │   │       │   └── ...
│   │   │   │       └── seeds/            # Seeders
│   │   │   │           ├── role.seeder.ts
│   │   │   │           └── product.seeder.ts
│   │   │   ├── http/
│   │   │   │   └── controllers/
│   │   │   │       ├── auth.controller.ts
│   │   │   │       ├── checkout.controller.ts
│   │   │   │       └── product.controller.ts
│   │   │   ├── payment/
│   │   │   │   └── wompi/
│   │   │   │       ├── wompi.adapter.ts
│   │   │   │       └── wompi.webhook.controller.ts
│   │   │   └── web/
│   │   │       └── ...
│   │   ├── config/                       # Configuration
│   │   │   ├── database.config.ts
│   │   │   ├── typeorm.config.ts
│   │   │   └── i18n/
│   │   └── modules/                      # NestJS modules
│   │       ├── auth.module.ts
│   │       ├── checkout.module.ts
│   │       ├── database.module.ts
│   │       └── product.module.ts
│   │
│   ├── app.module.ts                     # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── main.ts                           # Entry point
│   └── ARCHITECTURE.md                   # Architecture documentation
│
├── test/                                 # Tests E2E
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── coverage/                             # Coverage reports
│   ├── lcov-report/
│   └── coverage-final.json
│
├── docker-compose.yml                    # Docker Compose for PostgreSQL
├── .env.example                          # Environment variables example
├── package.json
├── tsconfig.json
├── nest-cli.json
├── eslint.config.mjs                     # ESLint configuration
└── README.md                             # This file
```

### Layer Nomenclature

- **🟦 Domain Layer**: Blue - Pure business logic, no external dependencies
- **🟨 Application Layer**: Yellow - Use cases, orchestration
- **🟩 Infrastructure Layer**: Green - Technical details, frameworks, databases

---

## 🌐 API Endpoints

### Authentication

#### POST `/api/auth/register`

Register new user and automatically create customer profile.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validations:**
- Email: Valid format
- Password: Minimum 8 characters, must contain uppercase, lowercase and number
- firstName: 2-50 characters
- lastName: 2-50 characters

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "roleId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "roleName": "CUSTOMER"
    },
    "customer": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Possible Errors:**
- `409 Conflict`: Email already exists
- `400 Bad Request`: Validation failed or customer role not found

---

#### POST `/api/auth/login`

Login and obtain JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "roleId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "roleName": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Possible Errors:**
- `401 Unauthorized`: Invalid credentials or user not found

**JWT Token:**
- Payload: `{ sub: userId, email, roleId, roleName }`
- Expiration: Configurable (default: 1d)
- Required header: `Authorization: Bearer <token>`

---

### Products

#### GET `/api/products`

List all available products with stock greater than 0. **Public endpoint** (no authentication required).

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "Laptop HP Pavilion",
      "description": "Laptop HP Pavilion 15.6\" Intel Core i5 8GB RAM 256GB SSD",
      "price": 2499000,
      "stock": 15
    },
    {
      "id": "b1ffcd00-ad1c-5fg9-cc7e-7cc0ce491b22",
      "name": "Mouse Logitech MX Master 3",
      "description": "Wireless ergonomic mouse for productivity",
      "price": 349000,
      "stock": 42
    }
  ]
}
```

**Notes:**
- Does not require authentication (public endpoint)
- Only returns products with stock > 0
- Returns empty array if there's an error or no products
- Prices in Colombian pesos (COP)

---

### Checkout

#### POST `/api/checkout`

Process checkout and create payment transaction with Wompi. **Requires authentication** and **CUSTOMER** role.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "quantity": 2
    },
    {
      "productId": "b1ffcd00-ad1c-5fg9-cc7e-7cc0ce491b22",
      "quantity": 1
    }
  ],
  "paymentMethod": {
    "type": "CARD",
    "token": "tok_test_12345_1234567890",
    "installments": 1
  },
  "shippingAddress": {
    "addressLine1": "Calle 123 #45-67",
    "addressLine2": "Apto 301",
    "city": "Bogotá",
    "region": "Cundinamarca",
    "country": "CO",
    "postalCode": "110111",
    "recipientName": "John Doe",
    "recipientPhone": "+573001234567"
  },
  "customerEmail": "user@example.com",
  "acceptanceToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Required Fields:**
- `items[]`: Array with productId and quantity (minimum 1 item)
- `paymentMethod`: Type and data according to payment method
- `shippingAddress`: Complete delivery address
- `customerEmail`: Customer email (must match authenticated user)
- `acceptanceToken`: Wompi terms acceptance token (obtained from GET `https://api-sandbox.co.uat.wompi.dev/v1/merchants/{public_key}`)

**Payment Method Types:**

**1. CARD (Card - Option A: Pre-generated token)**
```json
{
  "type": "CARD",
  "token": "tok_test_12345_1234567890",
  "installments": 1
}
```

**2. CARD (Card - Option B: Card data to tokenize in backend)**
```json
{
  "type": "CARD",
  "cardData": {
    "number": "4242424242424242",
    "cvc": "123",
    "exp_month": "12",
    "exp_year": "25",
    "card_holder": "John Doe"
  },
  "installments": 1
}
```

**3. NEQUI**
```json
{
  "type": "NEQUI",
  "phoneNumber": "3001234567"
}
```

**4. BANCOLOMBIA_TRANSFER**
```json
{
  "type": "BANCOLOMBIA_TRANSFER"
}
```

**5. PSE (Bank debit)**
```json
{
  "type": "PSE",
  "userType": "NATURAL",
  "financialInstitutionCode": "1040"
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "message": "Checkout processed successfully",
  "data": {
    "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "wompiTransactionId": "52341-1648075828-38648",
    "status": "PENDING",
    "amount": 5347000,
    "currency": "COP",
    "reference": "REF-1648075828-38648",
    "paymentMethod": "CARD"
  }
}
```

⚠️ **IMPORTANT - Wompi Asynchronous Flow**: 

**All Wompi payments return `status: "PENDING"` initially.** The client must:

1. **Receive the response** with `transactionId`, `statusToken` and `status: "PENDING"`
2. **Start polling**: Make GET requests `/api/checkout/status?token=<statusToken>` every **5 seconds**
3. **Wait for final status**: `APPROVED`, `DECLINED` or `ERROR`
4. **Update UI** when status changes

**Possible final statuses:**
- ✅ `APPROVED`: Successful payment - Stock reduced, delivery created
- ❌ `DECLINED`: Payment rejected - Check `errorCode` and `errorMessage`
- ⚠️ `ERROR`: Processing error - Contact support

**Possible Errors:**
- `400 Bad Request`: Validation failed (missing/invalid fields)
- `400 Insufficient Stock`: Product without sufficient stock
- `400 Product Not Found`: Product doesn't exist or is deleted
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User doesn't have CUSTOMER role

---

#### POST `/api/checkout/guest`

Process checkout as guest (without account). **No authentication required** - Public endpoint.

Allows users to make purchases without registering. Transactions are tracked by email and can be automatically linked if the user registers later with the same email.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "quantity": 1
    }
  ],
  "paymentMethod": {
    "type": "CARD",
    "token": "tok_test_12345_1234567890",
    "installments": 1
  },
  "shippingAddress": {
    "addressLine1": "Calle 123 #45-67",
    "city": "Bogotá",
    "region": "Cundinamarca",
    "country": "CO",
    "postalCode": "110111",
    "recipientName": "John Doe",
    "recipientPhone": "+573001234567"
  },
  "customerEmail": "guest@example.com",
  "acceptanceToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "message": "Checkout processed successfully",
  "data": {
    "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "wompiTransactionId": "52341-1648075828-38648",
    "status": "PENDING",
    "amount": 2499000,
    "currency": "COP",
    "reference": "REF-1648075828-38648",
    "paymentMethod": "CARD",
    "statusToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes:**
- The `statusToken` is used to query transaction status (GET `/api/checkout/status?token=<statusToken>`)
- Token expires in 24 hours
- If user registers later with same email, they can view these transactions in `/api/checkout/me/transactions`

**Possible Errors:**
- `400 Bad Request`: Validation failed, insufficient stock or product not found
- `500 Internal Server Error`: Error in payment processing

---

#### GET `/api/checkout/status?token=<statusToken>`

Query transaction status (for polling). **Public endpoint** - Accessible for both authenticated users and guests.

**Query Parameters:**
- `token`: JWT statusToken received in checkout response (valid for 24h)

**Security:**
- Token contains `transactionId` and customer `email`
- Only allows access to the specific transaction associated with the token
- Expires in 24 hours from creation

**Response:** `200 OK`

**Case 1: PENDING transaction (still processing)**
```json
{
  "statusCode": 200,
  "message": "Transaction status queried",
  "data": {
    "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "wompiTransactionId": "52341-1648075828-38648",
    "status": "PENDING",
    "amount": 5347000,
    "currency": "COP",
    "reference": "REF-1648075828-38648",
    "paymentMethod": "CARD"
  }
}
```

**Case 2: APPROVED transaction (successful payment)**
```json
{
  "statusCode": 200,
  "message": "Transaction status queried",
  "data": {
    "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "wompiTransactionId": "52341-1648075828-38648",
    "status": "APPROVED",
    "amount": 5347000,
    "currency": "COP",
    "reference": "REF-1648075828-38648",
    "paymentMethod": "CARD",
    "deliveryId": "d3e4f5a6-78bc-45de-9012-3456789abcde",
    "items": [
      {
        "productId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "productName": "Laptop HP Pavilion",
        "quantity": 2,
        "unitPrice": 2499000,
        "subtotal": 4998000
      },
      {
        "productId": "b1ffcd00-ad1c-5fg9-cc7e-7cc0ce491b22",
        "productName": "Mouse Logitech MX Master 3",
        "quantity": 1,
        "unitPrice": 349000,
        "subtotal": 349000
      }
    ]
  }
}
```

**Case 3: DECLINED transaction (payment rejected)**
```json
{
  "statusCode": 200,
  "message": "Transaction status queried",
  "data": {
    "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "wompiTransactionId": "52341-1648075828-38648",
    "status": "DECLINED",
    "amount": 5347000,
    "currency": "COP",
    "reference": "REF-1648075828-38648",
    "paymentMethod": "CARD",
    "errorCode": "DECLINED",
    "errorMessage": "Insufficient funds on card"
  }
}
```

**Possible Errors:**
- `404 Not Found`: Transaction not found
- `400 Bad Request`: Error querying status
- `401 Unauthorized`: Invalid or expired token

---

#### GET `/api/checkout/me/transactions`

Get all transactions for the authenticated customer. **Requires authentication** and **CUSTOMER** role.

This endpoint allows recovering transaction progress after a refresh, improving application resilience.

**Note:** This endpoint now searches for transactions by both `customerId` and customer `email`. This allows:
- Showing guest checkout transactions if user registers later with same email
- Preparing system for future guest checkout flows
- Automatically combining and deduplicating all user transactions

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`

```json
{
  "statusCode": 200,
  "message": "Transactions retrieved",
  "data": [
    {
      "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "reference": "REF-1648075828-38648",
      "status": "APPROVED",
      "amount": 1299.99,
      "currency": "COP",
      "paymentMethod": "CARD",
      "wompiTransactionId": "12345-1648075828-38648",
      "errorCode": null,
      "errorMessage": null,
      "createdAt": "2024-01-15T10:30:28.000Z",
      "updatedAt": "2024-01-15T10:31:15.000Z",
      "items": [
        {
          "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "productName": "Laptop Dell XPS 13",
          "quantity": 1,
          "unitPrice": 1299.99,
          "subtotal": 1299.99
        }
      ],
      "delivery": {
        "deliveryId": "d1e2f3g4-h5i6-7890-jklm-no1234567890",
        "status": "PENDING",
        "trackingNumber": "TRK-1234567890",
        "recipientName": "Juan Pérez",
        "address": "Calle 123 #45-67, Apto 101",
        "city": "Bogotá",
        "estimatedDelivery": "2024-01-18T00:00:00.000Z",
        "actualDelivery": null
      }
    },
    {
      "transactionId": "a2b3c4d5-e6f7-8901-bcde-f12345678901",
      "reference": "REF-1648000000-12345",
      "status": "PENDING",
      "amount": 799.99,
      "currency": "COP",
      "paymentMethod": "NEQUI",
      "wompiTransactionId": "98765-1648000000-12345",
      "errorCode": null,
      "errorMessage": null,
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z",
      "items": [
        {
          "productId": "b2c3d4e5-f6g7-8901-cdef-g23456789012",
          "productName": "Samsung Galaxy S24",
          "quantity": 1,
          "unitPrice": 799.99,
          "subtotal": 799.99
        }
      ]
    }
  ]
}
```

**Notes:**
- Transactions are returned ordered by creation date (most recent first)
- `delivery` field is only present if transaction was APPROVED and delivery was created
- PENDING transactions might not have `delivery` yet
- Useful for recovering transaction status after page refresh

**Possible Errors:**
- `400 Bad Request`: Error getting transactions
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User doesn't have CUSTOMER role

---

### Webhooks (Wompi)

#### POST `/api/webhooks/wompi`

Endpoint to receive Wompi notifications. **No authentication required** (validation via SHA256 signature).

**Headers:**
```
X-Wompi-Signature: sha256-signature-here
Content-Type: application/json
```

**Request Body:**
```json
{
  "event": "transaction.updated",
  "data": {
    "transaction": {
      "id": "wompi-transaction-id",
      "status": "APPROVED",
      "amount_in_cents": 19998,
      "reference": "internal-transaction-uuid"
    }
  },
  "timestamp": "2024-01-15T10:31:00.000Z"
}
```

**Validación de Firma:**
```typescript
// SHA256(timestamp.JSON.stringify(event) + events_secret)
const signature = crypto
  .createHmac('sha256', WOMPI_EVENTS_SECRET)
  .update(timestamp + JSON.stringify(eventData) + WOMPI_EVENTS_SECRET)
  .digest('hex');
```

---

## 🧪 Testing

### Coverage Statistics

```
=============================== Coverage summary ===============================
Statements   : 81.97%
Branches     : 64.83%
Functions    : 79.51%
Lines        : 81.21%
================================================================================
Test Suites: 39 passed, 39 total
Tests:       367 passed, 367 total
Snapshots:   0 total
Time:        4.582 s
```

### Run Tests

```bash
# All tests (unit + integration + E2E)
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:cov

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Unit Test Example (Use Case)

```typescript
// login.use-case.spec.ts
describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let hashService: jest.Mocked<HashService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
    } as any;

    hashService = {
      compare: jest.fn(),
    } as any;

    tokenService = {
      generateToken: jest.fn(),
    } as any;

    useCase = new LoginUseCase(userRepository, hashService, tokenService);
  });

  it('should return success with token when credentials are valid', async () => {
    const user = { id: '123', email: 'test@example.com', password: 'hashed' };
    userRepository.findByEmail.mockResolvedValue(user);
    hashService.compare.mockResolvedValue(true);
    tokenService.generateToken.mockReturnValue('jwt-token');

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({ accessToken: 'jwt-token' });
  });

  it('should return failure when user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'nonexistent@example.com',
      password: 'password123'
    });

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
```

---

## 💳 Wompi Integration

### Description

**Wompi** is the integrated payment gateway for processing electronic transactions. The project uses **Sandbox** mode for testing.

### Asynchronous Payment Flow

```
┌──────────┐           ┌──────────┐           ┌──────────┐
│  Client  │           │   API    │           │  Wompi   │
└────┬─────┘           └────┬─────┘           └────┬─────┘
     │                      │                      │
     │  1. POST /checkout   │                      │
     ├─────────────────────>│                      │
     │                      │  2. Create Transaction│
     │                      ├─────────────────────>│
     │                      │                      │
     │                      │  3. PENDING          │
     │                      │<─────────────────────┤
     │  4. Return PENDING + │                      │
     │     paymentUrl       │                      │
     │<─────────────────────┤                      │
     │                      │                      │
     │  5. Redirect to URL  │                      │
     ├─────────────────────────────────────────────>│
     │                      │                      │
     │  6. User completes   │                      │
     │     payment          │                      │
     │                      │                      │
     │                      │  7. Webhook: APPROVED│
     │                      │<─────────────────────┤
     │                      │  8. Process Fulfillment
     │                      │                      │
     │  9. Poll /transactions/:id                  │
     ├─────────────────────>│                      │
     │  10. Return APPROVED │                      │
     │<─────────────────────┤                      │
     │                      │                      │
```

### Supported Payment Methods

| Method | Code | Description |
|--------|--------|-------------|
| Credit/Debit Card | `CARD` | Secure tokenization, no card data storage |
| Nequi | `NEQUI` | Mobile payment with phone number |
| PSE | `PSE` | Secure Online Payments (bank account debit) |
| Bancolombia Transfer | `BANCOLOMBIA_TRANSFER` | Transfer from Bancolombia account |
| Bancolombia QR | `BANCOLOMBIA_QR` | QR code payment |

### Configuration

Required environment variables:

```bash
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_API_URL=https://sandbox.wompi.co/v1
WOMPI_EVENTS_SECRET=test_events_xxxxx
```

### Webhook System

Wompi sends notifications when a transaction status changes:

**Endpoint:** `POST /api/webhooks/wompi`

**Signature Validation:**

```typescript
// Calcular checksum esperado
const checksum = crypto
  .createHmac('sha256', process.env.WOMPI_EVENTS_SECRET)
  .update(`${timestamp}${JSON.stringify(event.data)}${process.env.WOMPI_EVENTS_SECRET}`)
  .digest('hex');

// Compare with received signature
if (checksum !== event.signature.checksum) {
  throw new UnauthorizedException('Invalid signature');
}
```

**Supported Events:**
- `transaction.updated`: Transaction status change

### Fulfillment System

When a transaction is **APPROVED**, it automatically executes:

1. ✅ **Stock Reduction**: Decreases product inventory
2. ✅ **Delivery Creation**: Generates delivery record with tracking number
3. ✅ **Audit Log**: Records operation in `audit_logs`
4. ✅ **Notification** (future): Sends email to customer

```typescript
// infrastructure/adapters/payment/wompi/fulfillment.service.ts
async processFulfillment(transaction: Transaction) {
  // 1. Reduce stock
  for (const item of transaction.items) {
    await this.productRepository.reduceStock(item.productId, item.quantity);
  }

  // 2. Create delivery
  const delivery = await this.deliveryRepository.create({
    transactionId: transaction.id,
    status: 'PREPARING',
    trackingNumber: generateTrackingNumber(),
    estimatedDelivery: addDays(new Date(), 3)
  });

  // 3. Audit log
  await this.auditLogger.log({
    action: 'FULFILLMENT_PROCESSED',
    transactionId: transaction.id,
    details: { delivery }
  });
}
```

---

## 🗄️ Database

### Entity Diagram

```
┌──────────────────┐        
│    BaseEntity    │        
├──────────────────┤        
│ createdAt        │        
│ updatedAt        │        
│ deletedAt        │        
└──────────────────┘        
         △                  
         │ (extends)        
         │                  
    ┌────┴────┬────────────────────────────────────┐
    │         │                                     │
┌───┴─────┐   │  ┌─────────────┐         ┌────────┴──────┐
│  User   │   │  │  Customer   │         │   Product     │
├─────────┤   │  ├─────────────┤         ├───────────────┤
│ id (PK) │───┼──┤ id (PK)     │         │ id (PK)       │
│ email   │1  │1 │ userId (FK) │         │ name          │
│ password│   │  │ firstName   │         │ description   │
│ roleId  │───┤  │ lastName    │         │ price         │
└─────────┘   │  │ phone       │         │ stock         │
    │ M       │  │ address     │         └───────┬───────┘
    │         │  │ city        │                 │
┌───┴──────┐  │  │ country     │                 │ M
│   Role   │  │  └─────────────┘                 │
├──────────┤  │         │                        │
│ id (PK)  │  │         │ 1                      │
│ name     │  │         │                        │
│ descr.   │  │         │                        │
└──────────┘  │  ┌──────┴──────────┐             │
              │  │  Transaction    │             │
              │  ├─────────────────┤             │
              │  │ id (PK)         │             │
              └──┤ customerId (FK) │             │
                 │ reference       │             │
                 │ status          │         1   │
                 │ amount          │───────┬─────┘
                 │ paymentMethod   │       │ M
                 │ ipAddress       │   ┌───┴───────────────┐
                 │ wompiTxnId      │   │ TransactionItem   │
                 │ errorCode       │   ├───────────────────┤
                 │ errorMessage    │   │ id (PK)           │
                 └─────────┬───────┘   │ transactionId (FK)│
                           │ 1         │ productId (FK)    │
                           │           │ productName       │
                    ┌──────┴────────┐  │ quantity          │
                    │   Delivery    │  │ unitPrice         │
                    ├───────────────┤  │ subtotal          │
                    │ id (PK)       │  └───────────────────┘
                    │ customerId FK │
                    │ transactionId │  ┌───────────────┐
                    │ address       │  │   AuditLog    │
                    │ city          │  ├───────────────┤
                    │ recipientName │  │ id (PK)       │
                    │ recipientPhone│  │ userId (FK)   │
                    │ trackingNumber│  │ roleName      │
                    │ status        │  │ action        │
                    │ estimatedDlv  │  │ timestamp     │
                    │ actualDlv     │  │ metadata      │
                    └───────────────┘  └───────────────┘
```

**Main Entities:**

1. **BaseEntity**: Abstract class with timestamps and soft delete (createdAt, updatedAt, deletedAt)
2. **User**: Authentication (email, password, roleId) - ManyToOne relationship with Role
3. **Role**: System roles (ADMIN, CUSTOMER) - RoleName Enum
4. **Customer**: Customer profile (OneToOne with User) - firstName, lastName, phone, address, city, country
5. **Product**: Available products (name, description, price, stock)
6. **Transaction**: Payment transactions (Wompi integration) - reference, status, amount, paymentMethod, ipAddress, wompiTransactionId, errorCode, errorMessage
7. **TransactionItem**: Transaction items (productName snapshot, quantity, unitPrice, subtotal)
8. **Delivery**: Deliveries (address, recipientName, recipientPhone, trackingNumber, status, estimatedDelivery, actualDelivery)
9. **AuditLog**: Audit logs (userId, roleName, action, timestamp, metadata JSONB)

### Migrations

The project uses **TypeORM migrations** with `synchronize: false` for full control of database changes.

#### Create New Migration

```bash
# Generate automatic migration (based on entity changes)
npm run migration:generate -- -n CreateUsersTable

# Create empty migration
npm run migration:create -- -n AddIndexToUsers
```

#### Run Migrations

```bash
# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

#### Migration Example

```typescript
// migrations/1701234567890-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1701234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Create index
    await queryRunner.createIndex('users', {
      name: 'IDX_users_email',
      columnNames: ['email']
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### Seeders

Seeders populate the database with initial data:

```bash
# Run all seeders
npm run seed:run

# Available seeders:
# - RoleSeeder: ADMIN and CUSTOMER roles
# - ProductSeeder: 10 example products
```

#### Seeder Example

```typescript
// seeds/role.seeder.ts
export class RoleSeeder {
  public async run(connection: Connection): Promise<void> {
    const roleRepository = connection.getRepository(Role);

    const roles = [
      { name: 'ADMIN', description: 'Administrator with full access' },
      { name: 'CUSTOMER', description: 'Regular customer' }
    ];

    for (const roleData of roles) {
      const exists = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!exists) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
      }
    }
  }
}
```

### Soft Deletes

All entities inherit from `BaseEntity` which includes soft delete:

```typescript
@Entity()
export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at'})
  deletedAt: Date;
}
```

**Usage:**

```typescript
// Soft delete (doesn't physically delete)
await userRepository.softDelete(userId);

// Restore
await userRepository.restore(userId);

// Exclude soft-deleted by default
await userRepository.find(); // Only active users

// Include soft-deleted
await userRepository.find({ withDeleted: true });
```

---

## 🔐 Security and Authentication

### JWT Authentication

The system uses **JSON Web Tokens (JWT)** for stateless authentication.

#### Authentication Flow

```
┌──────────┐                ┌─────────┐                ┌──────────┐
│  Client  │                │   API   │                │   DB     │
└────┬─────┘                └────┬────┘                └────┬─────┘
     │                           │                          │
     │  POST /api/auth/login     │                          │
     ├──────────────────────────>│                          │
     │ {email, password}          │                          │
     │                           │  1. Find user by email   │
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │  2. User data            │
     │                           │<─────────────────────────┤
     │                           │                          │
     │                           │  3. Verify password      │
     │                           │     (bcrypt.compare)     │
     │                           │                          │
     │                           │  4. Generate JWT         │
     │                           │     (sign with secret)   │
     │                           │                          │
     │  5. Return JWT            │                          │
     │<──────────────────────────┤                          │
     │ { accessToken, user }     │                          │
     │                           │                          │
     │  6. Subsequent requests   │                          │
     │     with Authorization    │                          │
     │     header                │                          │
     ├──────────────────────────>│                          │
     │ Bearer <jwt-token>        │                          │
     │                           │  7. Verify & decode JWT  │
     │                           │                          │
     │  8. Protected resource    │                          │
     │<──────────────────────────┤                          │
```

#### Implementation

**1. Generate Token**

```typescript
// infrastructure/adapters/auth/jwt-token.service.ts
@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: TokenPayload): string {
    return this.jwtService.sign({
      sub: payload.userId,
      email: payload.email,
      roles: payload.roles
    });
  }

  verifyToken(token: string): TokenPayload {
    return this.jwtService.verify(token);
  }
}
```

**2. Protect Routes**

```typescript
// infrastructure/adapters/http/controllers/product.controller.ts
@Controller('products')
@UseGuards(JwtAuthGuard) // 👈 Protect entire controller
export class ProductController {
  @Get()
  async getProducts(@Request() req) {
    const userId = req.user.id; // Authenticated user
    return this.getProductsUseCase.execute();
  }
}
```

**3. Custom Guards**

```typescript
// infrastructure/adapters/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
```

### RBAC (Role-Based Access Control)

Dynamic role-based access control system from database.

#### Available Roles

- **ADMIN**: Full system access
- **CUSTOMER**: Access to customer operations (checkout, view products)

#### Implementation

**1. Role Decorator**

```typescript
// infrastructure/adapters/auth/decorators/roles.decorator.ts
export const Roles = (...roles: RoleName[]) => SetMetadata('roles', roles);
```

**2. Role Guards**

```typescript
// infrastructure/adapters/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**3. Usage in Controllers**

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // 👈 Both guards
@Roles(RoleName.ADMIN) // 👈 Administrators only
export class AdminController {
  @Get('users')
  async getAllUsers() {
    return this.getAllUsersUseCase.execute();
  }

  @Post('users/:id/roles')
  @Roles(RoleName.ADMIN)
  async assignRole(@Param('id') userId: string, @Body() dto: AssignRoleDto) {
    return this.assignRoleUseCase.execute(userId, dto);
  }
}
```

### Password Hashing

Passwords are hashed with **bcrypt** (10 rounds):

```typescript
// infrastructure/adapters/auth/bcrypt-hash.service.ts
@Injectable()
export class BcryptHashService implements HashServicePort {
  private readonly SALT_ROUNDS = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
```

### CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

---

## 📜 Available Scripts

```bash
# Development
npm run start          # Start in development mode
npm run start:dev      # Start with auto-reload (watch mode)
npm run start:debug    # Start with debugger
npm run start:prod     # Start in production mode

# Build
npm run build          # Compile TypeScript

# Testing
npm test               # Run all tests
npm run test:watch     # Tests in watch mode
npm run test:cov       # Tests with coverage
npm run test:debug     # Tests with debugger
npm run test:e2e       # End-to-end tests

# Linting
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint and auto-fix

# Database
npm run migration:generate -- -n MigrationName    # Generate migration
npm run migration:create -- -n MigrationName      # Create empty migration
npm run migration:run                             # Run migrations
npm run migration:revert                          # Revert last migration
npm run migration:show                            # Show status
npm run seed:run                                  # Run seeders

# Other
npm run format         # Format code with Prettier
```

---

## 📚 Additional Documentation

For more detailed information on specific components, see:

- **[ARCHITECTURE.md](./src/ARCHITECTURE.md)** - Detailed hexagonal architecture documentation
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide (5 minutes)
- **[CHECKOUT_TESTING_GUIDE.md](./CHECKOUT_TESTING_GUIDE.md)** - Complete guide for testing checkout flow
- **[AUTHENTICATION_USAGE.md](./AUTHENTICATION_USAGE.md)** - JWT and RBAC implementation
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - PostgreSQL configuration and migrations
- **[MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)** - Migration management with TypeORM
- **[FULFILLMENT.md](./FULFILLMENT.md)** - Post-payment fulfillment system
- **[payment_methods.doc.md](./payment_methods.doc.md)** - Wompi payment methods reference
- **[trasnsactions.doc.md](./trasnsactions.doc.md)** - Wompi transactions API
- **[events.doc.md](./events.doc.md)** - Wompi webhook system

---

## 🤝 Contribution

### Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-functionality`
3. Commit changes: `git commit -m 'Add new functionality'`
4. Push to branch: `git push origin feature/new-functionality`
5. Create Pull Request

### Code Standards

- ✅ **ESLint**: 0 errors required
- ✅ **Tests**: Coverage >= 80%
- ✅ **Commits**: Conventional Commits format
- ✅ **TypeScript**: Strict mode enabled
- ✅ **Architecture**: Respect hexagonal layers

### Conventional Commits

```
feat: Add new functionality
fix: Fix bug in checkout
docs: Update README
test: Add tests for login
refactor: Refactor user repository
perf: Optimize products query
```

---

## 📄 License

This project is under the MIT license. See the [LICENSE](./LICENSE) file for more details.

---

## 👤 Author

**Your Name** - [@your-username](https://github.com/your-username)

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Base framework
- [Wompi](https://wompi.co/) - Payment gateway
- [TypeORM](https://typeorm.io/) - ORM
- [Alexandro Hdez](https://github.com/CodePawsDev) - Original architecture inspiration

---

<p align="center">
  Made with ❤️ using NestJS
</p>

<p align="center">
  <img src="https://img.shields.io/badge/coverage-81.97%25-brightgreen?style=flat-square" alt="Coverage" />
  <img src="https://img.shields.io/badge/tests-367%20passing-success?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/lint-0%20errors-success?style=flat-square" alt="Lint" />
</p>
