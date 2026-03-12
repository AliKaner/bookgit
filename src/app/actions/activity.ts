"use server";

import { createClient } from "@/lib/supabase/server";

export async function logActivity(
  bookId: string,
  chapterId: string | null,
  chapterTitle: string | null,
  action: string = "edited"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await supabase.from("book_activity_log").insert({
    book_id: bookId,
    user_id: user.id,
    chapter_id: chapterId || null,
    chapter_title: chapterTitle || null,
    action,
  });

  return { success: true };
}

export async function getBookActivity(bookId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("book_activity_log")
    .select(`
      *,
      profile:profiles(display_name, avatar_url, username)
    `)
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { error: error.message };
  return { data };
}
