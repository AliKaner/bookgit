-- ============================================================
-- 002_series.sql  –  Series / Sequel support
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Series (named groups of related books)
CREATE TABLE IF NOT EXISTS series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  cover_color TEXT DEFAULT '#1e293b',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link books to a series + track order + optional parent (sequel link)
ALTER TABLE books ADD COLUMN IF NOT EXISTS series_id      UUID REFERENCES series(id) ON DELETE SET NULL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS series_order   INT  NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS parent_book_id UUID REFERENCES books(id) ON DELETE SET NULL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS editor_settings JSONB DEFAULT '{}'::jsonb;

-- Index for series lookups
CREATE INDEX IF NOT EXISTS idx_books_series_id ON books(series_id);
CREATE INDEX IF NOT EXISTS idx_books_parent_book_id ON books(parent_book_id);

-- RLS
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "series_owner_all" ON series;
CREATE POLICY "series_owner_all"
  ON series FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Series visible if user owns at least one book in it (read-only for others)
DROP POLICY IF EXISTS "series_public_read" ON series;
CREATE POLICY "series_public_read"
  ON series FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.series_id = series.id
        AND books.visibility = 'public'
    )
  );

-- Auto-update updated_at on series
CREATE OR REPLACE FUNCTION update_series_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS series_updated_at ON series;
CREATE TRIGGER series_updated_at
  BEFORE UPDATE ON series
  FOR EACH ROW EXECUTE FUNCTION update_series_updated_at();
