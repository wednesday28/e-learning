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

async function findSubjectRef() {
  const tables = ['class_subjects', 'class_subject_junction', 'subject_enrollments'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (!error) console.log(`Found table: ${table}`);
  }
}

findSubjectRef()
