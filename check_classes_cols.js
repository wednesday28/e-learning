import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
)

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkClassesColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'classes' }); // This RPC might not exist
  if (error) {
    // Try to just insert a dummy row with minimal data to see what happens
    const { error: insertError } = await supabase.from('classes').insert({ name: 'Test' });
    console.log('Insert Error:', insertError);
  } else {
    console.log('Columns:', data);
  }
}

checkClassesColumns()
