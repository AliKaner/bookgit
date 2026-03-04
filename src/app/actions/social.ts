"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleBookLike(bookId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Check if already liked
  const { data: existing } = await supabase
    .from("book_likes")
    .select()
    .eq("book_id", bookId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Unlike
    await supabase.from("book_likes").delete().eq("book_id", bookId).eq("user_id", user.id);
  } else {
    // Like
    await supabase.from("book_likes").insert({ book_id: bookId, user_id: user.id });
  }

  revalidatePath(`/read/${bookId}`);
  return { success: true, isLiked: !existing };
}

export async function addBookComment(bookId: string, content: string, parentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("book_comments")
    .insert({
      book_id: bookId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null
    })
    .select(`
      *,
      profile:profiles(display_name, avatar_url, username)
    `)
    .single();

  if (error) return { error: error.message };
  
  revalidatePath(`/read/${bookId}`);
  return { success: true, comment: data };
}

export async function getBookComments(bookId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("book_comments")
    .select(`
      *,
      profile:profiles(display_name, avatar_url, username)
    `)
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}
