const fs = require('fs');
const path = require('path');

const coreDir = path.join(__dirname, 'src', 'services', 'core');

function processFile(filePath) {
  if (!filePath.endsWith('.ts') || filePath.endsWith('coreStorage.ts') || filePath.endsWith('SyncEngine.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('localStorage.getItem') && !content.includes('localStorage.setItem') && !content.includes('localStorage.length') && !content.includes('localStorage.key')) {
    return;
  }

  // Handle auditEngine.ts special case where it iterates localStorage keys
  if (filePath.endsWith('auditEngine.ts')) {
     console.log('Skipping auditEngine.ts (manual review needed)');
     return;
  }

  // Add imports
  if (!content.includes('safeGetItem')) {
    content = content.replace(/(import .*;\n)+/, match => match + "import { safeGetItem, safeSetItem } from './coreStorage';\n");
  }

  // Replace get
  content = content.replace(/localStorage\.getItem\((.*?)\)/g, 'await safeGetItem($1)');
  
  // Replace set
  content = content.replace(/localStorage\.setItem\((.*?),\s*(.*?)\)/g, 'await safeSetItem($1, $2)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + path.basename(filePath));
}

fs.readdirSync(coreDir).forEach(file => {
  processFile(path.join(coreDir, file));
});
