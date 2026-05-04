-- ============================================================
-- RESET TOTAL: Hapus SEMUA policy lama di tabel classes
-- ============================================================

-- Jalankan ini dulu untuk melihat semua policy yang ada:
-- SELECT policyname FROM pg_policies WHERE tablename = 'classes';

-- Drop SEMUA policy yang mungkin ada (aman jika tidak ada)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'classes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON classes', pol.policyname);
    END LOOP;
END;
$$;

-- Drop semua policy class_students juga
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'class_students'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON class_students', pol.policyname);
    END LOOP;
END;
$$;

-- ============================================================
-- Buat ulang fungsi helper (SECURITY DEFINER = tidak rekursif)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Aktifkan RLS
-- ============================================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policy untuk tabel CLASSES
-- ============================================================

-- SELECT: guru lihat milik sendiri, admin lihat semua
CREATE POLICY "classes_select_policy"
ON classes FOR SELECT TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
);

-- INSERT: guru bisa buat kelas (teacher_id = diri sendiri)
CREATE POLICY "classes_insert_policy"
ON classes FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND get_my_role() = 'teacher'
);

-- UPDATE: guru update kelas milik sendiri
CREATE POLICY "classes_update_policy"
ON classes FOR UPDATE TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
);

-- DELETE: hanya admin
CREATE POLICY "classes_delete_policy"
ON classes FOR DELETE TO authenticated
USING (get_my_role() IN ('super_admin', 'admin'));

-- ============================================================
-- Policy untuk tabel CLASS_STUDENTS
-- ============================================================

CREATE POLICY "class_students_all_policy"
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
-- Verifikasi: Tampilkan semua policy yang aktif
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('classes', 'class_students')
ORDER BY tablename, policyname;
