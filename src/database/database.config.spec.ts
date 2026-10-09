import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { getDatabaseOptions } from './database.config';

const originalEnv = { ...process.env };

const getSsl = () => (getDatabaseOptions() as PostgresConnectionOptions).ssl;

describe('getDatabaseOptions', () => {
  beforeEach(() => {
    delete process.env.DB_SSL;
    delete process.env.DB_SSL_REJECT_UNAUTHORIZED;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not use SSL by default', () => {
    expect(getSsl()).toBe(false);
  });

  it('does not use SSL when DB_SSL is false', () => {
    process.env.DB_SSL = 'false';
    expect(getSsl()).toBe(false);
  });

  it('verifies the server certificate when DB_SSL is true', () => {
    process.env.DB_SSL = 'true';
    expect(getSsl()).toEqual({ rejectUnauthorized: true });
  });

  it('accepts self-signed certificates only when explicitly allowed', () => {
    process.env.DB_SSL = 'true';
    process.env.DB_SSL_REJECT_UNAUTHORIZED = 'false';
    expect(getSsl()).toEqual({ rejectUnauthorized: false });
  });

  it('reads the connection settings from the environment', () => {
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '6543';
    const options = getDatabaseOptions() as PostgresConnectionOptions;
    expect(options.host).toBe('db.example.com');
    expect(options.port).toBe(6543);
  });
});
