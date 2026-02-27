import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './typeorm.config';

describe('TypeORM Configuration', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USERNAME: 'test_user',
      DB_PASSWORD: 'test_pass',
      DB_DATABASE: 'test_db',
      NODE_ENV: 'test',
    });
  });

  describe('getTypeOrmConfig', () => {
    it('should return TypeORM configuration', () => {
      const config = getTypeOrmConfig(configService);

      expect(config).toBeDefined();
      expect(config.type).toBe('postgres');
    });

    it('should use values from ConfigService', () => {
      const config = getTypeOrmConfig(configService) as Record<string, unknown>;

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.username).toBe('test_user');
      expect(config.password).toBe('test_pass');
      expect(config.database).toBe('test_db');
    });

    it('should use default values when env vars are not set', () => {
      const emptyConfigService = new ConfigService({});
      const config = getTypeOrmConfig(emptyConfigService) as Record<
        string,
        unknown
      >;

      // Values come from .env file, so we just verify they are defined
      expect(config.host).toBeDefined();
      expect(config.port).toBeDefined();
      expect(config.username).toBeDefined();
      expect(config.password).toBeDefined();
      expect(config.database).toBeDefined();
    });

    it('should have synchronize true in development', () => {
      const devConfigService = new ConfigService({ NODE_ENV: 'development' });
      const config = getTypeOrmConfig(devConfigService);

      expect(config.synchronize).toBe(true);
      expect(config.logging).toBe(true);
    });

    it('should have synchronize false in non-development', () => {
      const prodConfigService = new ConfigService({ NODE_ENV: 'production' });
      const config = getTypeOrmConfig(prodConfigService);

      expect(config.synchronize).toBe(false);
      expect(config.logging).toBe(false);
    });

    it('should include all entities', () => {
      const config = getTypeOrmConfig(configService);

      expect(config.entities).toBeDefined();
      expect(config.entities).toHaveLength(7);
    });

    it('should have migrations configuration', () => {
      const config = getTypeOrmConfig(configService);

      expect(config.migrations).toBeDefined();
      expect(config.migrationsRun).toBe(false);
    });
  });
});
