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

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_my_role'); // dummy to wake up connection
  
  // Try to query pg_policies using REST using a function if possible, but we don't have one.
  // Instead, let's just create an SQL function to dump all policies to a table or return them.
  const { data: funcData, error: funcErr } = await supabase.rpc('execute_sql', { sql: 'SELECT * FROM pg_policies' });
  console.log(funcErr?.message);
}

checkPolicies()
