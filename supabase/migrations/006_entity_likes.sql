-- ── Character Likes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.character_likes (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (character_id, user_id)
);

ALTER TABLE public.character_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "character_likes: own write" ON public.character_likes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "character_likes: public read" ON public.character_likes FOR SELECT USING (true);

-- ── Dictionary Likes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dictionary_likes (
  entry_id   UUID NOT NULL REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (entry_id, user_id)
);

ALTER TABLE public.dictionary_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dictionary_likes: own write" ON public.dictionary_likes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "dictionary_likes: public read" ON public.dictionary_likes FOR SELECT USING (true);

-- ── World Likes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.world_likes (
  entry_id   UUID NOT NULL REFERENCES public.world_entries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (entry_id, user_id)
);

ALTER TABLE public.world_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "world_likes: own write" ON public.world_likes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "world_likes: public read" ON public.world_likes FOR SELECT USING (true);

-- ── Update RLS for public read access based on book visibility ──

-- Characters
DROP POLICY IF EXISTS "characters: public read" ON public.characters;
CREATE POLICY "characters: public read" ON public.characters FOR SELECT 
USING (book_id IN (SELECT id FROM public.books WHERE visibility = 'public' AND deleted_at IS NULL));

-- Dictionary Entries
DROP POLICY IF EXISTS "dict: public read" ON public.dictionary_entries;
CREATE POLICY "dict: public read" ON public.dictionary_entries FOR SELECT 
USING (book_id IN (SELECT id FROM public.books WHERE visibility = 'public' AND deleted_at IS NULL));

-- World Entries
DROP POLICY IF EXISTS "world: public read" ON public.world_entries;
CREATE POLICY "world: public read" ON public.world_entries FOR SELECT 
USING (book_id IN (SELECT id FROM public.books WHERE visibility = 'public' AND deleted_at IS NULL));
