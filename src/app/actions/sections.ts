"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSectionLike(
  bookId: string,
  chapterId: string,
  sectionIdx: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("section_likes")
    .select()
    .eq("chapter_id", chapterId)
    .eq("section_idx", sectionIdx)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase
      .from("section_likes")
      .delete()
      .eq("chapter_id", chapterId)
      .eq("section_idx", sectionIdx)
      .eq("user_id", user.id);
  } else {
    await supabase.from("section_likes").insert({
      book_id: bookId,
      chapter_id: chapterId,
      section_idx: sectionIdx,
      user_id: user.id,
    });
  }

  return { success: true, isLiked: !existing };
}

export async function addSectionComment(
  bookId: string,
  chapterId: string,
  sectionIdx: number,
  content: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("section_comments")
    .insert({
      book_id: bookId,
      chapter_id: chapterId,
      section_idx: sectionIdx,
      user_id: user.id,
      content: content.trim(),
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

export async function getSectionInteractions(bookId: string) {
  const supabase = await createClient();

  const [likesRes, commentsRes] = await Promise.all([
    supabase
      .from("section_likes")
      .select("chapter_id, section_idx, user_id")
      .eq("book_id", bookId),
    supabase
      .from("section_comments")
      .select(`
        *,
        profile:profiles(display_name, avatar_url, username)
      `)
      .eq("book_id", bookId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    likes: likesRes.data || [],
    comments: commentsRes.data || [],
  };
}
