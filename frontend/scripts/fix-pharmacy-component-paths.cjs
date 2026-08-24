const fs = require('fs');
const path = require('path');

const PHARMACY_UI_MAP = {
  'ErrorBanner': 'components/pharmacy/ui/ErrorBanner',
  'TableSkeleton': 'components/pharmacy/ui/TableSkeleton',
  'FormInput': 'components/pharmacy/ui/FormInput',
  'ModuleFilterBar': 'components/pharmacy/ui/ModuleFilterBar',
  'UserFormModal': 'components/pharmacy/ui/UserFormModal',
  'PharmacyInvoice': 'components/pharmacy/pharmacy/PharmacyInvoice',
  'AppModal': 'components/pharmacy/ui/AppModal',
};

function fixPharmacyImports(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) fixPharmacyImports(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let modified = false;

      const newLines = lines.map(line => {
        if (line.startsWith('import ')) {
          for (const [comp, targetRel] of Object.entries(PHARMACY_UI_MAP)) {
            if (line.includes(`import ${comp} `) && (line.includes('/components/ui/') || line.includes("./PharmacyInvoice"))) {
              // Calculate relative path from this file to targetRel in src/
              const fileDir = path.dirname(fullPath);
              const srcDir = path.resolve(__dirname, '../src');
              const targetAbs = path.resolve(srcDir, targetRel);
              let newRelPath = path.relative(fileDir, targetAbs).replace(/\\/g, '/');
              if (!newRelPath.startsWith('.')) newRelPath = './' + newRelPath;
              console.log(`Fixing ${comp} import path in ${path.relative(process.cwd(), fullPath)}: ${line.trim()} -> ${newRelPath}`);
              modified = true;
              return `import ${comp} from '${newRelPath}';`;
            }
          }
        }
        return line;
      });

      if (modified) {
        fs.writeFileSync(fullPath, newLines.join('\n'));
      }
    }
  }
}

fixPharmacyImports(path.resolve(__dirname, '../src'));
console.log('Pharmacy UI component path fixing finished.');
