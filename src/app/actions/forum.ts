"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getForumPosts(bookId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("forum_posts")
    .select(`
      *,
      profile:profiles(display_name, avatar_url, username)
    `)
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function createForumPost(
  bookId: string,
  title: string,
  content: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      book_id: bookId,
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    })
    .select(`
      *,
      profile:profiles(display_name, avatar_url, username)
    `)
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/forum/${bookId}`);
  return { success: true, post: data };
}

export async function getForumPost(postId: string) {
  const supabase = await createClient();

  const [postRes, repliesRes] = await Promise.all([
    supabase
      .from("forum_posts")
      .select(`
        *,
        profile:profiles(display_name, avatar_url, username),
        book:books(id, title, user_id)
      `)
      .eq("id", postId)
      .single(),
    supabase
      .from("forum_replies")
      .select(`
        *,
        profile:profiles(display_name, avatar_url, username)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
  ]);

  if (postRes.error) return { error: postRes.error.message };
  return { post: postRes.data, replies: repliesRes.data || [] };
}

export async function addForumReply(postId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("forum_replies")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      profile:profiles(display_name, avatar_url, username)
    `)
    .single();

  if (error) return { error: error.message };

  // Get book_id from post for revalidation
  const { data: post } = await supabase
    .from("forum_posts")
    .select("book_id")
    .eq("id", postId)
    .single();

  if (post) {
    revalidatePath(`/forum/${post.book_id}/${postId}`);
  }
  return { success: true, reply: data };
}
