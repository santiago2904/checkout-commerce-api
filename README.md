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
  <img src="https://img.shields.io/badge/coverage-81.48%25-brightgreen?style=flat-square" alt="Coverage" />
  <img src="https://img.shields.io/badge/tests-327%20passing-success?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/lint-0%20errors-success?style=flat-square" alt="Lint" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
</p>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Arquitectura](#️-arquitectura)
- [Patrones de Diseño](#-patrones-de-diseño)
- [Sistema de Auditoría](#-sistema-de-auditoría)
- [Quick Start](#-quick-start)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Integración con Wompi](#-integración-con-wompi)
- [Base de Datos](#-base-de-datos)
- [Seguridad y Autenticación](#-seguridad-y-autenticación)
- [Scripts Disponibles](#-scripts-disponibles)
- [Documentación Adicional](#-documentación-adicional)

---

## 🎯 Descripción

**Checkout Commerce API** es un backend robusto y escalable para flujos de checkout y pagos electrónicos, integrado con la pasarela de pagos **Wompi** (modo Sandbox). El proyecto está construido con **NestJS**, **TypeScript** y **TypeORM**, siguiendo las mejores prácticas de arquitectura de software y patrones de diseño modernos.

Este sistema maneja el ciclo completo de una transacción de comercio electrónico:
- ✅ Registro y autenticación de usuarios con JWT
- ✅ Gestión de productos y stock en tiempo real
- ✅ Procesamiento asíncrono de pagos con múltiples métodos (Tarjeta, Nequi, PSE, Bancolombia)
- ✅ Sistema de fulfillment automático (reducción de stock, creación de deliveries)
- ✅ Auditoría completa de operaciones críticas
- ✅ Sistema de webhooks para notificaciones de Wompi
- ✅ Control de acceso basado en roles (RBAC) dinámico

---

## ✨ Características Principales

### 🏗️ Arquitectura Empresarial
- **Hexagonal Architecture (Ports & Adapters)**: Separación clara entre lógica de negocio e infraestructura
- **Railway Oriented Programming (ROP)**: Manejo de errores elegante con `Result<T>` monads
- **Dependency Inversion**: Interfaces en lugar de implementaciones concretas
- **Test-Driven Development (TDD)**: 327 tests con 81.48% de cobertura

### 🔐 Seguridad y Control de Acceso
- **JWT Authentication** con Passport.js
- **Role-Based Access Control (RBAC)** dinámico desde base de datos
- **Sistema de Auditoría** completo con decorador `@Audit`
- **Validación de firmas SHA256** para webhooks de Wompi
- **PCI DSS Compliant**: Sin almacenamiento de datos de tarjetas

### 💳 Procesamiento de Pagos
- **Integración con Wompi** (Sandbox)
- **Pagos asíncronos** con polling desde el cliente
- **Múltiples métodos de pago**:
  - 💳 Tarjetas (tokenización)
  - 🏦 Transferencias Bancolombia
  - 📱 Nequi
  - 🏛️ PSE (Pagos Seguros en Línea)
  - 📲 QR Bancolombia
- **Webhooks** para notificaciones en tiempo real
- **Sistema de fulfillment** automático post-pago

### 📊 Base de Datos y Persistencia
- **PostgreSQL 15+** con TypeORM
- **Migraciones versionadas** (synchronize: false)
- **Soft Deletes** en todas las entidades
- **Sistema de Seeders** para datos iniciales
- **Transacciones ACID** garantizadas

### 🧪 Testing y Calidad de Código
- **327 tests passing** (36 suites)
- **81.48% statement coverage**
- **0 ESLint errors**
- Tests unitarios, de integración y E2E
- Mocks y stubs para dependencias externas

---

## 🛠️ Stack Tecnológico

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

## 🏛️ Arquitectura

### Hexagonal Architecture (Ports & Adapters)

Este proyecto implementa **Arquitectura Hexagonal** para mantener la lógica de negocio completamente independiente de frameworks y detalles de infraestructura.

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

### Regla de Dependencias

**Las dependencias siempre apuntan hacia adentro** (hacia el dominio):

```
Infrastructure Layer → Application Layer → Domain Layer
    (Adapters)              (Ports)          (Entities)
```

- **Domain Layer**: Entidades puras de negocio, sin dependencias externas
- **Application Layer**: Casos de uso, interfaces (ports), DTOs
- **Infrastructure Layer**: Implementaciones concretas (adapters): TypeORM, NestJS controllers, Wompi API

### Flujo de una Petición

```
1. HTTP Request → Controller (Infrastructure)
2. Controller → Use Case (Application)
3. Use Case → Domain Entity (Domain)
4. Use Case → Repository Interface (Port OUT)
5. Repository Implementation (Adapter) → Database
6. Response ← Result<T> monad (ROP)
```

---

## 🎨 Patrones de Diseño

### 1. Railway Oriented Programming (ROP)

Manejo de errores funcional sin excepciones usando `Result<T>`:

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

**Uso en Use Cases:**

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

Abstracción de pasarelas de pago para soportar múltiples proveedores:

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

Abstracción de persistencia de datos:

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
  
  // ... más métodos
}
```

### 4. Use Case Pattern

Cada operación de negocio es un caso de uso independiente:

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
    // 1. Validar usuario
    // 2. Validar productos y stock
    // 3. Calcular total
    // 4. Procesar pago con Wompi
    // 5. Crear transacción
    // 6. Retornar resultado
  }
}
```

### 5. Dependency Inversion Principle (DIP)

Las capas superiores dependen de abstracciones (interfaces), no de implementaciones concretas:

```typescript
// ✅ CORRECTO: Dependencia de interfaz (Puerto)
constructor(
  @Inject(TOKENS.USER_REPOSITORY)
  private readonly userRepository: UserRepository // Interface
) {}

// ❌ INCORRECTO: Dependencia de implementación concreta
constructor(
  private readonly userRepository: UserTypeOrmRepository // Concrete class
) {}
```

### 6. Decorator Pattern

Sistema de auditoría mediante decoradores:

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

## 🔍 Sistema de Auditoría

El sistema de auditoría registra automáticamente todas las operaciones críticas del sistema en la tabla `audit_logs`.

### Implementación

1. **Decorador `@Audit`**:

```typescript
import { Audit } from '@/infrastructure/adapters/audit/audit.decorator';

@Injectable()
export class ProcessCheckoutUseCase {
  @Audit('CHECKOUT_PROCESSED')
  async execute(dto: CheckoutDto): Promise<Result<TransactionResponse>> {
    // Operación crítica
  }
}
```

2. **Interceptor de Auditoría**:

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
    
    // Guardar log de auditoría
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

### Operaciones Auditadas

- ✅ `USER_REGISTERED`: Registro de nuevos usuarios
- ✅ `USER_LOGIN`: Inicio de sesión
- ✅ `CHECKOUT_PROCESSED`: Procesamiento de checkout
- ✅ `TRANSACTION_APPROVED`: Transacción aprobada
- ✅ `TRANSACTION_DECLINED`: Transacción rechazada
- ✅ `STOCK_REDUCED`: Reducción de inventario
- ✅ `DELIVERY_CREATED`: Creación de delivery
- ✅ `ROLE_ASSIGNED`: Asignación de roles

### Consultar Logs de Auditoría

```bash
# Ver últimos 100 logs
curl http://localhost:3000/api/audit-logs?limit=100

# Filtrar por usuario
curl http://localhost:3000/api/audit-logs?userId=<uuid>

# Filtrar por acción
curl http://localhost:3000/api/audit-logs?action=CHECKOUT_PROCESSED
```

---

## ⚡ Quick Start

### Prerequisitos

- **Node.js** 20+
- **PostgreSQL** 15+
- **npm** o **yarn**

### Instalación en 5 Minutos

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd checkout-commerce-api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Levantar PostgreSQL con Docker (opcional)
docker-compose up -d

# 5. Ejecutar migraciones
npm run migration:run

# 6. Ejecutar seeders (roles y productos)
npm run seed:run

# 7. Iniciar servidor
npm run start:dev
```

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

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

### Verificar Instalación

```bash
# Health check
curl http://localhost:3000/api/health

# Respuesta esperada:
# {"status":"ok","database":"connected","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Primer Test: Flujo Completo

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "John",
    "lastName": "Doe"
  }'
# Respuesta: { user: {...}, customer: {...}, accessToken: "..." }

# 2. Login (copiar el accessToken de la respuesta)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
# Respuesta: { user: {...}, accessToken: "..." }

# 3. Ver productos disponibles (sin autenticación - endpoint público)
curl -X GET http://localhost:3000/api/products
# Respuesta: { statusCode: 200, data: [...] }

# 4. Obtener acceptance token de Wompi (requerido antes de checkout)
# Obtén tu PUBLIC_KEY de .env y reemplaza abajo
curl -X GET "https://api-sandbox.co.uat.wompi.dev/v1/merchants/pub_test_tu_public_key_aqui"
# Respuesta: { presigned_acceptance: { acceptance_token: "..." } }

# 5. Procesar checkout (copiar acceptance_token de paso anterior)
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer <tu-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "<product-uuid-del-paso-3>",
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
    "acceptanceToken": "<acceptance-token-del-paso-4>"
  }'
# Respuesta: { statusCode: 201, data: { transactionId: "...", status: "PENDING", ... } }

# 6. Polling: Consultar estado de transacción cada 5 segundos
curl -X GET http://localhost:3000/api/checkout/status/<transaction-id-del-paso-5> \
  -H "Authorization: Bearer <tu-access-token>"
# Respuesta: { statusCode: 200, data: { status: "PENDING | APPROVED | DECLINED | ERROR", ... } }

# Repetir paso 6 hasta que status cambie a APPROVED, DECLINED o ERROR

# 7. (Opcional) Recuperar todas tus transacciones - útil después de un refresh
curl -X GET http://localhost:3000/api/checkout/my-transactions \
  -H "Authorization: Bearer <tu-access-token>"
# Respuesta: { statusCode: 200, data: [{ transactionId, status, items, delivery, ... }, ...] }
# Útil para: recuperar progreso después de refresh, ver historial de compras, encontrar transacciones PENDING
```

---

## 📁 Estructura del Proyecto

```
checkout-commerce-api/
├── src/
│   ├── domain/                           # 🟦 Domain Layer (Core Business Logic)
│   │   ├── entities/                     # Entidades de negocio
│   │   │   ├── user.entity.ts
│   │   │   ├── product.entity.ts
│   │   │   ├── transaction.entity.ts
│   │   │   ├── customer.entity.ts
│   │   │   └── delivery.entity.ts
│   │   ├── enums/                        # Enumeraciones del dominio
│   │   │   ├── role-name.enum.ts         # ADMIN, CUSTOMER
│   │   │   └── transaction-status.enum.ts # PENDING, APPROVED, DECLINED
│   │   ├── repositories/                 # Interfaces de repositorios (Ports OUT)
│   │   │   ├── user.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   └── transaction.repository.ts
│   │   └── value-objects/                # Objetos de valor
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
│   │   ├── use-cases/                    # Casos de uso
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
│   │   ├── utils/                        # Utilidades de aplicación
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
│   │   │   │       ├── repositories/     # Implementaciones de repositorios
│   │   │   │       │   ├── user.typeorm.repository.ts
│   │   │   │       │   └── ...
│   │   │   │       ├── migrations/       # Migraciones de base de datos
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
│   │   ├── config/                       # Configuración
│   │   │   ├── database.config.ts
│   │   │   ├── typeorm.config.ts
│   │   │   └── i18n/
│   │   └── modules/                      # Módulos de NestJS
│   │       ├── auth.module.ts
│   │       ├── checkout.module.ts
│   │       ├── database.module.ts
│   │       └── product.module.ts
│   │
│   ├── app.module.ts                     # Módulo raíz
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── main.ts                           # Entry point
│   └── ARCHITECTURE.md                   # Documentación de arquitectura
│
├── test/                                 # Tests E2E
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── coverage/                             # Reportes de cobertura
│   ├── lcov-report/
│   └── coverage-final.json
│
├── docker-compose.yml                    # Docker Compose para PostgreSQL
├── .env.example                          # Ejemplo de variables de entorno
├── package.json
├── tsconfig.json
├── nest-cli.json
├── eslint.config.mjs                     # ESLint configuration
└── README.md                             # Este archivo
```

### Nomenclatura de Capas

- **🟦 Domain Layer**: Azul - Lógica de negocio pura, sin dependencias externas
- **🟨 Application Layer**: Amarillo - Casos de uso, orquestación
- **🟩 Infrastructure Layer**: Verde - Detalles técnicos, frameworks, bases de datos

---

## 🌐 API Endpoints

### Authentication

#### POST `/api/auth/register`

Registrar nuevo usuario y crear perfil de cliente automáticamente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validaciones:**
- Email: Formato válido
- Password: Mínimo 8 caracteres, debe contener mayúscula, minúscula y número
- firstName: 2-50 caracteres
- lastName: 2-50 caracteres

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "message": "Usuario registrado exitosamente",
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

**Errores Posibles:**
- `409 Conflict`: Email ya existe
- `400 Bad Request`: Validación fallida o rol de cliente no encontrado

---

#### POST `/api/auth/login`

Iniciar sesión y obtener JWT token.

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
  "message": "Inicio de sesión exitoso",
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

**Errores Posibles:**
- `401 Unauthorized`: Credenciales inválidas o usuario no encontrado

**JWT Token:**
- Payload: `{ sub: userId, email, roleId, roleName }`
- Expiración: Configurable (default: 1d)
- Header requerido: `Authorization: Bearer <token>`

---

### Products

#### GET `/api/products`

Listar todos los productos disponibles con stock mayor a 0. **Endpoint público** (no requiere autenticación).

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
      "description": "Mouse inalámbrico ergonómico para productividad",
      "price": 349000,
      "stock": 42
    }
  ]
}
```

**Notas:**
- No requiere autenticación (endpoint público)
- Solo devuelve productos con stock > 0
- Devuelve array vacío si hay error o no hay productos
- Precios en pesos colombianos (COP)

---

### Checkout

#### POST `/api/checkout`

Procesar checkout y crear transacción de pago con Wompi. **Requiere autenticación** y rol **CUSTOMER**.

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

**Campos Requeridos:**
- `items[]`: Array con productId y quantity (mínimo 1 item)
- `paymentMethod`: Tipo y datos según método de pago
- `shippingAddress`: Dirección completa de entrega
- `customerEmail`: Email del cliente (debe coincidir con usuario autenticado)
- `acceptanceToken`: Token de aceptación de términos de Wompi (obtenido de GET `https://api-sandbox.co.uat.wompi.dev/v1/merchants/{public_key}`)

**Tipos de Payment Method:**

**1. CARD (Tarjeta - Opción A: Token pre-generado)**
```json
{
  "type": "CARD",
  "token": "tok_test_12345_1234567890",
  "installments": 1
}
```

**2. CARD (Tarjeta - Opción B: Datos de tarjeta para tokenizar en backend)**
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

**5. PSE (Débito bancario)**
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
  "message": "Checkout procesado exitosamente",
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

⚠️ **IMPORTANTE - Flujo Asíncrono de Wompi**: 

**Todos los pagos con Wompi retornan `status: "PENDING"` inicialmente.** El cliente debe:

1. **Recibir la respuesta** con `transactionId` y `status: "PENDING"`
2. **Iniciar polling**: Hacer peticiones GET `/api/checkout/status/:transactionId` cada **5 segundos**
3. **Esperar estado final**: `APPROVED`, `DECLINED` o `ERROR`
4. **Actualizar UI** cuando el estado cambie

**Posibles estados finales:**
- ✅ `APPROVED`: Pago exitoso - Stock reducido, delivery creado
- ❌ `DECLINED`: Pago rechazado - Revisar `errorCode` y `errorMessage`
- ⚠️ `ERROR`: Error en procesamiento - Contactar soporte

**Errores Posibles:**
- `400 Bad Request`: Validación fallida (campos faltantes/inválidos)
- `400 Insufficient Stock`: Producto sin stock suficiente
- `400 Product Not Found`: Producto no existe o está eliminado
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Usuario no tiene rol CUSTOMER

---

#### GET `/api/checkout/status/:transactionId`

Consultar estado de una transacción (para polling). **Requiere autenticación** y rol **CUSTOMER**.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**URL Parameters:**
- `transactionId`: UUID de la transacción interna (retornado en POST /checkout)

**Response:** `200 OK`

**Caso 1: Transacción PENDING (aún procesando)**
```json
{
  "statusCode": 200,
  "message": "Estado de transacción consultado",
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

**Caso 2: Transacción APPROVED (pago exitoso)**
```json
{
  "statusCode": 200,
  "message": "Estado de transacción consultado",
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

**Caso 3: Transacción DECLINED (pago rechazado)**
```json
{
  "statusCode": 200,
  "message": "Estado de transacción consultado",
  "data": {
    "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "wompiTransactionId": "52341-1648075828-38648",
    "status": "DECLINED",
    "amount": 5347000,
    "currency": "COP",
    "reference": "REF-1648075828-38648",
    "paymentMethod": "CARD",
    "errorCode": "DECLINED",
    "errorMessage": "Fondos insuficientes en la tarjeta"
  }
}
```

**Errores Posibles:**
- `404 Not Found`: Transacción no encontrada
- `400 Bad Request`: Error al consultar estado
- `401 Unauthorized`: Token inválido o expirado

---

#### GET `/api/checkout/my-transactions`

Obtener todas las transacciones del cliente autenticado. **Requiere autenticación** y rol **CUSTOMER**.

Este endpoint permite recuperar el progreso de transacciones después de un refresh, mejorando la resiliencia de la aplicación.

**Nota:** Este endpoint ahora busca transacciones tanto por `customerId` como por `email` del customer. Esto permite:
- Mostrar transacciones de checkout como invitado si el usuario se registra posteriormente con el mismo email
- Preparar el sistema para futuros flujos de guest checkout
- Combinar y deduplicar automáticamente todas las transacciones del usuario

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`

```json
{
  "statusCode": 200,
  "message": "Transacciones recuperadas",
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

**Notas:**
- Las transacciones se devuelven ordenadas por fecha de creación (más recientes primero)
- El campo `delivery` solo está presente si la transacción fue APPROVED y se creó un delivery
- Transacciones PENDING pueden no tener `delivery` aún
- Útil para recuperar el estado de transacciones después de un refresh de página

**Errores Posibles:**
- `400 Bad Request`: Error al obtener transacciones
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Usuario no tiene rol CUSTOMER

---

### Webhooks (Wompi)

#### POST `/api/webhooks/wompi`

Endpoint para recibir notificaciones de Wompi. **No requiere autenticación** (validación por firma SHA256).

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

### Estadísticas de Cobertura

```
=============================== Coverage summary ===============================
Statements   : 81.48%
Branches     : 61.96%
Functions    : 80.87%
Lines        : 80.82%
================================================================================
Test Suites: 36 passed, 36 total
Tests:       327 passed, 327 total
Snapshots:   0 total
Time:        3.416 s
```

### Ejecutar Tests

```bash
# Todos los tests (unitarios + integración + E2E)
npm test

# Solo tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e

# Watch mode (desarrollo)
npm run test:watch

# Coverage report
npm run test:cov

# Ver reporte HTML de cobertura
open coverage/lcov-report/index.html
```

### Ejemplo de Test Unitario (Use Case)

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

## 💳 Integración con Wompi

### Descripción

**Wompi** es la pasarela de pagos integrada para procesar transacciones electrónicas. El proyecto utiliza el modo **Sandbox** para pruebas.

### Flujo de Pago Asíncrono

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

### Métodos de Pago Soportados

| Método | Código | Descripción |
|--------|--------|-------------|
| Tarjeta de Crédito/Débito | `CARD` | Tokenización segura, sin almacenar datos de tarjeta |
| Nequi | `NEQUI` | Pago móvil con número de celular |
| PSE | `PSE` | Pagos Seguros en Línea (débito a cuenta bancaria) |
| Transferencia Bancolombia | `BANCOLOMBIA_TRANSFER` | Transferencia desde cuenta Bancolombia |
| QR Bancolombia | `BANCOLOMBIA_QR` | Pago por código QR |

### Configuración

Variables de entorno necesarias:

```bash
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_API_URL=https://sandbox.wompi.co/v1
WOMPI_EVENTS_SECRET=test_events_xxxxx
```

### Sistema de Webhooks

Wompi envía notificaciones cuando cambia el estado de una transacción:

**Endpoint:** `POST /api/webhooks/wompi`

**Validación de Firma:**

```typescript
// Calcular checksum esperado
const checksum = crypto
  .createHmac('sha256', process.env.WOMPI_EVENTS_SECRET)
  .update(`${timestamp}${JSON.stringify(event.data)}${process.env.WOMPI_EVENTS_SECRET}`)
  .digest('hex');

// Comparar con firma recibida
if (checksum !== event.signature.checksum) {
  throw new UnauthorizedException('Invalid signature');
}
```

**Eventos Soportados:**
- `transaction.updated`: Cambio de estado de transacción

### Sistema de Fulfillment

Cuando una transacción es **APPROVED**, se ejecuta automáticamente:

1. ✅ **Reducción de Stock**: Decrementa inventario de productos
2. ✅ **Creación de Delivery**: Genera registro de entrega con tracking number
3. ✅ **Audit Log**: Registra operación en `audit_logs`
4. ✅ **Notificación** (futuro): Envía email al cliente

```typescript
// infrastructure/adapters/payment/wompi/fulfillment.service.ts
async processFulfillment(transaction: Transaction) {
  // 1. Reducir stock
  for (const item of transaction.items) {
    await this.productRepository.reduceStock(item.productId, item.quantity);
  }

  // 2. Crear delivery
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

## 🗄️ Base de Datos

### Diagrama de Entidades

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

**Entidades Principales:**

1. **BaseEntity**: Clase abstracta con timestamps y soft delete (createdAt, updatedAt, deletedAt)
2. **User**: Autenticación (email, password, roleId) - Relación ManyToOne con Role
3. **Role**: Roles del sistema (ADMIN, CUSTOMER) - Enum RoleName
4. **Customer**: Perfil de cliente (OneToOne con User) - firstName, lastName, phone, address, city, country
5. **Product**: Productos disponibles (name, description, price, stock)
6. **Transaction**: Transacciones de pago (Wompi integration) - reference, status, amount, paymentMethod, ipAddress, wompiTransactionId, errorCode, errorMessage
7. **TransactionItem**: Items de una transacción (productName snapshot, quantity, unitPrice, subtotal)
8. **Delivery**: Entregas (address, recipientName, recipientPhone, trackingNumber, status, estimatedDelivery, actualDelivery)
9. **AuditLog**: Logs de auditoría (userId, roleName, action, timestamp, metadata JSONB)

### Migraciones

El proyecto usa **TypeORM migrations** con `synchronize: false` para control total de cambios en la base de datos.

#### Crear Nueva Migración

```bash
# Generar migración automática (basada en cambios en entidades)
npm run migration:generate -- -n CreateUsersTable

# Crear migración vacía
npm run migration:create -- -n AddIndexToUsers
```

#### Ejecutar Migraciones

```bash
# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Ver estado de migraciones
npm run migration:show
```

#### Ejemplo de Migración

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

    // Crear índice
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

Los seeders pueblan la base de datos con datos iniciales:

```bash
# Ejecutar todos los seeders
npm run seed:run

# Seeders disponibles:
# - RoleSeeder: Roles ADMIN y CUSTOMER
# - ProductSeeder: 10 productos de ejemplo
```

#### Ejemplo de Seeder

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

Todas las entidades heredan de `BaseEntity` que incluye soft delete:

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

**Uso:**

```typescript
// Soft delete (no elimina físicamente)
await userRepository.softDelete(userId);

// Restaurar
await userRepository.restore(userId);

// Excluir soft-deleted por defecto
await userRepository.find(); // Solo usuarios activos

// Incluir soft-deleted
await userRepository.find({ withDeleted: true });
```

---

## 🔐 Seguridad y Autenticación

### JWT Authentication

El sistema usa **JSON Web Tokens (JWT)** para autenticación stateless.

#### Flujo de Autenticación

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

#### Implementación

**1. Generar Token**

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

**2. Proteger Rutas**

```typescript
// infrastructure/adapters/http/controllers/product.controller.ts
@Controller('products')
@UseGuards(JwtAuthGuard) // 👈 Proteger todo el controlador
export class ProductController {
  @Get()
  async getProducts(@Request() req) {
    const userId = req.user.id; // Usuario autenticado
    return this.getProductsUseCase.execute();
  }
}
```

**3. Guards Personalizados**

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

Sistema de control de acceso basado en roles dinámico desde base de datos.

#### Roles Disponibles

- **ADMIN**: Acceso completo al sistema
- **CUSTOMER**: Acceso a operaciones de cliente (checkout, ver productos)

#### Implementación

**1. Decorador de Roles**

```typescript
// infrastructure/adapters/auth/decorators/roles.decorator.ts
export const Roles = (...roles: RoleName[]) => SetMetadata('roles', roles);
```

**2. Guards de Roles**

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

**3. Uso en Controladores**

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // 👈 Ambos guards
@Roles(RoleName.ADMIN) // 👈 Solo administradores
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

Las contraseñas se hashean con**bcrypt** (10 rounds):

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

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run start          # Iniciar en modo desarrollo
npm run start:dev      # Iniciar con auto-reload (watch mode)
npm run start:debug    # Iniciar con debugger
npm run start:prod     # Iniciar en modo producción

# Build
npm run build          # Compilar TypeScript

# Testing
npm test               # Ejecutar todos los tests
npm run test:watch     # Tests en watch mode
npm run test:cov       # Tests con coverage
npm run test:debug     # Tests con debugger
npm run test:e2e       # Tests end-to-end

# Linting
npm run lint           # Ejecutar ESLint
npm run lint:fix       # Ejecutar ESLint y auto-fix

# Base de Datos
npm run migration:generate -- -n MigrationName    # Generar migración
npm run migration:create -- -n MigrationName      # Crear migración vacía
npm run migration:run                             # Ejecutar migraciones
npm run migration:revert                          # Revertir última migración
npm run migration:show                            # Mostrar estado
npm run seed:run                                  # Ejecutar seeders

# Otros
npm run format         # Formatear código con Prettier
```

---

## 📚 Documentación Adicional

Para información más detallada sobre componentes específicos, consulta:

- **[ARCHITECTURE.md](./src/ARCHITECTURE.md)** - Documentación detallada de arquitectura hexagonal
- **[QUICK_START.md](./QUICK_START.md)** - Guía rápida de inicio (5 minutos)
- **[CHECKOUT_TESTING_GUIDE.md](./CHECKOUT_TESTING_GUIDE.md)** - Guía completa para probar flujo de checkout
- **[AUTHENTICATION_USAGE.md](./AUTHENTICATION_USAGE.md)** - Implementación de JWT y RBAC
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Configuración de PostgreSQL y migraciones
- **[MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)** - Gestión de migraciones con TypeORM
- **[FULFILLMENT.md](./FULFILLMENT.md)** - Sistema de fulfillment post-pago
- **[payment_methods.doc.md](./payment_methods.doc.md)** - Referencia de métodos de pago Wompi
- **[trasnsactions.doc.md](./trasnsactions.doc.md)** - API de transacciones Wompi
- **[events.doc.md](./events.doc.md)** - Sistema de webhooks Wompi

---

## 🤝 Contribución

### Flujo de Trabajo

1. Fork el repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código

- ✅ **ESLint**: 0 errores requeridos
- ✅ **Tests**: Coverage >= 80%
- ✅ **Commits**: Conventional Commits format
- ✅ **TypeScript**: Strict mode habilitado
- ✅ **Arquitectura**: Respetar capas hexagonales

### Conventional Commits

```
feat: Add nueva funcionalidad
fix: Corregir bug en checkout
docs: Actualizar README
test: Agregar tests para login
refactor: Refactorizar repositorio de usuarios
perf: Optimizar query de productos
```

---

## 📄 License

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

## 👤 Author

**Tu Nombre** - [@tu-usuario](https://github.com/tu-usuario)

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Framework base
- [Wompi](https://wompi.co/) - Pasarela de pagos
- [TypeORM](https://typeorm.io/) - ORM
- [Alexandro Hdez](https://github.com/CodePawsDev) - Original architecture inspiration

---

<p align="center">
  Made with ❤️ using NestJS
</p>

<p align="center">
  <img src="https://img.shields.io/badge/coverage-81.48%25-brightgreen?style=flat-square" alt="Coverage" />
  <img src="https://img.shields.io/badge/tests-327%20passing-success?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/lint-0%20errors-success?style=flat-square" alt="Lint" />
</p>
