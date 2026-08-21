const fs = require('fs');
const files = [
  'frontend/src/App.jsx',
  'frontend/src/hooks/usePatientMedicineFeed.jsx',
  'frontend/src/pages/patient/OrderMedicine.jsx',
  'frontend/src/pages/patient/BookAppointment.jsx',
  'frontend/src/pages/doctor/ManageMedicines.jsx',
  'frontend/src/pages/doctor/ConsultationQueue.jsx',
  'frontend/src/pages/doctor/DoctorDashboard.jsx',
  'frontend/src/utils/pharmacy/api.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'")) {
    content = content.replace(/import\.meta\.env\.VITE_API_BASE_URL \|\| 'http:\/\/localhost:8080\/api'/g, 'BASE_URL');
    
    // Add import statement at the top if it's not App.jsx (since App.jsx has special logic we might need to be careful with)
    if (file === 'frontend/src/App.jsx') {
        content = content.replace(
            /(const baseUrl =\s*\(typeof window !== 'undefined' && window\.__ENV__\?\.VITE_API_BASE_URL\) \|\|\s*)BASE_URL(\s*;)/,
            "$1import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'$2"
        );
        content = content.replace("fetch(`${baseUrl}/health`)", "import { BASE_URL } from './api/axios';\n    fetch(`${BASE_URL}/health`)");
        // Also remove the old baseUrl definition
        content = content.replace(/const baseUrl =[\s\S]*?'http:\/\/localhost:8080\/api';/, '');
    } else if (file === 'frontend/src/utils/pharmacy/api.js') {
        content = "import { BASE_URL } from '../../api/axios';\n" + content;
        content = content.replace(/const BASE_URL =[\s\S]*?'http:\/\/localhost:8080\/api';/, '');
    } else {
        // Calculate relative path for import
        const depth = (file.match(/\//g) || []).length - 2; // frontend/src/ = 2
        let relativePrefix = '';
        if (depth === 0) relativePrefix = './';
        else relativePrefix = '../'.repeat(depth);
        
        content = `import { BASE_URL } from '${relativePrefix}api/axios';\n` + content;
        
        // Remove old const baseUrl = BASE_URL; lines
        content = content.replace(/const baseUrl = BASE_URL;\n/g, '');
        content = content.replace(/baseUrl/g, 'BASE_URL');
    }
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
