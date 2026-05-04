-- ============================================================
-- FIX: RLS Policies for Teacher Class Creation
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enable RLS on classes table (if not already enabled)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh (safe to run even if they don't exist)
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;
DROP POLICY IF EXISTS "Anyone can view active classes" ON classes;

-- 3. Allow teachers to CREATE classes (INSERT)
-- Condition: teacher_id must match the currently logged-in user's ID
CREATE POLICY "Teachers can insert their own classes"
ON classes
FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'teacher'
  )
);

-- 4. Allow teachers to VIEW their own classes
CREATE POLICY "Teachers can view their own classes"
ON classes
FOR SELECT
TO authenticated
USING (
  teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- 5. Allow teachers to UPDATE their own classes
CREATE POLICY "Teachers can update their own classes"
ON classes
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- 6. Allow super_admin to do everything
DROP POLICY IF EXISTS "Super admin full access on classes" ON classes;
CREATE POLICY "Super admin full access on classes"
ON classes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

-- ============================================================
-- FIX: RLS Policies for class_students table
-- ============================================================

ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage class_students" ON class_students;
CREATE POLICY "Teachers can manage class_students"
ON class_students
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================
-- VERIFY: Check current policies
-- ============================================================
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('classes', 'class_students');
