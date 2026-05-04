import fs from 'fs';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/v1/lessons/bulk';
const BATCH_SIZE = 50;
const DELAY_MS = 800;

async function uploadBatch(batch, index) {
  let attempt = 0;
  while (attempt <= 2) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log(`✅ Batch ${index} uploaded (${batch.length} items)`);
      return true;
    } catch (err) {
      attempt++;
      if (attempt > 2) {
        console.error(`❌ Batch ${index} failed after retries:`, err.message);
        return false;
      }
      console.warn(`⚠️ Retry batch ${index} (${attempt}/2)...`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node auto-upload.js <path-to-json>');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`📦 Total items: ${data.length}`);

    let uploaded = 0;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const ok = await uploadBatch(batch, batchIndex);
      if (ok) uploaded += batch.length;
      await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log(`🎉 Done: ${uploaded}/${data.length} items uploaded`);
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

main();
