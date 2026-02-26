# Contexto del Proyecto: Backend Checkout Wompi

Actúa como un Arquitecto de Software y Desarrollador Backend Senior experto en TypeScript y NestJS. Necesito construir el backend para un flujo de *checkout* y pagos integrando la API de Wompi en modo Sandbox.

Debemos aplicar estrictamente las siguientes reglas, frameworks y metodologías:

## 1. Stack Tecnológico y Arquitectura
* **Framework y ORM:** NestJS con TypeScript y TypeORM (PostgreSQL).
* **Seguridad y Autenticación:** Implementar JWT (Passport.js) y bcrypt para alinearnos con prácticas OWASP. Implementar un sistema de Control de Acceso Basado en Roles (RBAC) dinámico, consultando los roles desde la base de datos mediante Guards personalizados de NestJS.
* **Arquitectura:** Arquitectura Hexagonal (Puertos y Adaptadores). La lógica de negocio debe estar estrictamente separada de los controladores web.
* **Patrones de Diseño:** * Railway Oriented Programming (ROP) para el manejo de casos de uso y control de flujo/errores.
  * Patrón Strategy para la pasarela de pagos (interfaz base `PaymentGateway` + estrategia concreta `WompiStrategy`), permitiendo escalabilidad a futuras pasarelas.
* **Pruebas (TDD):** Generar **siempre** primero las pruebas unitarias fallidas (Jest) antes que la implementación, garantizando más del 80% de coverage.

## 2. Modelado de Datos (TypeORM)
Todas las tablas de negocio deben heredar de una clase abstracta `BaseEntity` que incluya automáticamente `createdAt`, `updatedAt` y `deletedAt` (Soft Deletes). Las entidades principales son:

* **Role:** Tabla de roles (ej. `id`, `name`, `description`). Debe inicializarse con los roles 'ADMIN' y 'CUSTOMER'.
* **User:** Autenticación (email, password hasheado) con una relación Muchos-a-Uno (ManyToOne) hacia la entidad `Role`.
* **Product:** Descripción, precio y unidades disponibles en stock. (Se inicializará con datos semilla, no requiere endpoint de creación).
* **Customer:** Datos personales del cliente y de envío. Relación Uno-a-Uno (OneToOne) con `User`.
* **Delivery:** Información de envío generada tras un pago exitoso.
* **Transaction:** Registro del pago. Almacena el estado (PENDING, APPROVED, FAILED), número de transacción, monto y referencia. Relacionada al `User` o `Customer`.
* **AuditLog:** Tabla para registrar modificaciones críticas en BD. Almacena el `userId`, el `roleName`, la acción realizada y un timestamp.

## 3. Sistema de Auditoría (Decoradores e Interceptors)
Diseña un decorador `@Audit(action: string)` y un Interceptor global o por controlador. El interceptor debe extraer el ID del usuario autenticado desde el token JWT (inyectado en la request) y guardar el registro en la tabla `AuditLog` automáticamente de forma asíncrona cada vez que el endpoint se ejecute con éxito.

## 4. Definición de Endpoints (API REST)
Define DTOs (con validaciones class-validator), Puertos (Interfaces) y Casos de Uso (Interactors) para:

**Autenticación:**
* `POST /api/auth/login`: Autentica al usuario validando credenciales y devuelve un JWT.

**Públicos:**
* `GET /api/products`: Muestra lista de productos y stock disponible.

**Privados (Requieren JWT):**
* `POST /api/checkout`: (Requiere Rol: `CUSTOMER`). 
  * **Flujo ROP:** Inicia creando transacción en BD en estado PENDING, ejecuta la Strategy de Wompi para procesar el pago (usando credenciales Sandbox), actualiza el estado de la transacción. Si es APPROVED, descuenta el stock y asigna el delivery.
  * **Auditoría:** Decorado con `@Audit('CHECKOUT')`.
* `GET /api/customer/transactions`: (Requiere Rol: `CUSTOMER`). Devuelve el historial de compras exclusivo del usuario autenticado.
* `GET /api/admin/transactions/pending`: (Requiere Rol: `ADMIN`). Devuelve todas las transacciones del sistema en estado PENDING para monitoreo.

## Instrucciones de Generación Iterativa (Fase 1)
Para mantener el orden, aplicar TDD correctamente y no saturar el contexto, entrégame **únicamente** lo siguiente en tu primera respuesta:
1. La estructura de carpetas sugerida para NestJS integrando el módulo de Auth, la Arquitectura Hexagonal (Dominio, Aplicación, Infraestructura) y TypeORM.
2. El código de las entidades `BaseEntity`, `Role` y `User` definiendo sus relaciones en TypeORM.
3. El código del Guard `RolesGuard` y el decorador `@Roles()` adaptados para leer el rol de la relación con el usuario autenticado.

## WOMPI DOCUMENTATION


https://app.swaggerhub.com/apis-docs/waybox/wompi/1.2.0

https://docs.wompi.co/docs/colombia/links-de-pago/
https://docs.wompi.co/docs/colombia/ambientes-y-llaves/

