// ─── Supabase Database Types ──────────────────────────────────
// Hand-crafted until `supabase gen types` is connected.
// Run: npx supabase gen types typescript --project-id zfqxhdfszlhovgsfbrys > src/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Visibility = "public" | "private";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "email">;
        Update: Partial<Profile>;
      };
      books: {
        Row: Book;
        Insert: Partial<Book> & Pick<Book, "user_id" | "title">;
        Update: Partial<Book>;
      };
      genres: {
        Row: Genre;
        Insert: Omit<Genre, "id">;
        Update: Partial<Genre>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, "id" | "created_at">;
        Update: Partial<Tag>;
      };
      book_genres: {
        Row: { book_id: string; genre_id: number };
        Insert: { book_id: string; genre_id: number };
        Update: never;
      };
      book_tags: {
        Row: { book_id: string; tag_id: string };
        Insert: { book_id: string; tag_id: string };
        Update: never;
      };
      book_stats: {
        Row: BookStats;
        Insert: Partial<BookStats> & Pick<BookStats, "book_id">;
        Update: Partial<BookStats>;
      };
      chapters: {
        Row: Chapter;
        Insert: Partial<Chapter> & Pick<Chapter, "book_id" | "title">;
        Update: Partial<Chapter>;
      };
      characters: {
        Row: Character;
        Insert: Partial<Character> & Pick<Character, "user_id" | "name">;
        Update: Partial<Character>;
      };
      character_details: {
        Row: CharacterDetail;
        Insert: Omit<CharacterDetail, "id">;
        Update: Partial<CharacterDetail>;
      };
      dictionary_entries: {
        Row: DictionaryEntry;
        Insert: Partial<DictionaryEntry> & Pick<DictionaryEntry, "user_id" | "word">;
        Update: Partial<DictionaryEntry>;
      };
      world_entries: {
        Row: WorldEntry;
        Insert: Partial<WorldEntry> & Pick<WorldEntry, "user_id" | "label">;
        Update: Partial<WorldEntry>;
      };
      notes: {
        Row: Note;
        Insert: Partial<Note> & Pick<Note, "book_id" | "title">;
        Update: Partial<Note>;
      };
      book_likes: {
        Row: { book_id: string; user_id: string; created_at: string };
        Insert: { book_id: string; user_id: string };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      visibility_type: Visibility;
    };
  };
}

// ─── Model Types ─────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_color: string;
  cover_image_url: string | null;
  visibility: Visibility;
  language: string;
  parent_book_id: string | null;
  search_vector: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  slug: string;
  labels: Record<string, string>;   // {"tr": "Fantastik", "en": "Fantasy"}
  emoji: string | null;
  sort: number;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface BookStats {
  book_id: string;
  word_count: number;
  chapter_count: number;
  branch_count: number;
  like_count: number;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  parent_chapter_id: string | null;
  title: string;
  content: string;
  order: number;
  is_canon: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  user_id: string;
  book_id: string | null;
  source_character_id: string | null;
  name: string;
  role: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterDetail {
  id: string;
  character_id: string;
  key: string;
  value: string;
}

export interface DictionaryEntry {
  id: string;
  user_id: string;
  book_id: string | null;
  source_entry_id: string | null;
  word: string;
  meaning: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface WorldEntry {
  id: string;
  user_id: string;
  book_id: string | null;
  source_entry_id: string | null;
  label: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  book_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ─── View/Enriched Types ─────────────────────────────────────

export interface BookWithMeta extends Book {
  genres?: Genre[];
  tags?: Tag[];
  stats?: BookStats;
  profile?: Pick<Profile, "display_name" | "username" | "avatar_url">;
}
