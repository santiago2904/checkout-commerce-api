# Sistema de Internacionalización (i18n)

Este proyecto utiliza un sistema de traducciones personalizado para soportar múltiples idiomas en las respuestas de la API.

## Idiomas Soportados

- **en**: Inglés (idioma predeterminado)
- **es**: Español

## Uso

### En Controladores

Para usar traducciones en tus controladores, inyecta el `I18nService` y usa el decorador `@Lang()` para obtener el idioma de la petición:

```typescript
import { I18nService, SupportedLanguage } from '@infrastructure/config/i18n';
import { Lang } from '@infrastructure/adapters/web/decorators/lang.decorator';

@Controller('example')
export class ExampleController {
  constructor(private readonly i18n: I18nService) {}

  @Get()
  example(@Lang() lang: SupportedLanguage) {
    return {
      message: this.i18n.t('auth.login.success', lang),
    };
  }
}
```

### Enviar el Idioma desde el Cliente

El cliente debe enviar el idioma deseado en el header `Accept-Language`:

```bash
# Inglés
curl -H "Accept-Language: en" http://localhost:3000/auth/login

# Español
curl -H "Accept-Language: es" http://localhost:3000/auth/login
```

## Estructura de Archivos de Traducción

Los archivos de traducción están en formato JSON:

```
src/infrastructure/config/i18n/
├── translations/
│   ├── en.json
│   └── es.json
├── i18n.service.ts
└── index.ts
```

### Formato de las Traducciones

```json
{
  "auth": {
    "register": {
      "success": "User registered successfully",
      "errors": {
        "emailExists": "Email already exists"
      }
    }
  }
}
```

### Acceder a las Traducciones

Usa la notación de punto para acceder a las claves anidadas:

```typescript
this.i18n.t('auth.register.success', 'es'); // "Usuario registrado exitosamente"
this.i18n.t('auth.register.errors.emailExists', 'en'); // "Email already exists"
```

## Agregar Nuevas Traducciones

1. Agrega la clave y valor en ambos archivos de traducción (`en.json` y `es.json`)
2. Usa la clave en tu código con `this.i18n.t('tu.clave.aqui', lang)`

## Agregar Nuevos Idiomas

1. Crea un nuevo archivo JSON en `src/infrastructure/config/i18n/translations/` (ej: `fr.json`)
2. Actualiza el tipo `SupportedLanguage` en `i18n.service.ts`:
   ```typescript
   export type SupportedLanguage = 'en' | 'es' | 'fr';
   ```
3. Importa y registra el archivo en `i18n.service.ts`:
   ```typescript
   import * as frTranslations from './translations/fr.json';
   
   private translations = {
     en: enTranslations,
     es: esTranslations,
     fr: frTranslations,
   };
   ```
4. Actualiza el decorador `@Lang()` para reconocer el nuevo idioma

## Ejemplo Completo

### auth.controller.ts

```typescript
@Post('register')
@HttpCode(HttpStatus.CREATED)
async register(
  @Body() registerDto: RegisterDto,
  @Lang() lang: SupportedLanguage,
) {
  const result = await this.registerUserUseCase.execute(registerDto);

  return result.fold(
    (data) => ({
      statusCode: HttpStatus.CREATED,
      message: this.i18n.t('auth.register.success', lang),
      data,
    }),
    (error) => {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException(
          this.i18n.t('auth.register.errors.emailExists', lang),
        );
      }
      // ...más manejo de errores
    },
  );
}
```

### Petición del Cliente

```bash
# En español
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: es" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Respuesta en español
{
  "statusCode": 201,
  "message": "Usuario registrado exitosamente",
  "data": { ... }
}
```
