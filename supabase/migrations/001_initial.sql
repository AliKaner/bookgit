-- ============================================================
--  BookGit – Initial Migration
--  Run this in Supabase SQL Editor (once)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- trigram for LIKE search

-- ── Profiles (mirrors auth.users) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  display_name   TEXT,
  username       TEXT UNIQUE,
  avatar_url     TEXT,
  bio            TEXT,
  website        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Genres ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.genres (
  id     SMALLSERIAL PRIMARY KEY,
  slug   TEXT NOT NULL UNIQUE,   -- 'fantasy', 'sci_fi', ...
  labels JSONB NOT NULL,         -- {"tr": "Fantastik", "en": "Fantasy"}
  emoji  TEXT,
  sort   SMALLINT DEFAULT 0
);

INSERT INTO public.genres (slug, labels, emoji, sort) VALUES
  ('fantasy',         '{"tr":"Fantastik","en":"Fantasy"}',           '🧙',  1),
  ('sci_fi',          '{"tr":"Bilim Kurgu","en":"Science Fiction"}',  '🚀',  2),
  ('mystery',         '{"tr":"Gizem","en":"Mystery"}',               '🔍',  3),
  ('thriller',        '{"tr":"Gerilim","en":"Thriller"}',            '😱',  4),
  ('romance',         '{"tr":"Romantik","en":"Romance"}',            '💕',  5),
  ('historical',      '{"tr":"Tarihi","en":"Historical"}',           '🏛️', 6),
  ('horror',          '{"tr":"Korku","en":"Horror"}',                '👻',  7),
  ('adventure',       '{"tr":"Macera","en":"Adventure"}',            '⚔️', 8),
  ('literary_fiction','{"tr":"Edebi Kurgu","en":"Literary Fiction"}','📚',  9),
  ('young_adult',     '{"tr":"Genç Yetişkin","en":"Young Adult"}',   '🎒', 10),
  ('childrens',       '{"tr":"Çocuk","en":"Children''s"}',           '🧸', 11),
  ('dystopia',        '{"tr":"Distopya","en":"Dystopia"}',           '🌑', 12),
  ('paranormal',      '{"tr":"Paranormal","en":"Paranormal"}',       '👁️',13),
  ('crime',           '{"tr":"Suç","en":"Crime"}',                   '🔫', 14),
  ('poetry',          '{"tr":"Şiir","en":"Poetry"}',                 '✍️', 15),
  ('biography',       '{"tr":"Biyografi","en":"Biography"}',         '🎭', 16),
  ('self_help',       '{"tr":"Kişisel Gelişim","en":"Self Help"}',   '💡', 17),
  ('graphic_novel',   '{"tr":"Grafik Roman","en":"Graphic Novel"}',  '🎨', 18)
ON CONFLICT (slug) DO NOTHING;

-- ── Books ─────────────────────────────────────────────────────
CREATE TYPE public.visibility_type AS ENUM ('public', 'private');

