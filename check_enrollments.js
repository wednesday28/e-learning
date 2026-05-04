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

async function checkEnrollments() {
  const { data, error } = await supabase.from('class_enrollments').select('*', { count: 'exact', head: true });
  console.log('Table class_enrollments:', error ? 'Error/Not Found' : 'Found');
}

checkEnrollments()
