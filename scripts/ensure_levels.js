import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLevels() {
  const { data, error } = await supabase.from('levels').select('*');
  if (error) {
    console.error('Error fetching levels:', error);
    return;
  }
  console.log('Existing Levels:', data);
  
  // Ensure EXAM_PREPARATION exists
  const requiredLevels = ['SD', 'SMP', 'SMA', 'SMK', 'EXAM_PREPARATION', 'POLICE_ACADEMIC', 'POLICE_PSYCHOLOGY'];
  for (const level of requiredLevels) {
    const exists = data.some(l => l.name === level);
    if (!exists) {
      console.log(`Level ${level} missing. Creating...`);
      const { error: insErr } = await supabase.from('levels').insert({ name: level });
      if (insErr) console.error(`Failed to create level ${level}:`, insErr.message);
      else console.log(`Created level: ${level}`);
    }
  }
}

checkLevels();
