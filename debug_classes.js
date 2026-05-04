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

async function debugClasses() {
  // Try to select ONE row and print its keys
  // If no rows, try to insert with a random column to get the list of valid columns
  const { data, error } = await supabase.from('classes').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in classes:', Object.keys(data[0]));
  } else {
    // Try to insert an invalid column and hope the error message helps
    const { error: err } = await supabase.from('classes').insert({ x: 1 });
    console.log('Error message:', err.message);
  }
}

debugClasses()
