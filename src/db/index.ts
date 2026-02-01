import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';

if (!process.env.DATABASE_URL) {
  config({ path: '.env.local' });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is not set. Database connection will fail.');
  // Throwing here breaks the build if this file is imported during static generation
  // even if the DB isn't actively used. 
  // We'll proceed with a dummy string to allow the module to load.
}

// Disable prefetch as it is not supported for "Transaction" pool mode 
export const client = postgres(connectionString || 'postgres://user:pass@host:5432/db', { prepare: false });
export const db = drizzle(client, { schema });
