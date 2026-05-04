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

async function getTrigger() {
  const { data, error } = await supabase.rpc('get_my_role'); // dummy
  
  // Can we query pg_proc?
  const res = await supabase.from('pg_proc').select('*').limit(1);
  console.log('pg_proc:', res.error?.message);
}

getTrigger()
