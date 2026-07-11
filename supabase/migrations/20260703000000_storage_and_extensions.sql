-- ============================================================================
-- Supabase platform setup for SmartCanteen 360.
-- Apply with the Supabase CLI:  supabase db push
-- (Application tables are managed separately by Prisma migrations.)
-- ============================================================================

-- Extensions used by the platform ------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;   -- gen_random_uuid, digest
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;     -- case-insensitive text (optional)

-- Storage bucket for meal images, avatars, logos ----------------------------
-- Public bucket: images are served via public URLs (no auth needed to view).
-- Uploads go through the app's server layer with the service role.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'netbite360',
  'netbite360',
  true,
  10485760, -- 10 MiB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read; writes only via the service role (used by the upload API).
DROP POLICY IF EXISTS "netbite360_public_read" ON storage.objects;
CREATE POLICY "netbite360_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'netbite360');

DROP POLICY IF EXISTS "netbite360_service_write" ON storage.objects;
CREATE POLICY "netbite360_service_write"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'netbite360')
  WITH CHECK (bucket_id = 'netbite360');
