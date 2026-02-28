/**
 * One-time Supabase Storage setup script.
 * Creates the "covers" bucket for book cover images.
 * 
 * Run: node scripts/setup-storage.mjs
 */

// Using Supabase REST API to create bucket
const SUPABASE_URL = "https://zfqxhdfszlhovgsfbrys.supabase.co";
// Note: this needs service_role key to create buckets.
// If you don't have it yet, create the bucket manually:
// Supabase Dashboard → Storage → New Bucket
// Name: covers, Public: YES

// Alternative: use supabase-js admin client
// import { createClient } from "@supabase/supabase-js";
// const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
// await supabase.storage.createBucket("covers", { public: true, fileSizeLimit: 5242880 });

console.log("=== Supabase Storage Setup ===");
console.log("");
console.log("To set up the covers bucket manually:");
console.log("1. Go to: " + SUPABASE_URL.replace("supabase.co", "supabase.com") + "/project/zfqxhdfszlhovgsfbrys/storage/buckets");
console.log("2. Click 'New Bucket'");
console.log("3. Name: 'covers'");
console.log("4. Make it Public: YES");
console.log("5. File size limit: 5MB");
console.log("6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif");
console.log("");
console.log("Then run the SQL migration in Supabase SQL Editor:");
console.log("File: supabase/migrations/001_initial.sql");
