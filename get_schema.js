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
const anonKey = config.VITE_SUPABASE_ANON_KEY

async function getOpenApi() {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  const data = await response.json();
  const classesDef = data.definitions.classes;
  console.log('Classes Definition:', JSON.stringify(classesDef, null, 2));
}

getOpenApi()
