/**
 * Run this once to apply the SQL migration to Supabase.
 * Uses the Supabase REST API (pg_jsonb_rpc extension is not needed).
 * 
 * node scripts/run-migration.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zfqxhdfszlhovgsfbrys.supabase.co";
// The publishable key only has anon-level access — DDL needs service role key.
// Get it from: Supabase Dashboard → Settings → API → service_role secret
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌  Set SUPABASE_SERVICE_ROLE_KEY environment variable.");
  console.error("   Get it from: Supabase Dashboard → Settings → API → service_role");
  console.error("   Then run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/run-migration.mjs");
  process.exit(1);
}

const sql = readFileSync("supabase/migrations/001_initial.sql", "utf8");

// Split into statements (rough split on semicolon-newline)
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

console.log(`Running ${statements.length} SQL statements…`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let ok = 0;
let fail = 0;
for (const stmt of statements) {
  try {
    const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" }).single();
    if (error) {
      // Many DDL errors are benign (IF NOT EXISTS etc)
      console.warn("⚠ ", error.message.slice(0, 80));
      fail++;
    } else {
      ok++;
    }
  } catch (e) {
    console.warn("⚠ ", e.message?.slice(0, 80));
    fail++;
  }
}

console.log(`\nDone: ${ok} ok, ${fail} warnings/errors`);
console.log("Tip: IF NOT EXISTS errors are safe to ignore.");
