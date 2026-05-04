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

async function findTableVerbose() {
  const commonNames = [
    'class_subjects', 'class_students', 'class_enrollments'
  ];
  for (const name of commonNames) {
    const { error } = await supabase.from(name).select('*', { count: 'exact', head: true });
    console.log(`Table ${name} error:`, error?.message || 'NONE');
  }
}

findTableVerbose()
