# Authentication Usage Guide

## ✅ Componentes Implementados (Task 5 + Task 11)

### Servicios:
- ✅ `BcryptHashService` - Hash y comparación de contraseñas
- ✅ `JwtTokenService` - Generación y verificación de tokens JWT
- ✅ `JwtStrategy` - Estrategia Passport para validación JWT

### Guards:
- ✅ `JwtAuthGuard` - Protección de rutas (requiere token JWT válido)
- ✅ `RolesGuard` - Control de acceso basado en roles (RBAC)

### Decorators:
- ✅ `@Roles()` - Marca los roles requeridos para un endpoint

---

## 📖 Cómo Usar en Controladores

### 1. Endpoint Público (sin autenticación)

```typescript
import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  
  // ✅ Público - cualquiera puede registrarse
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Lógica de registro
    return { message: 'User registered' };
  }

  // ✅ Público - cualquiera puede hacer login
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Lógica de login
    return { accessToken: 'jwt_token_here' };
  }
}
```

### 2. Endpoint Protegido (requiere autenticación)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@infrastructure/adapters/auth';

@Controller('products')
export class ProductsController {
  
  // ✅ Protegido - requiere JWT válido
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return { products: [] };
  }
}
```

### 3. Endpoint con Roles (RBAC)

```typescript
import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@infrastructure/adapters/auth';
import { RoleName } from '@domain/enums';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // ⚠️ JwtAuthGuard PRIMERO, luego RolesGuard
export class AdminController {
  
  // ✅ Solo ADMIN puede acceder
  @Roles(RoleName.ADMIN)
  @Get('users')
  async getAllUsers() {
    return { users: [] };
  }

  // ✅ Solo ADMIN puede crear productos
  @Roles(RoleName.ADMIN)
  @Post('products')
  async createProduct() {
    return { message: 'Product created' };
  }
}
```

### 4. Endpoint con Múltiples Roles

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@infrastructure/adapters/auth';
import { RoleName } from '@domain/enums';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  
  // ✅ ADMIN o CUSTOMER pueden ver órdenes
  @Roles(RoleName.ADMIN, RoleName.CUSTOMER)
  @Get()
  async findAll() {
    return { orders: [] };
  }
}
```

### 5. Obtener Usuario Autenticado

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@infrastructure/adapters/auth';
import { Request } from 'express';

// Extender el tipo Request con la info del usuario
interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
  };
}

@Controller('profile')
export class ProfileController {
  
  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Req() req: AuthRequest) {
    // ✅ req.user tiene la info del JWT payload
    return {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.roleName,
    };
  }
}
```

---

## 🔐 Servicios Disponibles

### BcryptHashService

```typescript
import { Injectable } from '@nestjs/common';
import { BcryptHashService } from '@infrastructure/adapters/auth';

@Injectable()
export class AuthService {
  constructor(private readonly hashService: BcryptHashService) {}

  async registerUser(password: string) {
    // Hash de la contraseña
    const hashedPassword = await this.hashService.hashPassword(password);
    // Guardar hashedPassword en la BD
  }

  async validatePassword(password: string, hashedPassword: string) {
    // Comparar contraseñas
    const isValid = await this.hashService.comparePasswords(password, hashedPassword);
    return isValid;
  }
}
```

### JwtTokenService

```typescript
import { Injectable } from '@nestjs/common';
import { JwtTokenService } from '@infrastructure/adapters/auth';
import { JwtPayload } from '@application/ports/auth';

@Injectable()
export class AuthService {
  constructor(private readonly tokenService: JwtTokenService) {}

  async login(user: any) {
    // Crear payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.role.id,
      roleName: user.role.name,
    };

    // Generar token
    const token = await this.tokenService.generateToken(payload);
    return { accessToken: token };
  }

  async verifyToken(token: string) {
    // Verificar y decodificar token
    const payload = await this.tokenService.verifyToken(token);
    return payload;
  }
}
```

---

## 🧪 Tests

### Tests Actuales:
- ✅ 143 tests pasando
- ✅ 98.85% cobertura
- ✅ 36 tests de autenticación:
  - 7 tests: BcryptHashService
  - 5 tests: JwtTokenService
  - 6 tests: JwtStrategy
  - 3 tests: JwtAuthGuard
  - 10 tests: RolesGuard
  - 3 tests: @Roles() decorator
  - 5 tests: AuthModule

### Ejecutar tests:
```bash
# Todos los tests
npm test

# Solo tests de auth
npm test -- --testPathPatterns="auth"

# Con cobertura
npm test -- --coverage
```

---

## 🔄 Flujo de Autenticación

```
1. Usuario hace POST /auth/register
   └─> BcryptHashService.hashPassword()
   └─> Guardar usuario en BD

2. Usuario hace POST /auth/login
   └─> Buscar usuario en BD
   └─> BcryptHashService.comparePasswords()
   └─> JwtTokenService.generateToken()
   └─> Retornar { accessToken: "..." }

3. Usuario hace GET /protected con header: Authorization: Bearer <token>
   └─> JwtAuthGuard intercepta
   └─> JwtStrategy valida token
   └─> JwtStrategy extrae payload y lo pone en req.user
   └─> Controlador recibe request con req.user

4. Usuario hace GET /admin/users (requiere ADMIN)
   └─> JwtAuthGuard valida token (paso 3)
   └─> RolesGuard lee @Roles(RoleName.ADMIN)
   └─> RolesGuard verifica req.user.roleName === 'ADMIN'
   └─> Si no es ADMIN → ForbiddenException
   └─> Si es ADMIN → Permite acceso
```

---

## ⚠️ Orden Importante de Guards

```typescript
// ✅ CORRECTO: JwtAuthGuard PRIMERO, luego RolesGuard
@UseGuards(JwtAuthGuard, RolesGuard)

// ❌ INCORRECTO: RolesGuard no puede leer req.user sin autenticación
@UseGuards(RolesGuard, JwtAuthGuard)
```

**Razón:** `JwtAuthGuard` debe ejecutarse primero para poblar `req.user`, luego `RolesGuard` puede leer `req.user.roleName`.

---

## 📝 Próximos Pasos

Para probar end-to-end, necesitas implementar:

### Task 12: Authentication Use Cases
- `LoginUseCase`
- `RegisterUserUseCase`
- `IAuthRepository` port

### Task 13: Registration Endpoint
- `POST /api/auth/register`
- `RegisterDto` con validaciones
- Crear usuario con role CUSTOMER por defecto

### Task 14: Login Endpoint
- `POST /api/auth/login`
- `LoginDto` con validaciones
- Validar credenciales y retornar JWT

Una vez tengas los endpoints, podrás probar:
```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123!"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123!"}'

# 3. Acceder a endpoint protegido
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <tu_token_jwt>"
```

---

## 🎯 Resumen

| Componente | Estado | Descripción |
|------------|--------|-------------|
| BcryptHashService | ✅ | Hash y verificación de contraseñas |
| JwtTokenService | ✅ | Generación y verificación de tokens |
| JwtStrategy | ✅ | Validación de JWT con Passport |
| JwtAuthGuard | ✅ | Protección de rutas (autenticación) |
| RolesGuard | ✅ | Control de acceso por roles (autorización) |
| @Roles() | ✅ | Decorator para marcar roles requeridos |
| AuthModule | ✅ | Módulo configurado e integrado |
| Tests | ✅ | 143 tests, 98.85% cobertura |

**¿Listo para comenzar Task 12 (Use Cases)?**
