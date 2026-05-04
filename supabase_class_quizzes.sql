-- ============================================================
-- LMS EXTENSION: CLASS QUIZZES
-- ============================================================

-- Table to link subjects (which act as quizzes) to classes
CREATE TABLE IF NOT EXISTS class_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  due_date timestamptz,
  UNIQUE(class_id, subject_id)
);

-- RLS Policies
ALTER TABLE class_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select Class Quizzes" ON class_quizzes FOR SELECT USING (is_teacher_of_class(class_id) OR is_student_in_class(class_id));
CREATE POLICY "Teacher Manage Class Quizzes" ON class_quizzes FOR ALL USING (is_teacher_of_class(class_id));
