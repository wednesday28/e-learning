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

async function checkDatabase() {
  // 1. Check class_students schema
  const { data: csData, error: csError } = await supabase.from('class_students').select('*').limit(1);
  if (csData) {
    console.log('class_students columns:', csData.length > 0 ? Object.keys(csData[0]) : 'Empty table, attempting insert to get error for columns');
    if (csData.length === 0) {
       const { error: insError } = await supabase.from('class_students').insert({ class_id: '123' });
       console.log('class_students error info:', insError?.message);
    }
  } else {
    console.log('class_students error:', csError?.message);
  }

  // 2. Check if a profile trigger exists by querying pg_trigger (requires service role)
  const { data: triggers, error: trigError } = await supabase.rpc('get_my_role'); // Just a dummy check, we can't easily query pg_trigger via REST.
  
  // Actually, let's look at the default role of a new user
  const { data: profData } = await supabase.from('profiles').select('id, role, created_at').order('created_at', { ascending: false }).limit(2);
  console.log('Recent profiles:', profData);
}

checkDatabase()
