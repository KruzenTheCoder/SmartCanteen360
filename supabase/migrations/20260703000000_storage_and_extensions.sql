-- ============================================================================
-- Supabase platform setup for SmartCanteen 360.
-- Apply with the Supabase CLI:  supabase db push
-- (Application tables are managed separately by Prisma migrations.)
-- ============================================================================

-- Extensions used by the platform ------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;   -- gen_random_uuid, digest
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;     -- case-insensitive text (optional)

-- Storage bucket for meal images, receipts, avatars, exports -----------------
-- Private bucket: the API issues short-lived signed URLs; clients never read
-- objects directly with the anon key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'smartcanteen',
  'smartcanteen',
  false,
  52428800, -- 50 MiB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: only the service role (used by the API) may manage objects.
-- anon / authenticated get no direct access; access is via API-signed URLs.
DROP POLICY IF EXISTS "smartcanteen_service_all" ON storage.objects;
CREATE POLICY "smartcanteen_service_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'smartcanteen')
  WITH CHECK (bucket_id = 'smartcanteen');
