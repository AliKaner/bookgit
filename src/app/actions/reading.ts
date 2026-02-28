import { createClient } from "@/lib/supabase/server";

/**
 * Fetches a public book with its canonical chapters for the reading view.
 * No auth required — only works for public books.
 */
export async function getPublicBookForReading(bookId: string) {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select(`
      id, title, description, cover_color, cover_image_url, language, created_at,
      profiles:user_id ( display_name, avatar_url ),
      book_genres ( genres ( slug, emoji, labels ) ),
      book_tags ( tags ( name ) )
    `)
    .eq("id", bookId)
    .eq("visibility", "public")
    .single();

  if (error || !book) return null;

  // Get canonical chapters ordered by position
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, content, order_index, is_canon, parent_id")
    .eq("book_id", bookId)
    .eq("is_canon", true)
    .order("order_index", { ascending: true });

  return { book, chapters: chapters ?? [] };
}
