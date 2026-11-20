import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (connectionString) {
    try {
      pool = new pg.Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : undefined,
      });
      dbInstance = drizzle(pool, { schema });
      return dbInstance;
    } catch (err) {
      console.warn('PostgreSQL connection error, falling back to local memory store:', err);
    }
  }

  return null;
}

export const db = getDb();
export { schema };
