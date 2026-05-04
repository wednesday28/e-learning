-- ============================================================
-- LMS EXTENSION: TABLES FOR ADVANCED CLASS FEATURES
-- ============================================================

-- 1. PENGUMUMAN (Announcements)
CREATE TABLE IF NOT EXISTS class_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. TUGAS & PENGUMPULAN (Assignments & Submissions)
CREATE TABLE IF NOT EXISTS class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL,
  due_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES class_assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text,
  link_url text,
  feedback text,
  grade integer,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- 3. MATERI EKSKLUSIF (Exclusive Materials)
CREATE TABLE IF NOT EXISTS class_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text,
  content_type text, -- 'pdf', 'video', 'link'
  created_at timestamptz DEFAULT now()
);

-- 4. FORUM DISKUSI (Class Lounge)
CREATE TABLE IF NOT EXISTS class_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. PRESENSI (Attendance)
CREATE TABLE IF NOT EXISTS class_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_at timestamptz DEFAULT now(),
  date date DEFAULT current_date,
  UNIQUE(student_id, date, class_id)
);

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Guru & Siswa di kelas yang sama bisa melihat
CREATE POLICY "Select Announcements" ON class_announcements FOR SELECT USING (is_teacher_of_class(class_id) OR is_student_in_class(class_id));
CREATE POLICY "Teacher Insert Announcements" ON class_announcements FOR INSERT WITH CHECK (is_teacher_of_class(class_id));

CREATE POLICY "Select Assignments" ON class_assignments FOR SELECT USING (is_teacher_of_class(class_id) OR is_student_in_class(class_id));
CREATE POLICY "Teacher Manage Assignments" ON class_assignments FOR ALL USING (is_teacher_of_class(class_id));

CREATE POLICY "Student Submit" ON class_submissions FOR INSERT WITH CHECK (auth.uid() = student_id AND is_student_in_class((SELECT class_id FROM class_assignments WHERE id = assignment_id)));
CREATE POLICY "Select Submissions" ON class_submissions FOR SELECT USING (auth.uid() = student_id OR is_teacher_of_class((SELECT class_id FROM class_assignments WHERE id = assignment_id)));

CREATE POLICY "Select Materials" ON class_materials FOR SELECT USING (is_teacher_of_class(class_id) OR is_student_in_class(class_id));
CREATE POLICY "Teacher Manage Materials" ON class_materials FOR ALL USING (is_teacher_of_class(class_id));

CREATE POLICY "Select Messages" ON class_messages FOR SELECT USING (is_teacher_of_class(class_id) OR is_student_in_class(class_id));
CREATE POLICY "Insert Messages" ON class_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND (is_teacher_of_class(class_id) OR is_student_in_class(class_id)));
