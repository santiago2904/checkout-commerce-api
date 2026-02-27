# Database Migrations Guide

Este proyecto usa TypeORM para gestionar las migraciones de base de datos.

## ¿Por qué usar migraciones?

Las migraciones son importantes porque:

1. **Historial de cambios**: Mantienen un registro versionado de todos los cambios en la estructura de la base de datos
2. **Reproducibilidad**: Permiten aplicar los mismos cambios en diferentes entornos (dev, staging, prod)
3. **Seguridad**: Evitan pérdida de datos que puede ocurrir con `synchronize: true`
4. **Colaboración**: Facilitan el trabajo en equipo al compartir cambios de schema
5. **Rollback**: Permiten revertir cambios si algo sale mal

## ⚠️ Importante: `synchronize: false`

El proyecto ahora tiene `synchronize: false` en la configuración de TypeORM. Esto significa que los cambios en las entidades **NO se aplicarán automáticamente** a la base de datos. Debes crear y ejecutar migraciones manualmente.

## Scripts disponibles

```bash
# Ver el estado de las migraciones
npm run migration:show

# Generar una nueva migración basada en cambios en las entidades
npm run migration:generate -- src/infrastructure/adapters/database/typeorm/migrations/NombreDeLaMigracion

# Crear una migración vacía (para escribir SQL manualmente)
npm run migration:create -- src/infrastructure/adapters/database/typeorm/migrations/NombreDeLaMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir la última migración
npm run migration:revert
```

## Flujo de trabajo típico

### 1. Modificar una entidad

Por ejemplo, agregaste una relación en `audit-log.entity.ts`:

```typescript
@ManyToOne(() => User)
@JoinColumn({ name: 'userId' })
user: User;
```

### 2. Generar la migración

```bash
npm run migration:generate -- src/infrastructure/adapters/database/typeorm/migrations/AddUserRelationToAuditLog
```

TypeORM comparará las entidades con el schema actual de la base de datos y generará automáticamente el código SQL necesario.

### 3. Revisar la migración generada

Abre el archivo generado en `src/infrastructure/adapters/database/typeorm/migrations/` y revisa el SQL. Asegúrate de que:
- Los cambios sean correctos
- No haya cambios inesperados
- El método `down()` pueda revertir correctamente los cambios

### 4. Ejecutar la migración

```bash
npm run migration:run
```

Esto aplicará todas las migraciones pendientes a la base de datos.

### 5. Verificar en la base de datos

Conecta a tu base de datos y verifica que:
- Los cambios se hayan aplicado correctamente
- La tabla `migrations` tenga un registro de la migración ejecutada

## Ejemplo: Crear una migración manual

Si necesitas ejecutar SQL personalizado que TypeORM no puede generar automáticamente:

```bash
npm run migration:create -- src/infrastructure/adapters/database/typeorm/migrations/AddCustomIndex
```

Edita el archivo generado:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomIndex1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_user_action 
      ON audit_logs(userId, action, timestamp DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_user_action
    `);
  }
}
```

## Entornos de ejecución

### Desarrollo (local)

```bash
# Generar y ejecutar migraciones manualmente
npm run migration:generate -- src/infrastructure/adapters/database/typeorm/migrations/MigracionNueva
npm run migration:run
```

### CI/CD y Producción

Puedes configurar `AUTO_RUN_MIGRATIONS=true` en las variables de entorno para que las migraciones se ejecuten automáticamente al iniciar la aplicación:

```bash
# En .env o variables de entorno
AUTO_RUN_MIGRATIONS=true
```

⚠️ **Precaución**: Solo usa `AUTO_RUN_MIGRATIONS=true` en entornos controlados donde estés seguro de las migraciones.

## Mejores prácticas

1. **Siempre revisa las migraciones generadas** antes de ejecutarlas
2. **Prueba las migraciones localmente** antes de aplicarlas en producción
3. **Nunca edites una migración ya ejecutada** en producción - crea una nueva
4. **Incluye las migraciones en el control de versiones** (Git)
5. **Haz backup de la base de datos** antes de ejecutar migraciones en producción
6. **Usa nombres descriptivos** para las migraciones (ej: `AddUserRelationToAuditLog`)
7. **Escribe métodos `down()` correctos** para poder revertir cambios si es necesario

## Troubleshooting

### "No changes in database schema were found"

Esto significa que TypeORM no detectó diferencias entre tus entidades y el schema actual. Posibles causas:
- Las entidades ya están sincronizadas con la base de datos
- Los cambios no son detectables por TypeORM (índices personalizados, triggers, etc.)
- Hay un problema con la conexión a la base de datos

### Error al ejecutar migraciones

1. Verifica que la base de datos esté corriendo
2. Verifica las credenciales en el archivo `.env`
3. Revisa los logs para ver el error específico
4. Si es necesario, revierte la migración: `npm run migration:revert`

### Migración ya ejecutada

Si necesitas modificar una migración ya ejecutada en tu entorno local:

1. Revierte la migración: `npm run migration:revert`
2. Elimina el archivo de migración
3. Genera una nueva migración
4. Ejecuta la nueva migración

⚠️ **NUNCA** hagas esto en producción. En producción, siempre crea una nueva migración correctiva.

## Recursos

- [Documentación oficial de TypeORM Migrations](https://typeorm.io/migrations)
- [TypeORM Migration API](https://typeorm.io/migration-api)
