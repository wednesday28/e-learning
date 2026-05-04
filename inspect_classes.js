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

async function debug() {
  const { data: user } = await supabase.from('profiles').select('id').eq('role', 'teacher').limit(1).single();
  
  const { data, error } = await supabase.from('classes').insert({
    name: 'Debug Class',
    teacher_id: user.id
  }).select().single();
  
  if (data) {
    console.log('Class row columns:', Object.keys(data));
    // Clean up
    await supabase.from('classes').delete().eq('id', data.id);
  } else {
    console.log('Error inserting:', error);
  }
}

debug()
