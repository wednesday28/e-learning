-- ============================================================
-- SOLUSI FINAL: Menghilangkan RLS Recursion Sepenuhnya
-- Pendekatan: 
-- 1. Tabel classes dan class_students dapat dibaca (SELECT) 
--    oleh semua user yang sudah login (authenticated).
--    Ini sangat aman dan umum untuk e-learning agar siswa
--    bisa melihat daftar kelas dan teman sekelas.
-- 2. INSERT/UPDATE/DELETE tetap dibatasi secara ketat.
-- ============================================================

-- 1. Helper Function
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Bersihkan semua policy lama
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'classes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON classes', pol.policyname);
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'class_students'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON class_students', pol.policyname);
    END LOOP;
END;
$$;

-- ==========================================
-- POLICIES UNTUK CLASSES
-- ==========================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- SEMUA user login bisa melihat daftar kelas
CREATE POLICY "classes_select_policy"
ON classes FOR SELECT TO authenticated
USING (true);

-- Hanya guru yang bisa membuat kelas untuk dirinya sendiri
CREATE POLICY "classes_insert_policy"
ON classes FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND get_my_role() = 'teacher'
);

-- Guru hanya bisa mengubah kelasnya sendiri, admin bisa semua
CREATE POLICY "classes_update_policy"
ON classes FOR UPDATE TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
);

-- Hanya admin yang bisa menghapus
CREATE POLICY "classes_delete_policy"
ON classes FOR DELETE TO authenticated
USING (get_my_role() IN ('super_admin', 'admin'));


-- ==========================================
-- POLICIES UNTUK CLASS_STUDENTS
-- ==========================================
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- SEMUA user login bisa melihat siapa saja yang terdaftar di kelas
CREATE POLICY "class_students_select_policy"
ON class_students FOR SELECT TO authenticated
USING (true);

-- Siswa bisa mendaftar sendiri, ATAU guru bisa mendaftarkan (via database function/admin)
CREATE POLICY "class_students_insert_policy"
ON class_students FOR INSERT TO authenticated
WITH CHECK (
  student_id = auth.uid()
  OR get_my_role() IN ('teacher', 'super_admin', 'admin')
);

-- Update/Delete dibatasi untuk diri sendiri atau guru/admin
CREATE POLICY "class_students_update_policy"
ON class_students FOR UPDATE TO authenticated
USING (
  student_id = auth.uid()
  OR get_my_role() IN ('teacher', 'super_admin', 'admin')
);

CREATE POLICY "class_students_delete_policy"
ON class_students FOR DELETE TO authenticated
USING (
  student_id = auth.uid()
  OR get_my_role() IN ('teacher', 'super_admin', 'admin')
);
