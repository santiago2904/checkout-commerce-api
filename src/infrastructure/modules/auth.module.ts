import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import {
  BcryptHashService,
  JwtTokenService,
  JwtStrategy,
  JwtAuthGuard,
  RolesGuard,
} from '@infrastructure/adapters/auth';
import {
  User,
  Customer,
  Role,
  AuditLog,
} from '@infrastructure/adapters/database/typeorm/entities';
import {
  TypeOrmAuthRepository,
  TypeOrmCustomerRepository,
  TypeOrmAuditLogRepository,
} from '@infrastructure/adapters/database/typeorm/repositories';
import { LoginUseCase, RegisterUserUseCase } from '@application/use-cases/auth';
import {
  AUTH_REPOSITORY,
  CUSTOMER_REPOSITORY,
  HASH_SERVICE,
  TOKEN_SERVICE,
} from '@application/tokens';
import { AUDIT_LOG_REPOSITORY } from '@application/tokens';
import { AuthController } from '@infrastructure/adapters/http/controllers';
import { I18nService } from '@infrastructure/config/i18n';
import { AuditInterceptor } from '@infrastructure/adapters/web/interceptors/audit.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Customer, Role, AuditLog]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '1d';

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as StringValue,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Internationalization
    I18nService,
    // Auth Services
    BcryptHashService,
    JwtTokenService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    // Repository Implementations
    {
      provide: AUTH_REPOSITORY,
      useClass: TypeOrmAuthRepository,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: TypeOrmCustomerRepository,
    },
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: TypeOrmAuditLogRepository,
    },
    // Service Ports
    {
      provide: HASH_SERVICE,
      useExisting: BcryptHashService,
    },
    {
      provide: TOKEN_SERVICE,
      useExisting: JwtTokenService,
    },
    // Use Cases
    LoginUseCase,
    RegisterUserUseCase,
    // Interceptors
    AuditInterceptor,
  ],
  exports: [
    BcryptHashService,
    JwtTokenService,
    JwtAuthGuard,
    RolesGuard,
    PassportModule,
    JwtModule,
    LoginUseCase,
    RegisterUserUseCase,
  ],
})
export class AuthModule {}
