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

async function testInsert() {
  const { data: subject } = await supabase.from('subjects').select('id').limit(1).single();
  const { data, error } = await supabase.from('modules').insert({
    subject_id: subject.id,
    title: 'Null Grade Test'
  }).select();
  
  if (error) {
     console.log('Insert Error (grade_id might be required):', error.message);
  } else {
     console.log('Success! grade_id is optional.');
     await supabase.from('modules').delete().eq('id', data[0].id);
  }
}

testInsert()
