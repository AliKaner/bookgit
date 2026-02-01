
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  
  console.log('Connecting to:', connectionString.replace(/:[^:@]*@/, ':***@')); // Hide password

  const sql = postgres(connectionString);

  try {
    const result = await sql`SELECT version()`;
    console.log('Connection successful!');
    console.log('Version:', result[0].version);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await sql.end();
  }
}

main();
