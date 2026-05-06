-- Menambahkan kolom subject_id ke class_materials untuk klasifikasi materi
ALTER TABLE class_materials ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);

-- Update kolom description di class_materials jika belum ada
ALTER TABLE class_materials ADD COLUMN IF NOT EXISTS description TEXT;

-- Perbaikan kolom duration di quiz_packages
ALTER TABLE quiz_packages ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;
