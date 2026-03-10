import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.redirect(`${origin}/books`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Save intent in a non-HttpOnly cookie so the client can read it after login
    const cookieStore = await cookies();
    cookieStore.set("pending_invite_id", id, { 
      path: "/", 
      maxAge: 3600,
      httpOnly: false // Important: Allows client-side reading after login
    });
    return NextResponse.redirect(`${origin}/login`);
  }

  // If logged in, accept it immediately
  const { error } = await supabase
    .from("book_collaborators")
    .update({ status: "accepted" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Invite accept error:", error);
    return NextResponse.redirect(`${origin}/books`);
  }

  // Get the book ID to redirect directly to the editor
  const { data: collab } = await supabase
    .from("book_collaborators")
    .select("book_id")
    .eq("id", id)
    .single();
  
  if (collab?.book_id) {
    return NextResponse.redirect(`${origin}/editor?bookId=${collab.book_id}`);
  }

  return NextResponse.redirect(`${origin}/books`);
}
