-- ============================================================
-- SUPABASE STORAGE: class-materials bucket
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- 1. Buat bucket class-materials (public = true agar URL bisa diakses langsung)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-materials',
  'class-materials',
  true,
  52428800, -- 50MB limit
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
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Teacher/Admin bisa upload
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
CREATE POLICY "Authenticated users can read class materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'class-materials');

-- 4. RLS Policy: Teacher/Admin bisa hapus file miliknya
CREATE POLICY "Teachers can delete their class materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'class-materials'
  AND owner = auth.uid()
);

-- 5. Pastikan kolom generated_quiz_ids ada di class_materials
-- (untuk menyimpan referensi ke soal yang auto-generated)
ALTER TABLE public.class_materials
ADD COLUMN IF NOT EXISTS generated_question_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS file_name text;

SELECT 'Storage bucket class-materials berhasil dibuat!' as status;
