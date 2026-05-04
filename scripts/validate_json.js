import fs from 'fs';
import path from 'path';

const batchesDir = './public/batches';
const files = fs.readdirSync(batchesDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(batchesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    JSON.parse(content);
    console.log(`✅ ${file} is valid`);
  } catch (e) {
    console.error(`❌ ${file} is INVALID: ${e.message}`);
    // Find the position
    const match = e.message.match(/at position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      const start = Math.max(0, pos - 50);
      const end = Math.min(content.length, pos + 50);
      console.error(`Context around error: "...${content.substring(start, end)}..."`);
    }
  }
});
