import { existsSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

import { getDatabaseOptions } from './database.config';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default new DataSource({
  ...getDatabaseOptions(),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
});
