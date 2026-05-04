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

async function checkSchema() {
  const { data: tables, error } = await supabase
    .from('profiles') // Just to check connection
    .select('*', { count: 'exact', head: true })

  console.log('Tables check:', tables)
}

// I'll try to list tables using a query that is likely to work in Supabase
async function listTables() {
  const { data, error } = await supabase.rpc('get_tables'); // Custom RPC if it exists
  if (error) {
     // Fallback: try to select from common tables
     const commonTables = ['profiles', 'classes', 'class_students', 'subjects', 'levels'];
     for (const table of commonTables) {
       const { error: tableError } = await supabase.from(table).select('*', { count: 'exact', head: true });
       console.log(`Table ${table}:`, tableError ? 'Error/Not Found' : 'Found');
     }
  } else {
    console.log('Tables:', data);
  }
}

listTables()
