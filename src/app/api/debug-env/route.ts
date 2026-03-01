import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "❌ NOT SET",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `✅ SET (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20)}...)`
      : "❌ NOT SET",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "❌ NOT SET",
    SUPABASE_S3_ENDPOINT: process.env.SUPABASE_S3_ENDPOINT ? "✅ SET" : "❌ NOT SET",
    SUPABASE_S3_REGION: process.env.SUPABASE_S3_REGION ?? "❌ NOT SET",
    SUPABASE_S3_ACCESS_KEY_ID: process.env.SUPABASE_S3_ACCESS_KEY_ID ? "✅ SET" : "❌ NOT SET",
    SUPABASE_S3_SECRET_ACCESS_KEY: process.env.SUPABASE_S3_SECRET_ACCESS_KEY ? "✅ SET" : "❌ NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
