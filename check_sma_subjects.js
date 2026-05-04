import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSMA() {
  const { data: levels } = await supabase.from('levels').select('*').eq('name', 'SMA');
  if (levels && levels.length > 0) {
    const levelId = levels[0].id;
    const { data: subjects } = await supabase.from('subjects').select('*').eq('level_id', levelId);
    console.log('Subjects for SMA:', subjects);
  } else {
    console.log('SMA Level not found');
  }
}

checkSMA();
