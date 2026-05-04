import fs from 'fs';
import path from 'path';

const directory = './public/batches';

function fixJsonInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the systemic issue: backslash followed by a space
    // This often happens in generated text like "a. Option\ b. Option"
    // We want to replace it with "\n" if it's meant to be a newline, 
    // or just a space if it's an accidental escape.
    // Given the context of the errors, it's usually meant to be a newline before the next option.
    
    // Pattern: \ followed by space, then often a letter like a, b, c, d and a dot.
    // e.g. \ a. or \ b.
    const fixedContent = content.replace(/\\\s([a-d]\.)/g, '\\n$1');
    
    // Also catch any other trailing backslashes followed by spaces that are invalid JSON
    const furtherFixed = fixedContent.replace(/\\\s/g, ' ');

    if (content !== furtherFixed) {
      fs.writeFileSync(filePath, furtherFixed, 'utf8');
      console.log(`Fixed: ${filePath}`);
    } else {
      console.log(`No changes needed: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

// Read directory
const files = fs.readdirSync(directory);
files.forEach(file => {
  if (file.endsWith('.json')) {
    fixJsonInFile(path.join(directory, file));
  }
});

// Also check root batches/
const rootBatches = './batches';
if (fs.existsSync(rootBatches)) {
  const rootFiles = fs.readdirSync(rootBatches);
  rootFiles.forEach(file => {
    if (file.endsWith('.json')) {
      fixJsonInFile(path.join(rootBatches, file));
    }
  });
}
