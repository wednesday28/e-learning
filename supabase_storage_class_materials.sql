-- ============================================================
-- SUPABASE STORAGE: class-materials bucket
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- 1. Buat/Update bucket class-materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-materials',
  'class-materials',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream',
    'text/plain',
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET 
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. RLS Policy: Teacher/Admin bisa upload
DROP POLICY IF EXISTS "Teachers can upload class materials" ON storage.objects;
CREATE POLICY "Teachers can upload class materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'class-materials'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin', 'super_admin')
    )
  )
);

-- 3. RLS Policy: Semua user terautentikasi bisa baca/download
DROP POLICY IF EXISTS "Authenticated users can read class materials" ON storage.objects;
CREATE POLICY "Authenticated users can read class materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'class-materials');

-- 4. RLS Policy: Teacher/Admin bisa hapus file miliknya
DROP POLICY IF EXISTS "Teachers can delete their class materials" ON storage.objects;
CREATE POLICY "Teachers can delete their class materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'class-materials'
  AND (owner = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
);

-- 5. Update class_materials table
ALTER TABLE public.class_materials
ADD COLUMN IF NOT EXISTS generated_question_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS description text;

SELECT 'Storage bucket class-materials berhasil diperbarui!' as status;
