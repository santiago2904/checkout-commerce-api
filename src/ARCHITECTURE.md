# Arquitectura Hexagonal - Estructura del Proyecto

Este proyecto implementa **Arquitectura Hexagonal (Puertos y Adaptadores)** para mantener la lógica de negocio independiente de los frameworks y tecnologías externas.

## 📁 Estructura de Carpetas

```
src/
├── domain/                          # CAPA DE DOMINIO (núcleo de negocio)
│   ├── entities/                    # Entidades de dominio puras
│   ├── repositories/                # Interfaces de repositorios (Puertos)
│   ├── value-objects/              # Objetos de valor inmutables
│   └── enums/                      # Enumeraciones del dominio
│
├── application/                     # CAPA DE APLICACIÓN (casos de uso)
│   ├── ports/
│   │   ├── in/                     # Puertos de entrada (interfaces de casos de uso)
│   │   └── out/                    # Puertos de salida (interfaces de servicios externos)
│   ├── use-cases/                  # Implementación de casos de uso
│   │   ├── auth/                   # Login, autenticación
│   │   ├── products/               # Gestión de productos
│   │   ├── checkout/               # Proceso de checkout
│   │   ├── customer/               # Operaciones de cliente
│   │   └── admin/                  # Operaciones administrativas
│   ├── dtos/                       # Data Transfer Objects
│   └── utils/                      # Utilidades de aplicación (ROP helpers)
│
└── infrastructure/                  # CAPA DE INFRAESTRUCTURA (adaptadores)
    ├── adapters/
    │   ├── database/
    │   │   └── typeorm/
    │   │       ├── entities/       # Entidades TypeORM (mapeo ORM)
    │   │       ├── repositories/   # Implementación de repositorios
    │   │       └── seeds/          # Datos semilla
    │   ├── payment/
    │   │   └── strategies/         # Estrategias de pago (Wompi, etc.)
    │   └── web/
    │       ├── controllers/        # Controladores REST
    │       ├── guards/             # Guards de autenticación/autorización
    │       ├── decorators/         # Decoradores personalizados
    │       ├── interceptors/       # Interceptores (auditoría, transformación)
    │       └── filters/            # Filtros de excepciones
    ├── config/                     # Configuraciones (DB, JWT, etc.)
    └── modules/                    # Módulos de NestJS
```

## 🎯 Principios de la Arquitectura

### 1. **Independencia de Frameworks**

- La lógica de negocio (domain) no depende de NestJS, TypeORM u otras librerías externas
- Los casos de uso (application) son puros TypeScript

### 2. **Testeable**

- La lógica de negocio se puede probar sin BD, sin web server
- Usar mocks de los puertos (interfaces)

### 3. **Independencia de UI**

- Los controladores son solo adaptadores delgados
- Toda la lógica está en los casos de uso

### 4. **Independencia de Base de Datos**

- El dominio define interfaces (repositorios)
- TypeORM es solo un detalle de implementación intercambiable

### 5. **Independencia de Servicios Externos**

- Patrón Strategy para pasarelas de pago
- Fácil cambiar de Wompi a otra pasarela

## 🔄 Flujo de una Petición

```
HTTP Request
    ↓
[Controller] (infrastructure/adapters/web/controllers)
    ↓
[Use Case] (application/use-cases)
    ↓
[Domain Repository Interface] (domain/repositories)
    ↓
[Repository Implementation] (infrastructure/adapters/database/typeorm/repositories)
    ↓
[Database]
```

## 📦 Dependencias entre Capas

```
Domain (núcleo)
    ↑
Application (depende solo de Domain)
    ↑
Infrastructure (depende de Domain y Application)
```

**Regla de oro:** Las dependencias apuntan SIEMPRE hacia adentro (hacia el dominio)

## 🛠️ Patrones Implementados

1. **Railway Oriented Programming (ROP)** - Manejo de errores en casos de uso
2. **Strategy Pattern** - Pasarelas de pago intercambiables
3. **Repository Pattern** - Abstracción de persistencia
4. **Dependency Inversion** - Interfaces en lugar de implementaciones concretas
5. **Use Case Pattern** - Casos de uso como clases independientes

## 📝 Convenciones de Nombres

- **Entidades de dominio:** `Role.ts`, `User.ts`
- **Repositorios (interface):** `UserRepositoryPort.ts`
- **Repositorios (implementación):** `TypeOrmUserRepository.ts`
- **Casos de uso:** `LoginUseCase.ts`, `ProcessCheckoutUseCase.ts`
- **DTOs:** `LoginRequestDto.ts`, `CheckoutRequestDto.ts`
- **Controladores:** `auth.controller.ts`, `checkout.controller.ts`

## WOMPI DOCS

<https://docs.wompi.co/docs/colombia/transacciones/>
<https://docs.wompi.co/docs/colombia/fuentes-de-pago/>
<https://docs.wompi.co/docs/colombia/metodos-de-pago/>
<https://docs.wompi.co/docs/colombia/ambientes-y-llaves/>
<https://docs.wompi.co/docs/colombia/eventos/>
