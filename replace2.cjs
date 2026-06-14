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
    
    // Phase 2: KPI Intelligence Cards to grid-cols-2 md:grid-cols-4 lg:grid-cols-6
    // Typically these are currently written as grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6
    newContent = newContent.replace(/grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6/g, 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px]');
    
    // Some might just have grid-cols-1 md:grid-cols-4 lg:grid-cols-6
    newContent = newContent.replace(/grid-cols-1 md:grid-cols-4 lg:grid-cols-6/g, 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px]');

    // Phase 5: Forms Optimization - touch targets h-12. 
    // Usually input fields, selects in forms use h-10 or py-2. We can try to replace h-10 with h-12 in inputs and selects.
    // However, mass replacing h-10 to h-12 might break other things, so let's be careful.
    // Let's replace `h-10` with `h-12` only where it looks like an input or select or button.
    // Actually, looking at typical Tailwind classes:
    newContent = newContent.replace(/className="([^"]*)h-10([^"]*)"/g, (match, p1, p2) => {
        // If it's likely a form element (e.g. contains w-full, border, rounded, px-3, etc)
        if (p1.includes('w-full') || p2.includes('w-full') || p1.includes('border') || p2.includes('border')) {
            return `className="${p1}h-12${p2}"`;
        }
        return match;
    });

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      changedFiles++;
      console.log('Modified:', filePath);
    }
  }
});

console.log(`Phase 2 & 5 Done. Modified ${changedFiles} files.`);
