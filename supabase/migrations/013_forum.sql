-- ============================================================
--  BookGit – Book Forum Migration (idempotent)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id     UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_book ON public.forum_posts(book_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON public.forum_replies(post_id, created_at ASC);

-- Trigger to auto-increment reply count
CREATE OR REPLACE FUNCTION public.increment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_posts
  SET reply_count = reply_count + 1, updated_at = NOW()
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS forum_reply_count_trig ON public.forum_replies;
CREATE TRIGGER forum_reply_count_trig
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.increment_reply_count();

ALTER TABLE public.forum_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_posts: public read"   ON public.forum_posts;
DROP POLICY IF EXISTS "forum_posts: own write"     ON public.forum_posts;
DROP POLICY IF EXISTS "forum_replies: public read" ON public.forum_replies;
DROP POLICY IF EXISTS "forum_replies: own write"   ON public.forum_replies;

CREATE POLICY "forum_posts: public read"  ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "forum_posts: own write"    ON public.forum_posts FOR ALL    USING (user_id = auth.uid());

CREATE POLICY "forum_replies: public read" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "forum_replies: own write"   ON public.forum_replies FOR ALL   USING (user_id = auth.uid());
