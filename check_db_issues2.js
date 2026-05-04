import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const config = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    config[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(config.VITE_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

async function checkDatabase2() {
  const dummyUUID = '00000000-0000-0000-0000-000000000000';
  const { error: insError } = await supabase.from('class_students').insert({ class_id: dummyUUID });
  console.log('class_students error info:', insError?.message);
}

checkDatabase2()
