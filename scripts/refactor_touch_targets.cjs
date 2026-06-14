const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src/components/features');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir(directoryPath, function(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We want to target <input className="...">, <select className="...">
  // and <button className="..."> where they look like main form controls.
  
  // Update standard form inputs and selects to have min-h-[48px] (Phase 5 touch targets)
  // Look for className="... rounded-lg border px-3 py-2 ..." which is standard in this app
  content = content.replace(/(<(?:input|select)\b[^>]*className="[^"]*)(\bpx-3 py-2\b)/g, '$1px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px]');
  content = content.replace(/(<(?:input|select)\b[^>]*className="[^"]*)(\bpx-4 py-2\b)/g, '$1px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px]');
  
  // Add min-h to standard buttons that have padding (excluding icon-only tiny buttons)
  content = content.replace(/(<button\b[^>]*className="[^"]*)(\bpx-4 py-2\b)/g, '$1px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px]');
  content = content.replace(/(<button\b[^>]*className="[^"]*)(\bpx-3 py-2\b)/g, '$1px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px]');
  content = content.replace(/(<button\b[^>]*className="[^"]*)(\bpx-6 py-2\b)/g, '$1px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px]');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    console.log('Modified touch targets:', filePath);
  }
});

console.log(`\nFinished touch targets! Modified ${modifiedFiles} files.`);
