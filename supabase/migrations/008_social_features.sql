-- ── Book Likes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_likes (
  book_id    UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (book_id, user_id)
);

ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_likes: own write" ON public.book_likes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "book_likes: public read" ON public.book_likes FOR SELECT USING (true);

-- ── Book Comments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id    UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  parent_id  UUID REFERENCES public.book_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_comments: own write" ON public.book_comments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "book_comments: public read" ON public.book_comments FOR SELECT USING (true);

-- ── Book View Stats (simple increment) ───────────────────────
-- Note: book_stats already exists, we might want to add a view_count if not there
-- Let's check book_stats table in 001_initial.sql if possible or just try to add it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_stats' AND column_name='view_count') THEN
    ALTER TABLE public.book_stats ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ── Increment View Count Function ───────────────────────────
CREATE OR REPLACE FUNCTION public.increment_book_views(bid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.book_stats
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE book_id = bid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
