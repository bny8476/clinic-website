const fs = require('fs');
const path = require('path');

function hoistImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const importLines = [];
  const nonImportLines = [];

  let inMultilineImport = false;
  let currentImport = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inMultilineImport) {
      currentImport.push(line);
      if (line.includes('}') || line.includes(';')) {
        inMultilineImport = false;
        importLines.push(currentImport.join('\n'));
        currentImport = [];
      }
      continue;
    }

    if (line.trim().startsWith('import ') || line.trim().startsWith('import type ')) {
      // Check if it's multiline import without ending quote/semicolon/brace
      if (line.includes('{') && !line.includes('}')) {
        inMultilineImport = true;
        currentImport.push(line);
      } else {
        importLines.push(line);
      }
    } else {
      nonImportLines.push(line);
    }
  }

  if (importLines.length === 0) return;

  // Deduplicate exact import lines
  const uniqueImports = [...new Set(importLines)];
  
  // Reconstruct file: all imports at top, followed by 1 blank line, followed by non-import lines
  // Trim leading blank lines from nonImportLines
  while (nonImportLines.length > 0 && nonImportLines[0].trim() === '') {
    nonImportLines.shift();
  }

  const newContent = uniqueImports.join('\n') + '\n\n' + nonImportLines.join('\n');
  if (newContent !== content) {
    console.log(`Hoisted imports to top in: ${path.relative(process.cwd(), filePath)}`);
    fs.writeFileSync(filePath, newContent);
  }
}

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) processDir(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) {
      try {
        hoistImportsInFile(fullPath);
      } catch (err) {
        console.error(`Error in ${fullPath}:`, err.message);
      }
    }
  }
}

processDir(path.resolve(__dirname, '../src'));
console.log('Import hoisting completed.');
