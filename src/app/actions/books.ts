"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BookWithMeta, Visibility } from "@/types/supabase";

export interface CreateBookInput {
  title: string;
  description?: string;
  coverColor?: string;
  visibility: Visibility;
  genreIds?: number[];
  tagNames?: string[];   // raw strings — created if not exist
  language?: string;
}

// ─── Create Book ─────────────────────────────────────────────
export async function createBook(input: CreateBookInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Insert book
  const { data: book, error } = await supabase
    .from("books")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      cover_color: input.coverColor || "#1e293b",
      visibility: input.visibility,
      language: input.language || "tr",
    })
    .select()
    .single();

  if (error || !book) return { error: error?.message ?? "Kitap oluşturulamadı" };

  // 2. Attach genres
  if (input.genreIds?.length) {
    await supabase.from("book_genres").insert(
      input.genreIds.map((genre_id) => ({ book_id: book.id, genre_id }))
    );
  }

  // 3. Upsert + attach tags
  if (input.tagNames?.length) {
    for (const name of input.tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean)) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ user_id: user.id, name }, { onConflict: "user_id,name" })
        .select("id")
        .single();
      if (tag) {
        await supabase.from("book_tags").insert({ book_id: book.id, tag_id: tag.id });
      }
    }
  }

  // 4. Init stats row
  await supabase.from("book_stats").insert({ book_id: book.id });

  // 5. Seed first chapter
  await supabase.from("chapters").insert({
    book_id: book.id,
    title: "Bölüm 1",
    order: 0,
    is_canon: true,
  });

  revalidatePath("/books");
  return { bookId: book.id };
}

// ─── Get My Books ─────────────────────────────────────────────
export async function getMyBooks(): Promise<BookWithMeta[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("books")
    .select(`
      *,
      genres:book_genres(genre:genres(*)),
      tags:book_tags(tag:tags(*)),
      stats:book_stats(*)
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (data ?? []).map(flattenRelations);
}

// ─── Get Public Books (with optional search + genre) ──────────
export async function getPublicBooks(opts?: {
  search?: string;
  genreSlug?: string;
  limit?: number;
  offset?: number;
}): Promise<BookWithMeta[]> {
  const supabase = await createClient();

  let query = supabase
    .from("books")
    .select(`
      *,
      genres:book_genres(genre:genres(*)),
      tags:book_tags(tag:tags(*)),
      stats:book_stats(*),
      profile:profiles(display_name, username, avatar_url)
    `)
    .eq("visibility", "public")
    .is("deleted_at", null);

  if (opts?.search) {
    // Trigram + FTS fallback
    query = query.ilike("title", `%${opts.search}%`);
  }

  query = query
    .order("updated_at", { ascending: false })
    .limit(opts?.limit ?? 24)
    .range(opts?.offset ?? 0, (opts?.offset ?? 0) + (opts?.limit ?? 24) - 1);

  const { data } = await query;
  return (data ?? []).map(flattenRelations);
}

// ─── Get All Genres ───────────────────────────────────────────
export async function getGenres() {
  const supabase = await createClient();
  const { data } = await supabase.from("genres").select("*").order("sort");
  return data ?? [];
}

// ─── Delete Book (soft) ───────────────────────────────────────
export async function deleteBook(bookId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("books")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", bookId)
    .eq("user_id", user.id);

  revalidatePath("/books");
}

// ─── Update Book Visibility ───────────────────────────────────
export async function updateBookVisibility(bookId: string, visibility: Visibility) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("books")
    .update({ visibility })
    .eq("id", bookId)
    .eq("user_id", user.id);

  revalidatePath("/books");
}

// ─── Upload Cover Image ───────────────────────────────────────
export async function uploadBookCover(bookId: string, file: File) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${bookId}/cover.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("covers")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("covers")
    .getPublicUrl(path);

  await supabase
    .from("books")
    .update({ cover_image_url: publicUrl })
    .eq("id", bookId)
    .eq("user_id", user.id);

  revalidatePath("/books");
  return { url: publicUrl };
}

// ─── Helper: flatten Supabase nested relations ────────────────
function flattenRelations(row: Record<string, unknown>): BookWithMeta {
  const genres = (row.genres as { genre: unknown }[] | null)?.map((g) => g.genre) ?? [];
  const tags   = (row.tags   as { tag:   unknown }[] | null)?.map((t) => t.tag)   ?? [];
  const stats  = (row.stats  as unknown[] | null)?.[0] ?? undefined;
  const profile = (row.profile as unknown[] | null)?.[0] ?? undefined;
  return { ...row, genres, tags, stats, profile } as BookWithMeta;
}
