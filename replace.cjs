const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const featuresDir = path.join(__dirname, 'src', 'components', 'features');
let changedFiles = 0;

walkDir(featuresDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // Phase 1: grid-cols-2 lg:grid-cols-3 -> grid-cols-1 lg:grid-cols-3
    newContent = newContent.replace(/grid-cols-2 lg:grid-cols-3/g, 'grid-cols-1 lg:grid-cols-3');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      changedFiles++;
      console.log('Modified:', filePath);
    }
  }
});

console.log(`Phase 1 Done. Modified ${changedFiles} files.`);
