const fs = require('fs');
const path = require('path');

function fixLazyConflicts(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) fixLazyConflicts(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const lazyMatches = [...content.matchAll(/const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(/g)];
      if (lazyMatches.length > 0) {
        const lazySymbols = new Set(lazyMatches.map(m => m[1]));
        const lines = content.split('\n');
        const newLines = lines.filter(line => {
          if (line.startsWith('import ')) {
            for (const sym of lazySymbols) {
              if (line.includes(`import ${sym} `) || line.includes(`import ${sym},`) || line.includes(`import { ${sym} }`)) {
                console.log(`Removing static import for lazy component '${sym}' in ${path.relative(process.cwd(), fullPath)}`);
                return false;
              }
            }
          }
          return true;
        });
        if (newLines.length !== lines.length) {
          fs.writeFileSync(fullPath, newLines.join('\n'));
        }
      }
    }
  }
}

fixLazyConflicts(path.resolve(__dirname, '../src'));
console.log('Lazy conflicts fixed.');
