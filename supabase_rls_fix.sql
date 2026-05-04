-- ============================================================
-- FIX RLS: classes dan class_students (agar Guru bisa buat, Siswa bisa lihat)
-- ============================================================

-- 1. Helper Function
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Drop existing policies to ensure clean state
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

-- 3. Classes Policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_policy"
ON classes FOR SELECT TO authenticated
USING (
  teacher_id = auth.uid()
  OR get_my_role() IN ('super_admin', 'admin')
  OR EXISTS (
    SELECT 1 FROM class_students
    WHERE class_students.class_id = classes.id
      AND class_students.student_id = auth.uid()
  )
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

-- 4. Class Students Policies
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_students_all_policy"
ON class_students FOR ALL TO authenticated
USING (
  get_my_role() IN ('super_admin', 'admin')
  OR student_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_id
      AND classes.teacher_id = auth.uid()
  )
);
