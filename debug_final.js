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

async function debugFinal() {
  const { data: level } = await supabase.from('levels').select('id').limit(1).single();
  const { data: teacher } = await supabase.from('profiles').select('id').eq('role', 'teacher').limit(1).single();

  const { data, error } = await supabase.from('classes').insert({
    name: 'Debug Final',
    teacher_id: teacher.id,
    level_id: level.id
  }).select().single();

  if (data) {
    console.log('Columns in classes:', Object.keys(data));
    await supabase.from('classes').delete().eq('id', data.id);
  } else {
    console.log('Error:', error);
  }
}

debugFinal()
