const fs = require('fs');
const path = require('path');

function ensureDefaultExport(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) ensureDefaultExport(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      const compName = path.basename(entry.name, path.extname(entry.name));
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If it doesn't have export default, and has export const/function compName
      if (!content.includes('export default')) {
        const namedExportRegex = new RegExp(`export\\s+(?:const|function|class)\\s+${compName}\\b`);
        if (namedExportRegex.test(content)) {
          console.log(`Adding export default ${compName} to ${path.relative(process.cwd(), fullPath)}`);
          content += `\nexport default ${compName};\n`;
          fs.writeFileSync(fullPath, content);
        }
      }
    }
  }
}

ensureDefaultExport(path.resolve(__dirname, '../src'));
console.log('Default export check finished.');
