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

  // Get auth status for "isLiked"
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get like count and isLiked
  const [
    { count: likeCount },
    { data: userLike }
  ] = await Promise.all([
    supabase.from("book_likes").select("*", { count: "exact", head: true }).eq("book_id", bookId),
    user 
      ? supabase.from("book_likes").select("*").eq("book_id", bookId).eq("user_id", user.id).single()
      : Promise.resolve({ data: null })
  ]);

  // Increment view count (simple)
  await supabase.rpc("increment_book_views", { bid: bookId });

  // Get canonical chapters ordered by position
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, content, order_index, is_canon, parent_chapter_id")
    .eq("book_id", bookId)
    .eq("is_canon", true)
    .is("deleted_at", null)
    .order("order_index", { ascending: true });

  return { 
    book: {
      ...book,
      likeCount: likeCount || 0,
      isLiked: !!userLike
    }, 
    chapters: chapters ?? [] 
  };
}
