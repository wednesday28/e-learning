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

const supabase = createClient(config.VITE_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

// Check a sample batch file to understand JSON structure
async function checkBatchFormat() {
  const batchDir = './public/batches';
  if (!fs.existsSync(batchDir)) {
    console.log('No batches dir found');
    return;
  }
  const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No batch files found');
    return;
  }
  const sample = JSON.parse(fs.readFileSync(`${batchDir}/${files[0]}`, 'utf8'));
  const item = Array.isArray(sample) ? sample[0] : sample;
  console.log('Sample item keys:', Object.keys(item));
  console.log('Sample item:', JSON.stringify(item, null, 2).substring(0, 500));
}

checkBatchFormat()
