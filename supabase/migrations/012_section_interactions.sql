-- ============================================================
--  BookGit – Section Interactions Migration (idempotent)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.section_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id     UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id  UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  section_idx INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, section_idx, user_id)
);

CREATE INDEX IF NOT EXISTS idx_section_likes_chapter ON public.section_likes(chapter_id, section_idx);

CREATE TABLE IF NOT EXISTS public.section_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id     UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id  UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  section_idx INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_section_comments_chapter ON public.section_comments(chapter_id, section_idx);

ALTER TABLE public.section_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "section_likes: own write"     ON public.section_likes;
DROP POLICY IF EXISTS "section_likes: public read"   ON public.section_likes;
DROP POLICY IF EXISTS "section_comments: own write"  ON public.section_comments;
DROP POLICY IF EXISTS "section_comments: public read" ON public.section_comments;

CREATE POLICY "section_likes: own write"    ON public.section_likes FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "section_likes: public read"  ON public.section_likes FOR SELECT USING (true);

CREATE POLICY "section_comments: own write"   ON public.section_comments FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "section_comments: public read" ON public.section_comments FOR SELECT USING (true);
