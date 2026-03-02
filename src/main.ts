import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtExceptionFilter } from '@infrastructure/adapters/auth/filters';
import { I18nService } from '@infrastructure/config/i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get I18nService from DI container
  const i18nService = app.get(I18nService);

  // Register JWT Exception Filter globally
  app.useGlobalFilters(new JwtExceptionFilter(i18nService));
  app.setGlobalPrefix('api');
  // Enable validation globally

  // Enable CORS with explicit configuration for CloudFront
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'Accept',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours preflight cache
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if extra properties are sent
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert types automatically
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
