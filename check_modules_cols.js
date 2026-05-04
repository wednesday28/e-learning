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

async function checkModules() {
  const { data, error } = await supabase.from('modules').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Modules columns:', Object.keys(data[0]));
  } else {
    // Insert trick
    const { error: err } = await supabase.from('modules').insert({ title: 'Test' });
    console.log('Error message for modules:', err.message);
  }
}

checkModules()
