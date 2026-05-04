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

async function searchSubjectId() {
  const tables = ['classes', 'class_students', 'class_enrollments', 'class_metadata', 'class_details'];
  for (const table of tables) {
     const { error } = await supabase.from(table).insert({ subject_id: 'test' });
     if (error?.message?.includes('schema cache')) {
        console.log(`Table ${table}: NO subject_id`);
     } else {
        console.log(`Table ${table}: HAS subject_id or other error: ${error?.message}`);
     }
  }
}

searchSubjectId()
