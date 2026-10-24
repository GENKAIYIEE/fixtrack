-- MANUAL setup for a LOCAL Supabase instance first. Not a Prisma migration.
-- Do not run on production as part of local testing.
-- Never make this bucket public or add anonymous/authenticated read/write policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('registration-ids', 'registration-ids', false, 3145728,
        ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- If the bucket already exists, inspect its privacy and policies separately.
-- Ensure no existing broad storage.objects policy grants public/client access to this bucket.
-- Server service_role performs upload/remove and authorized admin signed-URL generation.
