-- READ ONLY. Run in the intended Supabase project's SQL editor.
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'registration-ids';
-- Review ALL policies, including broad ones not naming a bucket explicitly.
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
-- Private bucket required; no broad anon/authenticated policies may grant access to IDs.
-- No policy is changed or deleted by this inspection script.
