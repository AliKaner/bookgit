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
  parentBookId?: string;
  seriesId?: string;
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
      parent_book_id: input.parentBookId || null,
      series_id: input.seriesId || null,
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

  // 5. Seed first chapter (if not a sequel, sequels might start fresh or we might want to branch?)
  // For now, always seed a "Chapter 1" or similar
  await supabase.from("chapters").insert({
    book_id: book.id,
    title: "Chapter 1",
    order: 0,
    is_canon: true,
  });

  // 6. Inherit data from parent book if sequel
  if (input.parentBookId) {
    // a. Copy Characters
    const { data: oldChars } = await supabase.from("characters").select("*, details:character_details(*)").eq("book_id", input.parentBookId);
    if (oldChars) {
      for (const char of oldChars) {
        const { data: newChar } = await supabase.from("characters").insert({
          user_id: user.id,
          book_id: book.id,
          source_character_id: char.id,
          name: char.name,
          role: char.role,
          color: char.color
        }).select().single();

        if (newChar && char.details?.length) {
          await supabase.from("character_details").insert(
            char.details.map((d: any) => ({
              character_id: newChar.id,
              key: d.key,
              value: d.value
            }))
          );
        }
      }
    }

    // b. Copy Dictionary
    const { data: oldDict } = await supabase.from("dictionary_entries").select("*").eq("book_id", input.parentBookId);
    if (oldDict?.length) {
      await supabase.from("dictionary_entries").insert(
        oldDict.map(d => ({
          user_id: user.id,
          book_id: book.id,
          source_entry_id: d.id,
          word: d.word,
          meaning: d.meaning,
          color: d.color
        }))
      );
    }

    // c. Copy World
    const { data: oldWorld } = await supabase.from("world_entries").select("*").eq("book_id", input.parentBookId);
    if (oldWorld?.length) {
      await supabase.from("world_entries").insert(
        oldWorld.map(w => ({
          user_id: user.id,
          book_id: book.id,
          source_entry_id: w.id,
          label: w.label,
          value: w.value
        }))
      );
    }
  }

  revalidatePath("/books");
  return { bookId: book.id };
}

// ─── Get Full Book State for Editor ───────────────────────────
export async function getBookState(bookId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch all in parallel
  const [
    { data: chapters },
    { data: characters },
    { data: dictionary },
    { data: world },
    { data: notes },
    { data: bookSettings }
  ] = await Promise.all([
    supabase.from("chapters").select("*").eq("book_id", bookId).is("deleted_at", null).order("order"),
    supabase.from("characters").select("*, details:character_details(*)").eq("book_id", bookId),
    supabase.from("dictionary_entries").select("*").eq("book_id", bookId),
    supabase.from("world_entries").select("*").eq("book_id", bookId),
    supabase.from("notes").select("*").eq("book_id", bookId).order("created_at"),
    supabase.from("books").select("editor_settings").eq("id", bookId).single()
  ]);

  return {
    styles: bookSettings?.editor_settings || {},
    chapters: (chapters ?? []).map(ch => ({
      id: ch.id,
      title: ch.title,
      content: ch.content || "",
      parentId: ch.parent_chapter_id,
      order: ch.order,
      isCanon: ch.is_canon
    })),
    characters: (characters ?? []).map(c => ({
      id: c.id,
      name: c.name,
      role: c.role || "",
      color: c.color || "blue",
      details: (c.details ?? []).map((d: any) => ({ key: d.key, value: d.value }))
    })),
    dictionary: (dictionary ?? []).map(d => ({
      id: d.id,
      word: d.word,
      meaning: d.meaning || "",
      color: d.color || "blue"
    })),
    world: (world ?? []).map(w => ({
      id: w.id,
      label: w.label,
      value: w.value || ""
    })),
    notes: (notes ?? []).map(n => ({
      id: n.id,
      title: n.title,
      content: n.content || "",
      createdAt: n.created_at ? new Date(n.created_at).toLocaleDateString("tr-TR") : ""
    }))
  };
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
      stats:book_stats(*),
      series:series(*)
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
      profile:profiles(display_name, username, avatar_url),
      series:series(*)
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

// ─── Series Management ──────────────────────────────────────────
export async function createSeries(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("series")
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/books");
  return { series: data };
}

export async function getUserSeries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("series")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return data ?? [];
}

