-- ============================================================
-- FIX: RLS untuk tabel classes (tanpa infinite recursion)
-- SOLUSI: Gunakan SECURITY DEFINER function agar pengecekan
-- role tidak menyebabkan rekursi tak terbatas
-- ============================================================

-- 1. Buat fungsi helper yang aman (SECURITY DEFINER = bypass RLS saat check)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Hapus semua policy lama di tabel classes
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;
DROP POLICY IF EXISTS "Anyone can view active classes" ON classes;
DROP POLICY IF EXISTS "Super admin full access on classes" ON classes;

-- 3. Aktifkan RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 4. Policy SELECT: guru lihat kelas sendiri, admin lihat semua
CREATE POLICY "classes_select_policy"
ON classes FOR SELECT TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
);

-- 5. Policy INSERT: guru bisa buat kelas dengan teacher_id = diri sendiri
CREATE POLICY "classes_insert_policy"
ON classes FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND get_my_role() = 'teacher'
);

-- 6. Policy UPDATE: guru bisa update kelas milik sendiri
CREATE POLICY "classes_update_policy"
ON classes FOR UPDATE TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
);

-- 7. Policy DELETE: hanya admin
CREATE POLICY "classes_delete_policy"
ON classes FOR DELETE TO authenticated
USING (get_my_role() IN ('super_admin', 'admin'));

-- ============================================================
-- FIX: RLS untuk class_students
-- ============================================================
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage class_students" ON class_students;
DROP POLICY IF EXISTS "class_students_policy" ON class_students;

CREATE POLICY "class_students_policy"
ON class_students FOR ALL TO authenticated
USING (
  get_my_role() IN ('super_admin', 'admin')
  OR EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_id
      AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('classes', 'class_students')
ORDER BY tablename, policyname;
