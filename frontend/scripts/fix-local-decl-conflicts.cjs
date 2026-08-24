const fs = require('fs');
const path = require('path');

function fixLocalDeclConflicts(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) fixLocalDeclConflicts(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match local const/function/class declarations and export default function Name
      const localDecls = new Set();
      const declRegex = /(?:const|let|var|function|class|export\s+default\s+function|export\s+function)\s+([A-Z][A-Za-z0-9_]*)\b/g;
      let m;
      while ((m = declRegex.exec(content)) !== null) {
        localDecls.add(m[1]);
      }

      if (localDecls.size > 0) {
        const lines = content.split('\n');
        const newLines = lines.filter(line => {
          if (line.startsWith('import ')) {
            for (const sym of localDecls) {
              if (line.includes(`import ${sym} `) || line.includes(`import { ${sym} }`) || line.includes(`import ${sym},`)) {
                // Verify that sym is indeed declared locally below imports
                const declPattern = new RegExp(`(?:const|let|var|function|class)\\s+${sym}\\b`);
                if (declPattern.test(content)) {
                  console.log(`Removing import for locally declared symbol '${sym}' in ${path.relative(process.cwd(), fullPath)}`);
                  return false;
                }
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

fixLocalDeclConflicts(path.resolve(__dirname, '../src'));
console.log('Local declaration conflict cleanup finished.');
