-- ============================================================
-- FIX RLS: classes dan class_students (Tanpa Infinite Recursion)
-- Solusi: Gunakan SECURITY DEFINER function untuk mengecek relasi
-- agar RLS tidak memicu pengecekan melingkar (mutual recursion).
-- ============================================================

-- 1. Helper Function: Ambil peran saat ini
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Helper Function: Apakah saya guru dari kelas ini? (Bypass RLS)
CREATE OR REPLACE FUNCTION is_teacher_of_class(c_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes WHERE id = c_id AND teacher_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 3. Helper Function: Apakah saya terdaftar sebagai siswa di kelas ini? (Bypass RLS)
CREATE OR REPLACE FUNCTION is_student_of_class(c_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_students WHERE class_id = c_id AND student_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 4. Hapus policy lama agar bersih
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

-- 5. Policies untuk tabel CLASSES
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_policy"
ON classes FOR SELECT TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
  OR is_student_of_class(id) -- Menggunakan fungsi bypass RLS
);

CREATE POLICY "classes_insert_policy"
ON classes FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND get_my_role() = 'teacher'
);

CREATE POLICY "classes_update_policy"
ON classes FOR UPDATE TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
);

CREATE POLICY "classes_delete_policy"
ON classes FOR DELETE TO authenticated
USING (get_my_role() IN ('super_admin', 'admin'));


-- 6. Policies untuk tabel CLASS_STUDENTS
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_students_select_policy"
ON class_students FOR SELECT TO authenticated
USING (
  get_my_role() IN ('super_admin', 'admin')
  OR student_id = auth.uid()
  OR is_teacher_of_class(class_id) -- Menggunakan fungsi bypass RLS
);

CREATE POLICY "class_students_insert_policy"
ON class_students FOR INSERT TO authenticated
WITH CHECK (
  get_my_role() IN ('super_admin', 'admin')
  OR is_teacher_of_class(class_id)
);

CREATE POLICY "class_students_update_policy"
ON class_students FOR UPDATE TO authenticated
USING (
  get_my_role() IN ('super_admin', 'admin')
  OR is_teacher_of_class(class_id)
);

CREATE POLICY "class_students_delete_policy"
ON class_students FOR DELETE TO authenticated
USING (
  get_my_role() IN ('super_admin', 'admin')
  OR is_teacher_of_class(class_id)
);
