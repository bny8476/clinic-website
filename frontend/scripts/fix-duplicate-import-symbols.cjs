const fs = require('fs');
const path = require('path');

function cleanImportLine(line) {
  const match = line.match(/^(import\s*\{)([^}]+)(\}\s*from\s*['"][^'"]+['"];?)$/);
  if (!match) return line;
  
  const prefix = match[1];
  const body = match[2];
  const suffix = match[3];

  const items = body.split(',').map(s => s.trim()).filter(Boolean);
  const seenSymbols = new Set();
  const cleanedItems = [];

  for (const item of items) {
    // Check if it's "Original as Alias" or plain "Symbol"
    const aliasMatch = item.match(/^(\w+)\s+as\s+(\w+)$/);
    const localName = aliasMatch ? aliasMatch[2] : item;
    
    if (!seenSymbols.has(localName)) {
      seenSymbols.add(localName);
      cleanedItems.push(item);
    }
  }

  return `${prefix} ${cleanedItems.join(', ')} ${suffix}`;
}

function processDirectory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) processDirectory(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const newLines = lines.map(cleanImportLine);
      if (newLines.join('\n') !== content) {
        console.log(`Cleaned duplicate import symbols in: ${path.relative(process.cwd(), fullPath)}`);
        fs.writeFileSync(fullPath, newLines.join('\n'));
      }
    }
  }
}

processDirectory(path.resolve(__dirname, '../src'));
console.log('Import symbol cleaning finished.');
