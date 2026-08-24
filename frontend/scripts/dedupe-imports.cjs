const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Track packages with named imports: moduleName -> Set of imported symbols
  const packageNamedImports = {};
  // Track default imports: moduleName -> defaultSymbol
  const packageDefaultImports = {};
  
  const newLines = [];
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match named imports from external or relative packages, e.g. import { a, b } from 'foo'
    const namedMatch = line.match(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/);
    if (namedMatch) {
      const symbols = namedMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const pkg = namedMatch[2];
      if (!packageNamedImports[pkg]) packageNamedImports[pkg] = new Set();
      symbols.forEach(sym => packageNamedImports[pkg].add(sym));
      modified = true;
      continue;
    }
    
    newLines.push(line);
  }
  
  if (!modified) return;

  // Insert consolidated named imports after the last remaining import or at top
  let lastImportIdx = -1;
  for (let i = 0; i < newLines.length; i++) {
    if (/^import /.test(newLines[i])) lastImportIdx = i;
  }
  
  const consolidated = [];
  for (const [pkg, symbolSet] of Object.entries(packageNamedImports)) {
    const sorted = [...symbolSet].sort();
    consolidated.push(`import { ${sorted.join(', ')} } from '${pkg}';`);
  }
  
  if (lastImportIdx >= 0) {
    newLines.splice(lastImportIdx + 1, 0, ...consolidated);
  } else {
    newLines.unshift(...consolidated);
  }

  fs.writeFileSync(filePath, newLines.join('\n'));
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) walk(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      try {
        cleanFile(fullPath);
      } catch (e) {
        console.error(`Error in ${fullPath}:`, e.message);
      }
    }
  }
}

walk(path.resolve(__dirname, '../src'));
console.log('Import deduplication finished.');
