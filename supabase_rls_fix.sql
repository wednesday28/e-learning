-- ============================================================
-- FIX RLS RECURSION: classes <-> class_students
-- ============================================================

-- 1. Bersihkan policy lama yang bermasalah
DROP POLICY IF EXISTS "classes_select_policy" ON "classes";
DROP POLICY IF EXISTS "classes_insert_policy" ON "classes";
DROP POLICY IF EXISTS "classes_update_policy" ON "classes";
DROP POLICY IF EXISTS "classes_delete_policy" ON "classes";
DROP POLICY IF EXISTS "class_students_select_policy" ON "class_students";
DROP POLICY IF EXISTS "class_students_insert_policy" ON "class_students";
DROP POLICY IF EXISTS "class_students_delete_policy" ON "class_students";


-- 2. Buat Helper Functions (SECURITY DEFINER) untuk memutus rekursi RLS
-- Fungsi ini akan mengecek status tanpa memicu RLS kembali

-- Cek apakah user adalah guru dari kelas tertentu
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(c_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = c_id AND teacher_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cek apakah user adalah siswa di kelas tertentu
CREATE OR REPLACE FUNCTION public.is_student_in_class(c_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.class_students 
    WHERE class_id = c_id AND student_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Terapkan Policy baru untuk tabel 'classes'
CREATE POLICY "classes_select_policy" ON "classes"
FOR SELECT TO authenticated
USING (
  teacher_id = auth.uid() OR -- Guru melihat kelas miliknya (Direct Check)
  public.is_student_in_class(id) -- Siswa melihat kelas tempat dia bergabung (via function)
);

CREATE POLICY "classes_insert_policy" ON "classes"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "classes_update_policy" ON "classes"
FOR UPDATE TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "classes_delete_policy" ON "classes"
FOR DELETE TO authenticated
USING (auth.uid() = teacher_id);

-- 4. Terapkan Policy baru untuk tabel 'class_students'
CREATE POLICY "class_students_select_policy" ON "class_students"
FOR SELECT TO authenticated
USING (
  student_id = auth.uid() OR -- Siswa melihat pendaftarannya sendiri
  public.is_teacher_of_class(class_id) -- Guru melihat seluruh siswa di kelasnya (via function)
);

CREATE POLICY "class_students_insert_policy" ON "class_students"
FOR INSERT TO authenticated
WITH CHECK (true); -- Izinkan pendaftaran (validasi dilakukan di level aplikasi/join code)

CREATE POLICY "class_students_delete_policy" ON "class_students"
FOR DELETE TO authenticated
USING (
  student_id = auth.uid() OR -- Siswa keluar sendiri
  public.is_teacher_of_class(class_id) -- Guru mengeluarkan siswa
);

-- 5. Pastikan profiles bisa dibaca oleh semua user yang sudah login (untuk daftar siswa)
DROP POLICY IF EXISTS "profiles_select_policy" ON "profiles";
CREATE POLICY "profiles_select_policy" ON "profiles"
FOR SELECT TO authenticated
USING (true);
