-- ============================================================
--  BookGit – Activity Log Migration (idempotent)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.book_activity_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id       UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id    UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  chapter_title TEXT,
  action        TEXT NOT NULL DEFAULT 'edited',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_book ON public.book_activity_log(book_id, created_at DESC);

ALTER TABLE public.book_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity: owner read"  ON public.book_activity_log;
DROP POLICY IF EXISTS "activity: collab read" ON public.book_activity_log;
DROP POLICY IF EXISTS "activity: insert own"  ON public.book_activity_log;

CREATE POLICY "activity: owner read" ON public.book_activity_log
  FOR SELECT USING (
    book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid())
  );

CREATE POLICY "activity: collab read" ON public.book_activity_log
  FOR SELECT USING (
    book_id IN (
      SELECT book_id FROM public.book_collaborators
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "activity: insert own" ON public.book_activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());
