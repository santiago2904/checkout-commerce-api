# 🚀 Sistema de Migraciones y Seeders en Producción

## 📋 Resumen de Cambios

Se agregó un sistema automatizado que ejecuta **migraciones de base de datos** y **seeders** antes de iniciar la aplicación en producción.

### ✨ Flujo de Inicio del Contenedor

Cuando el contenedor de Docker inicia en ECS, ejecuta automáticamente:

```
1. ⏳ Esperar a que PostgreSQL esté listo (máx 60 segundos)
2. 📦 Ejecutar migraciones de TypeORM
3. 🌱 Ejecutar seeders de datos iniciales
4. 🚀 Iniciar la aplicación NestJS
```

## 📁 Archivos Creados/Modificados

### 1. **docker-entrypoint.sh** (Nuevo)
Script de entrada que orquesta el inicio del contenedor:
- Valida conexión a la base de datos
- Ejecuta migraciones
- Ejecuta seeders
- Inicia la aplicación

### 2. **src/run-migrations.ts** (Nuevo)
Script de producción para ejecutar migraciones TypeORM con el código compilado.

**Características:**
- Usa el código JavaScript compilado (no requiere ts-node)
- Soporte SSL para conexiones RDS
- Manejo de errores robusto
- Logs detallados de migraciones ejecutadas

### 3. **src/run-seeders.ts** (Nuevo)
Script de producción para ejecutar seeders de base de datos.

**Datos que inserta:**
- **Roles:** ADMIN, USER, CUSTOMER
- **Productos:** 2 productos de ejemplo para testing

**Características:**
- Verifica si los datos ya existen (idempotente)
- No falla si los datos ya están presentes
- Soporte SSL para RDS

### 4. **package.json** (Modificado)
Agregados nuevos scripts de producción:

```json
"migration:run:prod": "node dist/run-migrations.js",
"seed:run:prod": "node dist/run-seeders.js"
```

### 5. **Dockerfile** (Modificado)
Cambios realizados:
- Copia `docker-entrypoint.sh` al contenedor
- Da permisos de ejecución al script
- Cambia `CMD` para usar el entrypoint en lugar de iniciar directamente

**Antes:**
```dockerfile
CMD ["node", "dist/main.js"]
```

**Después:**
```dockerfile
CMD ["/usr/local/bin/docker-entrypoint.sh"]
```

### 6. **DEPLOY_FIX.sh** (Modificado)
Actualizado para reflejar los nuevos pasos automáticos de migraciones y seeders.

## 🔧 Cómo Funciona

### En Desarrollo (Local)

```bash
# Ejecutar migraciones
npm run migration:run

# Ejecutar seeders
npm run seed:run
```

### En Producción (ECS/Docker)

**Todo es automático.** Cuando el contenedor inicia:

```bash
# El entrypoint ejecuta automáticamente:
/usr/local/bin/docker-entrypoint.sh
```

Este script:
1. Espera a que la BD esté lista
2. Ejecuta `npm run migration:run:prod`
3. Ejecuta `npm run seed:run:prod`
4. Ejecuta `node dist/main`

## 📊 Logs Esperados en CloudWatch

Cuando el contenedor inicia correctamente, verás:

```
🚀 Starting application initialization...
⏳ Waiting for database to be ready...
✅ Database is ready!

📦 Running database migrations...
Initializing database connection...
Running migrations...
Successfully ran 6 migrations:
  - InitialSchema
  - CreateTransactionItemsTable
  - RemoveTransactionNumberAndWompiReference
  - AddImageUrlToProducts
  - AddUserRelationToAuditLog
  - AddGuestCheckoutSupport
✅ Migrations completed successfully!

🌱 Running database seeders...
🌱 Starting database seeding...
✓ Database connection established

🔐 Seeding roles...
  ✓ Created role: ADMIN
  ✓ Created role: USER
  ✓ Created role: CUSTOMER

📦 Seeding products...
  ✓ Created product: Sample Product 1
  ✓ Created product: Sample Product 2

🎉 All seeders completed successfully!
✅ Seeders completed successfully!

🎯 Starting NestJS application...
[Nest] 1 - LOG [NestFactory] Starting Nest application...
[Nest] 1 - LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 1 - LOG [RoutesResolver] AppController {/}:
[Nest] 1 - LOG Application is running on: http://[::]:3000
```

## 🔄 Comportamiento Idempotente

### Migraciones
- Si ya están aplicadas: "No migrations to run - database is up to date"
- No causa errores ni re-ejecuta migraciones

### Seeders
- **Roles:** Verifica si existen antes de insertarlos
- **Productos:** Solo inserta si la tabla está vacía
- Si los datos ya existen, muestra mensaje informativo

## 🛠️ Mantenimiento

### Agregar Nueva Migración

```bash
# En desarrollo
npm run migration:generate -- src/infrastructure/adapters/database/typeorm/migrations/MiNuevaMigracion

# La migración se ejecutará automáticamente en el próximo deployment
```

### Agregar Nuevo Seeder

1. Edita **src/run-seeders.ts**
2. Agrega una nueva clase seeder:

```javascript
class NuevoSeeder {
  async run(dataSource) {
    console.log('🎯 Seeding nuevo dato...');
    // Tu lógica aquí
  }
}
```

3. Agrégala al array de seeders:

```javascript
const seeders = [
  new RoleSeeder(),
  new ProductSeeder(),
  new NuevoSeeder() // <-- Nueva
];
```

## 🚨 Troubleshooting

### El contenedor se reinicia constantemente

**Causa:** Migraciones o seeders están fallando

**Solución:**
```bash
# Ver logs detallados
aws logs tail /ecs/checkout-commerce-prod --follow --region us-east-1

# Buscar errores antes de "Starting NestJS application"
```

### "Database connection timeout"

**Causa:** La BD no está accesible o las credenciales son incorrectas

**Verificar:**
1. Security Groups permiten tráfico entre ECS y RDS
2. Secrets Manager tiene las credenciales correctas
3. Variable `DB_SSL=true` está configurada

### "Migrations failed"

**Causa:** Error en alguna migración SQL

**Solución:**
1. Revisar logs de CloudWatch para ver el error específico
2. Conectarse manualmente a RDS y verificar estado de la tabla
3. Si es necesario, revertir migración localmente y crear fix

### "Seeders failed" pero app inicia

**Comportamiento esperado:** Los seeders pueden fallar si los datos ya existen o hay constraints

**No afecta:** La aplicación iniciará de todas formas. Los seeders son opcionales.

## ✅ Verificación Post-Deployment

### 1. Verificar que migraciones se ejecutaron

```bash
# Conectarse a RDS
psql -h checkout-commerce-prod-db.cc7g82gws5nk.us-east-1.rds.amazonaws.com \
     -U dbadmin -d checkoutdb

# Ver migraciones aplicadas
SELECT * FROM migrations;
```

### 2. Verificar que seeders se ejecutaron

```bash
# Ver roles
SELECT * FROM roles;

# Ver productos
SELECT * FROM products;
```

### 3. Verificar que la app está funcionando

```bash
curl http://checkout-commerce-prod-alb-686551057.us-east-1.elb.amazonaws.com/api/health
```

## 🎯 Próximos Pasos

Después de ejecutar `./DEPLOY_FIX.sh`:

1. **Monitorear logs** (~3-5 minutos para completar todo el proceso)
2. **Verificar health check** del ALB
3. **Probar endpoints** de la API
4. **Validar datos** en la base de datos

---

**Fecha de creación:** 2 de marzo de 2026  
**Versión:** 1.0  
**Autor:** DevOps Team
