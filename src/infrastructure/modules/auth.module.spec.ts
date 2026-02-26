import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth.module';
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
        AuthModule,
      ],
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
