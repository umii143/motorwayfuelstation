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

  // Phase 1: Main layout wrappers
  // Replace: grid grid-cols-2 gap-6 lg:grid-cols-3 OR grid grid-cols-2 lg:grid-cols-3 gap-6
  content = content.replace(/grid-cols-2(\s+gap-\d+)?\s+lg:grid-cols-3/g, 'grid-cols-1$1 lg:grid-cols-3');
  content = content.replace(/grid-cols-2(\s+lg:grid-cols-3)(\s+gap-\d+)?/g, 'grid-cols-1$1$2');
  
  content = content.replace(/grid-cols-2(\s+gap-\d+)?\s+md:grid-cols-3/g, 'grid-cols-1$1 lg:grid-cols-3');
  content = content.replace(/grid-cols-2(\s+md:grid-cols-3)(\s+gap-\d+)?/g, 'grid-cols-1 lg:grid-cols-3$2');

  // Replace: grid grid-cols-2 gap-4 sm:grid-cols-2
  content = content.replace(/grid-cols-2(\s+gap-\d+)?\s+sm:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2$1');
  content = content.replace(/grid-cols-2(\s+sm:grid-cols-2)(\s+gap-\d+)?/g, 'grid-cols-1 sm:grid-cols-2$2');

  // Forms / general 2-column grids (Phase 5 prep)
  // E.g. grid-cols-2 md:grid-cols-2 => grid-cols-1 sm:grid-cols-2
  content = content.replace(/grid-cols-2\s+md:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');
  content = content.replace(/grid-cols-2\s+sm:grid-cols-3/g, 'grid-cols-1 sm:grid-cols-3');
  
  // Naked grid-cols-2 that don't have sm/md/lg after them but are clearly meant for responsive forms
  // Let's explicitly target known patterns like "grid grid-cols-2 gap-"
  content = content.replace(/grid-cols-2\s+gap-([23456])/g, 'grid-cols-1 sm:grid-cols-2 gap-$1');
  // Then clean up if we accidentally created "grid-cols-1 sm:grid-cols-2 gap-X lg:grid-cols-3" where sm wasn't needed
  // This is safe because mobile is 1, sm is 2, lg is 3.

  // Phase 2: KPI Layout Optimization
  // Find KPI card grids, typically grid-cols-2 sm:grid-cols-4 or md:grid-cols-4
  content = content.replace(/grid-cols-[12]\s+sm:grid-cols-[34]/g, 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6');
  content = content.replace(/grid-cols-[12]\s+md:grid-cols-4/g, 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6');
  content = content.replace(/grid-cols-2\s+gap-\d+\s+sm:gap-\d+\s+sm:grid-cols-3/g, 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3');

  // Any remaining grid-cols-2 that are responsive fallbacks
  content = content.replace(/grid-cols-2\s+lg:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    console.log('Modified:', filePath);
  }
});

console.log(`\nFinished! Modified ${modifiedFiles} files.`);
