import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres:zsSLF4pu3LHoZb1e@db.zfqxhdfszlhovgsfbrys.supabase.co:5432/postgres'
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '010_notifications.sql'), 'utf8');
    await client.connect();
    await client.query(sql);
    console.log("Migration 010_notifications.sql applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
