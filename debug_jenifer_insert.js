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

async function debugJenifer() {
  const jeniferId = '1df5be1e-1cac-488b-9f4b-ff89d74053e1';
  const { data: level } = await supabase.from('levels').select('id').limit(1).single();
  const { data: grade } = await supabase.from('grades').select('id').limit(1).single();

  console.log('Trying to insert as Jenifer with Service Role...');
  const { data, error } = await supabase.from('classes').insert({
    name: 'Jenifer Debug Class',
    teacher_id: jeniferId,
    level_id: level.id,
    grade_id: grade.id,
    join_code: 'JENIFER',
    is_active: true
  }).select();

  if (error) {
    console.log('Error even with Service Role:', error.message);
  } else {
    console.log('Success with Service Role! So constraints are fine. It is definitely RLS.');
    await supabase.from('classes').delete().eq('id', data[0].id);
  }
}

debugJenifer()
