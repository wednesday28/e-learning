import fs from 'fs';
import path from 'path';

const batchesDir = './public/batches';
const files = fs.readdirSync(batchesDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(batchesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix common malformed escapes from LLM output
  // 1. Fix backslash followed by space: \  -> \n
  content = content.replace(/\\\s/g, '\\n');

  // 2. Fix backslash followed by choice letters if they look like newlines were intended
  // e.g. ...\a. -> ...\na.
  content = content.replace(/\\\a\./g, '\\na.');
  content = content.replace(/\\\b\./g, '\\nb.');
  content = content.replace(/\\\c\./g, '\\nc.');
  content = content.replace(/\\\d\./g, '\\nd.');

  // 3. General fix for any \x that is not a valid JSON escape
  // Valid: \" \\ \/ \b \f \n \r \t \u
  // We'll replace \x with \\nx or just x depending on context. 
  // In our case, it's almost always a missing newline.
  content = content.replace(/\\([^"\\\/bfnrtu])/g, '\\n$1');

  // 4. Clean up any double newlines we might have created: \n\n -> \n
  // Actually, \n\n is fine in JSON, but let's keep it clean.
  // content = content.replace(/\\n\\n/g, '\\n');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed escapes in ${file}`);
});
