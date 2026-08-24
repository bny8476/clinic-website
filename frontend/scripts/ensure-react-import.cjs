const fs = require('fs');
const path = require('path');

function ensureReactImport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!/\bReact\b/.test(content)) return; // No React usage in text

  const lines = content.split('\n');
  const firstImportIdx = lines.findIndex(l => l.trim().startsWith('import '));

  // Check if React is already imported
  const hasReactImport = lines.some(l => l.trim().startsWith('import ') && (l.includes('React') || l.includes("'react'") || l.includes('"react"')));

  if (!hasReactImport) {
    console.log(`Adding import React to: ${path.relative(process.cwd(), filePath)}`);
    if (firstImportIdx !== -1) {
      lines.splice(firstImportIdx, 0, "import React from 'react';");
    } else {
      lines.unshift("import React from 'react';");
    }
    fs.writeFileSync(filePath, lines.join('\n'));
  } else {
    // If it imports from 'react' without 'React' default import (e.g. import { useState } from 'react';)
    const reactNamedImportIdx = lines.findIndex(l => l.trim().startsWith('import ') && l.includes("'react'") && !l.includes('React'));
    if (reactNamedImportIdx !== -1) {
      const line = lines[reactNamedImportIdx];
      console.log(`Updating react import in: ${path.relative(process.cwd(), filePath)}: ${line.trim()}`);
      lines[reactNamedImportIdx] = line.replace('import {', 'import React, {').replace('import', 'import React,');
      fs.writeFileSync(filePath, lines.join('\n'));
    }
  }
}

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) processDir(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) {
      try {
        ensureReactImport(fullPath);
      } catch (err) {
        console.error(`Error in ${fullPath}:`, err.message);
      }
    }
  }
}

processDir(path.resolve(__dirname, '../src'));
console.log('React import check completed.');