export async function setBookSeries(bookId: string, seriesId: string | null, order: number = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("books")
    .update({ 
      series_id: seriesId,
      series_order: order
    })
    .eq("id", bookId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/books");
  return { success: true };
}

// ─── Save Full Book State ───────────────────────────────────────
export async function saveBookState(bookId: string, state: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 1. Upsert Chapters
  // Note: we use upsert to create new ones or update existing ones
  const chaptersToUpsert = state.chapters.map((ch: any) => ({
    id: ch.id,
    book_id: bookId,
    parent_chapter_id: ch.parentId,
    title: ch.title,
    content: ch.content,
    order: ch.order,
    is_canon: ch.isCanon,
    updated_at: new Date().toISOString()
  }));

  const { error: chError } = await supabase.from("chapters").upsert(chaptersToUpsert, { onConflict: "id" });
  if (chError) return { error: chError.message };

  // 2. Upsert Characters & Details
  // This is slightly more complex if we want to sync perfectly, 
  // but for now let's just upsert the characters.
  for (const char of state.characters) {
    const { data: cData, error: cErr } = await supabase.from("characters").upsert({
      id: char.id,
      user_id: user.id,
      book_id: bookId,
      name: char.name,
      role: char.role,
      color: char.color,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" }).select().single();

    if (!cErr && cData) {
      // Upsert details for this character
      const detailsToUpsert = char.details.map((d: any) => ({
        character_id: cData.id,
        key: d.key,
        value: d.value
      }));
      if (detailsToUpsert.length) {
        await supabase.from("character_details").upsert(detailsToUpsert, { onConflict: "character_id,key" });
      }
    }
  }

  // 3. Upsert Dictionary
  const dictToUpsert = state.dictionary.map((d: any) => ({
    id: d.id,
    user_id: user.id,
    book_id: bookId,
    word: d.word,
    meaning: d.meaning,
    color: d.color
  }));
  if (dictToUpsert.length) await supabase.from("dictionary_entries").upsert(dictToUpsert, { onConflict: "id" });

  // 4. Upsert World
  const worldToUpsert = state.world.map((w: any) => ({
    id: w.id,
    user_id: user.id,
    book_id: bookId,
    label: w.label,
    value: w.value
  }));
  if (worldToUpsert.length) await supabase.from("world_entries").upsert(worldToUpsert, { onConflict: "id" });

  // 5. Upsert Notes
  const notesToUpsert = state.notes.map((n: any) => ({
    id: n.id,
    book_id: bookId,
    title: n.title,
    content: n.content
  }));
  if (notesToUpsert.length) await supabase.from("notes").upsert(notesToUpsert, { onConflict: "id" });

  // 6. Update Editor Settings (Styles)
  await supabase.from("books").update({ 
    updated_at: new Date().toISOString(),
    editor_settings: state.styles || {}
  }).eq("id", bookId);

  revalidatePath("/editor");
  return { success: true };
}

// ─── Helper: flatten Supabase nested relations ────────────────
function flattenRelations(row: Record<string, unknown>): BookWithMeta {
  const genres = (row.genres as { genre: unknown }[] | null)?.map((g) => g.genre) ?? [];
  const tags   = (row.tags   as { tag:   unknown }[] | null)?.map((t) => t.tag)   ?? [];
  const stats  = (row.stats  as unknown[] | null)?.[0] ?? undefined;
  const profile = (row.profile as unknown[] | null)?.[0] ?? undefined;
  const series = (row.series as unknown) ?? undefined;
  return { ...row, genres, tags, stats, profile, series } as BookWithMeta;
}
