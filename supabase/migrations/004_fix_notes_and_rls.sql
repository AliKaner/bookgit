-- ============================================================
-- 004_fix_notes_and_rls.sql
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add user_id to notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Backfill user_id for existing notes (from the book owner)
UPDATE public.notes n
SET user_id = b.user_id
FROM public.books b
WHERE n.book_id = b.id AND n.user_id IS NULL;

-- 3. Update RLS policies for notes
DROP POLICY IF EXISTS "notes: owner" ON public.notes;
CREATE POLICY "notes: own" ON public.notes FOR ALL USING (user_id = auth.uid());

-- 4. Ensure character_details also has a direct user_id check if possible, 
-- but the via-character policy is usually fine. 
-- Let's double check world and dictionary just in case.

DROP POLICY IF EXISTS "world_own" ON public.world_entries;
CREATE POLICY "world_own" ON public.world_entries FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dict_own" ON public.dictionary_entries;
CREATE POLICY "dict_own" ON public.dictionary_entries FOR ALL USING (user_id = auth.uid());
