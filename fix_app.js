const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');
content = "import { BASE_URL } from './api/axios';\n" + content;
content = content.replace(/(const baseUrl =\s*\(typeof window !== 'undefined' && window\.__ENV__\?\.VITE_API_BASE_URL\) \|\|\s*)import\.meta\.env\.VITE_API_BASE_URL \|\|\s*'http:\/\/localhost:8080\/api';/, '');
content = content.replace("fetch(`${baseUrl}/health`)", "fetch(`${BASE_URL}/health`)");
fs.writeFileSync('frontend/src/App.jsx', content);
