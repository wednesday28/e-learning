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

async function tryInsert() {
  const { error } = await supabase.from('class_subjects').insert({ test: 1 });
  console.log('Error class_subjects:', error?.message);
  
  const { error: err2 } = await supabase.from('class_students').insert({ test: 1 });
  console.log('Error class_students:', err2?.message);
}

tryInsert()
