import 'reflect-metadata';
import { validate } from './validation';
import { EnvironmentVariables } from './environment.schema';

const baseConfig = {
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USERNAME: 'testuser',
  DB_PASSWORD: 'testpass',
  DB_DATABASE: 'testdb',
  JWT_SECRET: 'jwt-secret-key',
  JWT_EXPIRATION_TIME_IN_MINUTES: '15',
  JWT_REFRESH_SECRET: 'refresh-secret-key',
  JWT_REFRESH_EXPIRATION_TIME_IN_DAYS: '7',
  JWT_REFRESH_TOKEN_NAME: 'refreshToken',
  JWT_ACCESS_TOKEN_NAME: 'accessToken',
};

describe('validate', () => {
  beforeAll(() => {
    process.env = {
      JWT_EXPIRATION_TIME_IN_MINUTES: '15',
      JWT_REFRESH_EXPIRATION_TIME_IN_DAYS: '7',
      JWT_REFRESH_TOKEN_NAME: 'refreshToken',
      JWT_ACCESS_TOKEN_NAME: 'accessToken',
    };
  });

  it('should return validated config for valid environment variables', () => {
    const config = { ...baseConfig };
    const result = validate(config);

    expect(result).toBeInstanceOf(EnvironmentVariables);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should throw error for invalid NODE_ENV', () => {
    const config = { ...baseConfig, NODE_ENV: 'invalid' };
    expect(() => validate(config)).toThrow();
  });

  it('should throw error for missing required fields', () => {
    const config = {
      NODE_ENV: 'development',
      JWT_REFRESH_TOKEN_NAME: 'refreshToken',
      JWT_ACCESS_TOKEN_NAME: 'accessToken',
    };
    expect(() => validate(config)).toThrow();
  });

  it('should throw error for invalid DB_PORT type', () => {
    const config = { ...baseConfig, DB_PORT: 'invalid-port' };
    expect(() => validate(config)).toThrow();
  });
});
