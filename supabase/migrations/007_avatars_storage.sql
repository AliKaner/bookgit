-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- 2. Public access policy (Read-only)
DROP POLICY IF EXISTS "Public Access for Avatars" ON storage.objects;
CREATE POLICY "Public Access for Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Authenticated Upload policy (into pp/ folder)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'pp' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Authenticated Update policy
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'pp' AND
    (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'pp' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Authenticated Delete policy
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'pp' AND
    (storage.foldername(name))[2] = auth.uid()::text
);
