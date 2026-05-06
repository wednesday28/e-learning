-- Add duration column to quiz_packages table
ALTER TABLE quiz_packages ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;

-- Optional: Add comment
COMMENT ON COLUMN quiz_packages.duration IS 'Duration of the quiz in minutes';
