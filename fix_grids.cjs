const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let count = 0;
walkDir('d:/newfuelstation5/fuelpro/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/grid-cols-2 sm:grid-cols-1/g, 'grid-cols-1 sm:grid-cols-2');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      count++;
    }
  }
});
console.log(`Replaced in ${count} files.`);
