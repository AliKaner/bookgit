-- ============================================================
--  BookGit – Collaborative Editing
--  Adds book_collaborators table + updates RLS policies
-- ============================================================

-- ── Book Collaborators ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_collaborators (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id     UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'editor',
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_collab_user UNIQUE(book_id, user_id),
  CONSTRAINT unique_collab_email UNIQUE(book_id, email)
);

CREATE INDEX IF NOT EXISTS idx_book_collaborators_book ON public.book_collaborators(book_id);
CREATE INDEX IF NOT EXISTS idx_book_collaborators_user ON public.book_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_book_collaborators_email ON public.book_collaborators(email);

-- ── Helper: check if current user is an accepted collaborator ──
CREATE OR REPLACE FUNCTION public.is_book_collaborator(bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.book_collaborators
    WHERE book_id = bid
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Helper: check if current user is owner of a book ───────────
CREATE OR REPLACE FUNCTION public.is_book_owner(bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.books
    WHERE id = bid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── RLS for book_collaborators ──────────────────────────────────
ALTER TABLE public.book_collaborators ENABLE ROW LEVEL SECURITY;

-- Owner can manage all collaborators for their books
CREATE POLICY "collaborators: owner manage"
  ON public.book_collaborators FOR ALL
  USING (book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid()));

-- Invited users can see and update their own invite rows
CREATE POLICY "collaborators: own invites"
  ON public.book_collaborators FOR SELECT
  USING (user_id = auth.uid() OR email IN (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "collaborators: respond to invite"
  ON public.book_collaborators FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Accepted collaborators can see other collaborators on the same book
CREATE POLICY "collaborators: fellow collaborators"
  ON public.book_collaborators FOR SELECT
  USING (is_book_collaborator(book_id));

-- ── Update existing RLS policies for collaborator access ────────

-- BOOKS: allow collaborators to SELECT and UPDATE (not INSERT/DELETE)
DROP POLICY IF EXISTS "books: owner" ON public.books;
CREATE POLICY "books: owner"
  ON public.books FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "books: collaborator read"
  ON public.books FOR SELECT
  USING (is_book_collaborator(id));

CREATE POLICY "books: collaborator update"
  ON public.books FOR UPDATE
  USING (is_book_collaborator(id));

-- CHAPTERS: allow collaborators full access
DROP POLICY IF EXISTS "chapters: owner" ON public.chapters;
CREATE POLICY "chapters: owner or collaborator"
  ON public.chapters FOR ALL
  USING (
    book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid())
    OR is_book_collaborator(book_id)
  );

-- CHARACTERS: allow collaborators via book_id
CREATE POLICY "characters: collaborator"
  ON public.characters FOR ALL
  USING (is_book_collaborator(book_id));

-- DICTIONARY: allow collaborators via book_id
CREATE POLICY "dictionary: collaborator"
  ON public.dictionary_entries FOR ALL
  USING (is_book_collaborator(book_id));

-- WORLD: allow collaborators via book_id
CREATE POLICY "world: collaborator"
  ON public.world_entries FOR ALL
  USING (is_book_collaborator(book_id));

-- NOTES: allow collaborators via book_id
DROP POLICY IF EXISTS "notes: owner" ON public.notes;
CREATE POLICY "notes: owner or collaborator"
  ON public.notes FOR ALL
  USING (
    book_id IN (SELECT id FROM public.books WHERE user_id = auth.uid())
    OR is_book_collaborator(book_id)
  );

-- BOOK_GENRES: allow collaborator read
CREATE POLICY "book_genres: collaborator read"
  ON public.book_genres FOR SELECT
  USING (is_book_collaborator(book_id));

-- BOOK_TAGS: allow collaborator read
CREATE POLICY "book_tags: collaborator read"
  ON public.book_tags FOR SELECT
  USING (is_book_collaborator(book_id));

-- BOOK_STATS: allow collaborator read
CREATE POLICY "book_stats: collaborator read"
  ON public.book_stats FOR SELECT
  USING (is_book_collaborator(book_id));

-- CHARACTER_DETAILS: allow collaborators via character → book
CREATE POLICY "char_details: collaborator"
  ON public.character_details FOR ALL
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE is_book_collaborator(book_id)
    )
  );
