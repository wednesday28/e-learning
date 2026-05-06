-- Tambahkan kolom is_cat_mode untuk menandakan apakah kuis menggunakan Simulasi CAT
ALTER TABLE public.class_quizzes 
ADD COLUMN IF NOT EXISTS is_cat_mode BOOLEAN DEFAULT FALSE;
