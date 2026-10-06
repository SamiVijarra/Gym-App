import { DataSourceOptions } from 'typeorm';
import { join } from 'path';

export function getDatabaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5435', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  };
}
