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

async function findJunction() {
  const { data, error } = await supabase.rpc('get_tables'); // This might not exist
  
  // Alternative: search by trying to select from guessed names
  const guesses = [
    'class_subjects', 'subject_classes', 'class_subject', 'subject_class',
    'class_map', 'class_mapping', 'class_content'
  ];
  
  for (const table of guesses) {
    const { error: tableError } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!tableError) {
      console.log(`Found table: ${table}`);
      const { data: cols, error: colError } = await supabase.from(table).select('*').limit(1);
      if (cols && cols.length > 0) {
        console.log(`Columns in ${table}:`, Object.keys(cols[0]));
      } else {
        // Try insert trick to find columns
        const { error: insError } = await supabase.from(table).insert({ x: 1 });
        console.log(`Insert error for ${table}:`, insError.message);
      }
    }
  }
}

findJunction()
