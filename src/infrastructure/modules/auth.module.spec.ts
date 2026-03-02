import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { StringValue } from 'ms';
import {
  BcryptHashService,
  JwtTokenService,
  JwtAuthGuard,
  RolesGuard,
} from '@infrastructure/adapters/auth';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const secret =
              configService.get<string>('JWT_SECRET') || 'test-secret';
            const expiresIn =
              configService.get<string>('JWT_EXPIRES_IN') || '1d';
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
      providers: [BcryptHashService, JwtTokenService, JwtAuthGuard, RolesGuard],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide BcryptHashService', () => {
    const service = module.get<BcryptHashService>(BcryptHashService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(BcryptHashService);
  });

  it('should provide JwtTokenService', () => {
    const service = module.get<JwtTokenService>(JwtTokenService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(JwtTokenService);
  });

  it('should provide JwtAuthGuard', () => {
    const guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should provide RolesGuard', () => {
    const guard = module.get<RolesGuard>(RolesGuard);
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(RolesGuard);
  });
});
