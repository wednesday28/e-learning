-- Tabel untuk menampung pendaftaran siswa yang belum memiliki akun
CREATE TABLE IF NOT EXISTS public.pending_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(email, class_id)
);

-- Index untuk mempercepat pencarian email saat pendaftaran
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_email ON public.pending_enrollments(email);
