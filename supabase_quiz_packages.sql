-- ============================================================
-- LMS EXTENSION: QUIZ PACKAGES
-- ============================================================

-- 1. Table for Quiz Packages created by teachers
CREATE TABLE IF NOT EXISTS quiz_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  level_id uuid REFERENCES levels(id),
  created_at timestamptz DEFAULT now()
);

-- 2. Table for questions within a package
CREATE TABLE IF NOT EXISTS quiz_package_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES quiz_packages(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  order_index int DEFAULT 0,
  UNIQUE(package_id, question_id)
);

-- 3. Update class_quizzes to support packages
ALTER TABLE class_quizzes ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES quiz_packages(id) ON DELETE SET NULL;

-- 4. RLS Policies
ALTER TABLE quiz_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_package_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view packages" ON quiz_packages FOR SELECT USING (true);
CREATE POLICY "Teachers can manage their own packages" ON quiz_packages FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Anyone can view package questions" ON quiz_package_questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage their package questions" ON quiz_package_questions FOR ALL 
USING (EXISTS (SELECT 1 FROM quiz_packages WHERE id = package_id AND teacher_id = auth.uid()));
