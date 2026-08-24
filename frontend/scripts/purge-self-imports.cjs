const fs = require('fs');
const path = require('path');

function removeSelfImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) {
        removeSelfImports(fullPath);
      }
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      const componentName = path.basename(entry.name, path.extname(entry.name));
      let content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const filtered = lines.filter(line => {
        if (line.startsWith('import ') && line.includes(componentName)) {
          // Check if it imports default componentName or { componentName } from relative path
          if (line.includes(`import ${componentName} `) || line.includes(`import { ${componentName} }`) || line.includes(`import ${componentName},`)) {
            console.log(`Removing self-import in ${path.relative(process.cwd(), fullPath)}: ${line}`);
            return false;
          }
        }
        return true;
      });
      if (filtered.length !== lines.length) {
        fs.writeFileSync(fullPath, filtered.join('\n'));
      }
    }
  }
}

removeSelfImports(path.resolve(__dirname, '../src'));
console.log('Self-import purge completed.');
