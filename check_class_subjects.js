import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.split('=').map(p => p.trim()))) // Fix split
)

// Re-doing the env parsing carefully
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

async function checkClassSubjects() {
  const { data, error } = await supabase.from('class_subjects').select('*', { count: 'exact', head: true });
  console.log('Table class_subjects:', error ? 'Error/Not Found' : 'Found');
}

checkClassSubjects()
