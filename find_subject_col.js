import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const lines = envContent.split('\n');
const config = {};
lines.forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    config[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = config.VITE_SUPABASE_URL
const supabaseServiceKey = config.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findSubjectIdColumn() {
  const tables = [
    'classes', 'class_students', 'class_enrollments', 'quizzes', 'lessons', 'modules', 'subjects'
  ];
  for (const t of tables) {
    const { error } = await supabase.from(t).insert({ subject_id: 'test' });
    if (error && error.message.includes('column "subject_id" of relation')) {
      console.log(`Table ${t} HAS subject_id column (not null error or type error)`);
    } else if (error && error.message.includes('Could not find the \'subject_id\' column')) {
      // console.log(`Table ${t} does NOT have subject_id`);
    } else {
      console.log(`Table ${t} result: ${error ? error.message : 'SUCCESS (weird)'}`);
    }
  }
}

findSubjectIdColumn()
