const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');

let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Remove import
  content = content.replace(/^import PageTransition.*$/gm, '');
  
  // Remove tags
  content = content.replace(/<PageTransition>/g, '');
  content = content.replace(/<\/PageTransition>/g, '');

  // Remove mangled import in LabDashboard (already fixed, but just in case for others)
  content = content.replace(/import PageTransition from '[^']+';\n/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
    console.log('Fixed', file);
  }
});

console.log(`Fixed ${count} files.`);
