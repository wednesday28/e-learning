import fs from 'fs';
import path from 'path';

const batchesDir = './public/batches';

const targets = [
  { file: 'sma_10_bahasa_inggris.json', level: 'SMA', grade: 10, subject: 'Bahasa Inggris' },
  { file: 'sma_12_bahasa_inggris.json', level: 'SMA', grade: 12, subject: 'Bahasa Inggris' },
  { file: 'smp_7_bahasa_inggris.json', level: 'SMP', grade: 7, subject: 'Bahasa Inggris' },
  { file: 'smp_8_bahasa_inggris.json', level: 'SMP', grade: 8, subject: 'Bahasa Inggris' },
  { file: 'smp_9_bahasa_inggris.json', level: 'SMP', grade: 9, subject: 'Bahasa Inggris' }
];

targets.forEach(target => {
  const filePath = path.join(batchesDir, target.file);
  if (fs.existsSync(filePath)) {
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // If it's an array and missing metadata at item level
    if (Array.isArray(data)) {
      data = data.map(item => {
        if (!item.level || !item.subject) {
          return {
            level: target.level,
            grade: target.grade,
            subject: target.subject,
            ...item
          };
        }
        return item;
      });
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Updated metadata in ${target.file}`);
    } else if (typeof data === 'object') {
       // If it's an object, just ensure it has the fields
       data.level = data.level || target.level;
       data.grade = data.grade || target.grade;
       data.subject = data.subject || target.subject;
       fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
       console.log(`Checked/Updated metadata in ${target.file} (object)`);
    }
  }
});
