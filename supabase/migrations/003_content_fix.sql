-- ============================================================
-- 003_content_fix.sql – Character Saving & Series Sharing
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add series_id to content tables (FK to series)
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;
ALTER TABLE public.dictionary_entries ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;
ALTER TABLE public.world_entries ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;

-- 2. Performance Indices
CREATE INDEX IF NOT EXISTS idx_chars_series ON public.characters(series_id);
CREATE INDEX IF NOT EXISTS idx_dict_series ON public.dictionary_entries(series_id);
CREATE INDEX IF NOT EXISTS idx_world_series ON public.world_entries(series_id);
CREATE INDEX IF NOT EXISTS idx_notes_series ON public.notes(series_id);

-- 3. Fix Character Details saving (Missing UNIQUE constraint for composite upsert)
-- We remove any duplicates first just in case (optional but safer)
DELETE FROM public.character_details a USING public.character_details b 
WHERE a.id < b.id AND a.character_id = b.character_id AND a.key = b.key;

ALTER TABLE public.character_details ADD CONSTRAINT char_details_key_unique UNIQUE (character_id, key);

-- 4. RLS Updates for Series Sharing
-- Allow access if user owns the series OR if it's a public series (defined by book visibility)
DROP POLICY IF EXISTS "characters_own" ON public.characters;
CREATE POLICY "characters_own" ON public.characters FOR ALL USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "dict_own" ON public.dictionary_entries;
CREATE POLICY "dict_own" ON public.dictionary_entries FOR ALL USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "world_own" ON public.world_entries;
CREATE POLICY "world_own" ON public.world_entries FOR ALL USING (
  user_id = auth.uid()
);

-- Note: we don't need complex series-read policies yet since we only support one owner. 
-- The user already has "own" access. The series_id just helps in grouping/fetching.
