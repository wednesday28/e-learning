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

async function listAllTables() {
  // PostgREST doesn't have a list tables endpoint easily accessible via client
  // But we can try to guess from common patterns or use the OpenAPI spec trick if it worked
  // Since OpenAPI failed, let's try to query the information_schema via RPC if possible
  const { data, error } = await supabase.rpc('get_tables'); 
  if (error) {
    console.log('RPC get_tables failed. Trying guesses...');
    const guesses = ['class_subjects', 'subject_classes', 'class_details', 'class_config', 'class_subject_list'];
    for (const g of guesses) {
      const { error: e } = await supabase.from(g).select('*').limit(1);
      if (!e || !e.message.includes('schema cache')) {
        console.log(`Potential table found: ${g}`);
      }
    }
  } else {
    console.log('Tables:', data);
  }
}

listAllTables()
