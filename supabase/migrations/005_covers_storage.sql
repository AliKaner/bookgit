-- 1. Create the 'covers' bucket if it doesn't exist
-- Note: 'supabase' schema handles storage management
INSERT INTO storage.buckets (id, name, public)
SELECT 'covers', 'covers', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'covers'
);

-- 2. RLS is enabled by default for storage.objects in Supabase.
-- We only need to define our specific policies.

-- 3. Public access policy (Read-only)
DROP POLICY IF EXISTS "Public Access for Covers" ON storage.objects;
CREATE POLICY "Public Access for Covers"
ON storage.objects FOR SELECT
USING ( bucket_id = 'covers' );

-- 4. Authenticated Upload policy
DROP POLICY IF EXISTS "Users can upload their own covers" ON storage.objects;
CREATE POLICY "Users can upload their own covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Authenticated Update policy
DROP POLICY IF EXISTS "Users can update their own covers" ON storage.objects;
CREATE POLICY "Users can update their own covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Authenticated Delete policy
DROP POLICY IF EXISTS "Users can delete their own covers" ON storage.objects;
CREATE POLICY "Users can delete their own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
