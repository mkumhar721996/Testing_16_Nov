import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_POOL } from '../opening-hours/opening-hours.repository';

@Global()
@Module({
  providers: [{ provide: DB_POOL, useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL }) }],
  exports: [DB_POOL],
})
export class DbModule {}
