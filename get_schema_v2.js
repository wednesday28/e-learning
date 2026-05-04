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
  const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
  const data = await response.json();
  console.log('Tables in definitions:', Object.keys(data.definitions || {}));
  if (data.definitions && data.definitions.classes) {
     console.log('Classes columns:', Object.keys(data.definitions.classes.properties));
  }
}

getOpenApi()
