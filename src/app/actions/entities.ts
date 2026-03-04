"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EntityType = "character" | "dictionary" | "world";

/**
 * Toggles a like for a given entity.
 */
export async function toggleLike(type: EntityType, id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const table = `${type}_likes`;
  const idColumn = type === "character" ? "character_id" : "entry_id";

  // Check if already liked
  const { data: existing } = await supabase
    .from(table)
    .select("*")
    .eq(idColumn, id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idColumn, id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from(table)
      .insert({
        [idColumn]: id,
        user_id: user.id
      });
    if (error) return { error: error.message };
  }

  revalidatePath(`/${type === "character" ? "characters" : type}`);
  return { success: true, liked: !existing };
}

/**
 * Copies an entity to the user's personal collection/book.
 */
export async function copyEntity(type: EntityType, id: string, targetBookId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 1. Fetch source entity
  if (type === "character") {
    const { data: char, error: fetchErr } = await supabase
      .from("characters")
      .select("*, details:character_details(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !char) return { error: "Karakter bulunamadı" };

    // 2. Insert new character
    const { data: newChar, error: insertErr } = await supabase
      .from("characters")
      .insert({
        user_id: user.id,
        book_id: targetBookId || null,
        name: `${char.name} (Copy)`,
        role: char.role,
        color: char.color,
        source_character_id: char.id
      })
      .select()
      .single();

    if (insertErr || !newChar) return { error: insertErr?.message || "Karakter kopyalanamadı" };

    // 3. Copy details
    if (char.details?.length) {
      await supabase.from("character_details").insert(
        char.details.map((d: any) => ({
          character_id: newChar.id,
          key: d.key,
          value: d.value
        }))
      );
    }
    return { success: true, newId: newChar.id };

  } else if (type === "dictionary") {
    const { data: entry, error: fetchErr } = await supabase
      .from("dictionary_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !entry) return { error: "Kelime bulunamadı" };

    const { data: newEntry, error: insertErr } = await supabase
      .from("dictionary_entries")
      .insert({
        user_id: user.id,
        book_id: targetBookId || null,
        word: `${entry.word} (Copy)`,
        meaning: entry.meaning,
        color: entry.color,
        source_entry_id: entry.id
      })
      .select()
      .single();

    if (insertErr || !newEntry) return { error: insertErr?.message || "Kelime kopyalanamadı" };
    return { success: true, newId: newEntry.id };

  } else if (type === "world") {
    const { data: world, error: fetchErr } = await supabase
      .from("world_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !world) return { error: "Dünya birimi bulunamadı" };

    const { data: newWorld, error: insertErr } = await supabase
      .from("world_entries")
      .insert({
        user_id: user.id,
        book_id: targetBookId || null,
        label: `${world.label} (Copy)`,
        value: world.value,
        source_entry_id: world.id
      })
      .select()
      .single();

    if (insertErr || !newWorld) return { error: insertErr?.message || "Dünya birimi kopyalanamadı" };
    return { success: true, newId: newWorld.id };
  }

  return { error: "Geçersiz tür" };
}

/**
 * Fetches public entities with likes and counts.
 */
export async function getPublicEntities(type: EntityType, opts?: { search?: string; limit?: number; offset?: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const table = type === "character" ? "characters" : type === "dictionary" ? "dictionary_entries" : "world_entries";
  const nameCol = type === "character" ? "name" : type === "dictionary" ? "word" : "label";
  const likesTable = `${type}_likes`;
  const idColumn = type === "character" ? "character_id" : "entry_id";

  let query = supabase
    .from(table)
    .select(`
      *,
      book:books!inner(visibility, title),
      profiles:profiles(display_name, username, avatar_url),
      likes: ${likesTable} (count)
    `)
    .eq("book.visibility", "public");

  if (opts?.search) {
    query = query.ilike(nameCol, `%${opts.search}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 24)
    .range(opts?.offset ?? 0, (opts?.offset ?? 0) + (opts?.limit ?? 24) - 1);

  const { data, error } = await query;
  if (error) return { error: error.message };

  // Manually check if user liked each item
  let userLikes: Set<string> = new Set();
  if (user) {
    const { data: likes } = await supabase
      .from(likesTable)
      .select(idColumn)
      .eq("user_id", user.id);
    if (likes) {
      likes.forEach((l: any) => userLikes.add(l[idColumn]));
    }
  }

  return {
    data: data.map((item: any) => ({
      ...item,
      likeCount: item.likes?.[0]?.count || 0,
      isLiked: userLikes.has(item.id)
    }))
  };
}

/**
 * Fetches the current user's own entities across all books.
 */
export async function getMyEntities(type: EntityType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const table = type === "character" ? "characters" : type === "dictionary" ? "dictionary_entries" : "world_entries";
  const likesTable = `${type}_likes`;
  const idColumn = type === "character" ? "character_id" : "entry_id";

  const { data, error } = await supabase
    .from(table)
    .select(`
      *,
      book:books(visibility, title),
      profiles:profiles(display_name, username, avatar_url),
      likes: ${likesTable} (count)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  // For "My" entities, we check if they are liked by the owner too (why not)
  const { data: userLikesData } = await supabase
    .from(likesTable)
    .select(idColumn)
    .eq("user_id", user.id);
  
  const userLikes = new Set(userLikesData?.map((l: any) => l[idColumn]) || []);

  return {
    data: data.map((item: any) => ({
      ...item,
      likeCount: item.likes?.[0]?.count || 0,
      isLiked: userLikes.has(item.id)
    }))
  };
}
