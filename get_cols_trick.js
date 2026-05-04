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

async function getColumnNames() {
  // We can try to select a row and look at keys
  // But if the table is empty, we can try to find where it's used elsewhere
  // Or use a trick: try to insert an invalid column and see the error message which often lists valid columns
  const { error } = await supabase.from('classes').insert({ invalid_column_name: 'test' });
  console.log('Error listing columns (maybe):', error?.message);
}

getColumnNames()
