import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./public/batches/police_psychology_tryout.json', 'utf8'));
const paketB = data[1];
console.log('Paket B name:', paketB.package_name);
console.log('Questions count:', paketB.questions.length);
console.log('First question keys:', Object.keys(paketB.questions[0]));
console.log('First question situation:', paketB.questions[0].situation);