CREATE TABLE IF NOT EXISTS public.books (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description       TEXT CHECK (char_length(description) <= 2000),
  cover_color       TEXT DEFAULT '#1e293b',
  cover_image_url   TEXT,                              -- Supabase Storage URL
  visibility        visibility_type NOT NULL DEFAULT 'private',
  language          TEXT NOT NULL DEFAULT 'tr',        -- ISO 639-1
  parent_book_id    UUID REFERENCES public.books(id),  -- devam kitabı
  -- full-text search
  search_vector     TSVECTOR,
  -- soft delete
  deleted_at        TIMESTAMPTZ,
  -- metadata
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_user      ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_visibility ON public.books(visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_books_search    ON public.books USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON public.books USING GIN(title gin_trgm_ops);

-- FTS trigger
CREATE OR REPLACE FUNCTION public.update_book_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('turkish', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('turkish', coalesce(NEW.description, '')), 'B');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS books_search_vector_trig ON public.books;
CREATE TRIGGER books_search_vector_trig
  BEFORE INSERT OR UPDATE OF title, description
  ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_book_search_vector();

-- ── Book → Genre (N:M) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_genres (
  book_id   UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  genre_id  SMALLINT NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, genre_id)
);

-- ── Tags ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- ── Book → Tag (N:M) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_tags (
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);

-- ── Book Stats (cache) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_stats (
  book_id        UUID PRIMARY KEY REFERENCES public.books(id) ON DELETE CASCADE,
  word_count     INTEGER DEFAULT 0,
  chapter_count  INTEGER DEFAULT 0,
  branch_count   INTEGER DEFAULT 0,
  like_count     INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chapters ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chapters (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id            UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  parent_chapter_id  UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  title              TEXT NOT NULL DEFAULT 'Yeni Bölüm',
  content            TEXT DEFAULT '',
  "order"            SMALLINT NOT NULL DEFAULT 0,
  is_canon           BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_unique_canon
  ON public.chapters (book_id, parent_chapter_id)
  WHERE is_canon = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapters_book ON public.chapters(book_id);

-- ── Characters ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.characters (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id             UUID REFERENCES public.books(id) ON DELETE CASCADE,
  source_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  role                TEXT DEFAULT '',
  color               TEXT DEFAULT 'blue',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.character_details (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,
  value        TEXT NOT NULL DEFAULT ''
);

-- ── Dictionary ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dictionary_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id          UUID REFERENCES public.books(id) ON DELETE CASCADE,
  source_entry_id  UUID REFERENCES public.dictionary_entries(id) ON DELETE SET NULL,
  word             TEXT NOT NULL,
  meaning          TEXT DEFAULT '',
  color            TEXT DEFAULT 'blue',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── World ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.world_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id          UUID REFERENCES public.books(id) ON DELETE CASCADE,
  source_entry_id  UUID REFERENCES public.world_entries(id) ON DELETE SET NULL,
  label            TEXT NOT NULL,
  value            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id    UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'Not',
  content    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Book Likes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_likes (
  book_id    UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (book_id, user_id)
);

-- ── Book Translations (linked parallel books) ─────────────────
CREATE TABLE IF NOT EXISTS public.book_translation_relations (
  original_book_id    UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  translated_book_id  UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  target_language     TEXT NOT NULL,
  PRIMARY KEY (original_book_id, target_language)
);

-- ════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_genres     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_likes      ENABLE ROW LEVEL SECURITY;

-- profiles: own + public read
CREATE POLICY "profiles: own write"  ON public.profiles FOR ALL   USING (id = auth.uid());
CREATE POLICY "profiles: public read" ON public.profiles FOR SELECT USING (true);

-- books: owner full, public books readable by all
CREATE POLICY "books: owner"        ON public.books FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "books: public read"  ON public.books FOR SELECT USING (visibility = 'public' AND deleted_at IS NULL);

-- genres: global read
CREATE POLICY "genres: read" ON public.genres FOR SELECT USING (true);
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

-- book_genres: owner write, public book readers
CREATE POLICY "book_genres: owner"       ON public.book_genres FOR ALL    USING (book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid()));
CREATE POLICY "book_genres: public read" ON public.book_genres FOR SELECT USING (book_id IN (SELECT id FROM public.books WHERE visibility = 'public'));

-- tags: own
CREATE POLICY "tags: own" ON public.tags FOR ALL USING (user_id = auth.uid());

-- book_tags: owner write
CREATE POLICY "book_tags: owner"       ON public.book_tags FOR ALL    USING (book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid()));
CREATE POLICY "book_tags: public read" ON public.book_tags FOR SELECT USING (book_id IN (SELECT id FROM public.books WHERE visibility = 'public'));

-- book_stats: owner write, public read
CREATE POLICY "book_stats: owner"       ON public.book_stats FOR ALL    USING (book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid()));
CREATE POLICY "book_stats: public read" ON public.book_stats FOR SELECT USING (book_id IN (SELECT id FROM public.books WHERE visibility = 'public'));

-- chapters: owner write, public book readers
CREATE POLICY "chapters: owner"       ON public.chapters FOR ALL    USING (book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid()));
CREATE POLICY "chapters: public read" ON public.chapters FOR SELECT USING (book_id IN (SELECT id FROM public.books WHERE visibility = 'public') AND deleted_at IS NULL);

-- characters: own
CREATE POLICY "characters: own"        ON public.characters FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "char_details: via char" ON public.character_details FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- dictionary
CREATE POLICY "dict: own" ON public.dictionary_entries FOR ALL USING (user_id = auth.uid());

-- world
CREATE POLICY "world: own" ON public.world_entries FOR ALL USING (user_id = auth.uid());

-- notes (private to book owner)
CREATE POLICY "notes: owner" ON public.notes FOR ALL USING (book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid()));

-- likes: own write, public views
CREATE POLICY "likes: own"         ON public.book_likes FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "likes: public read" ON public.book_likes FOR SELECT USING (true);
