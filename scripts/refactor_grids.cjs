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

  // 1. MAIN LAYOUT WRAPPERS (Phase 1)
  // grid-cols-2 lg:grid-cols-3 -> grid-cols-1 lg:grid-cols-3
  content = content.replace(/grid-cols-2(\s+gap-\d+)?\s+lg:grid-cols-3/g, 'grid-cols-1$1 lg:grid-cols-3');
  content = content.replace(/grid-cols-2(\s+lg:grid-cols-3)(\s+gap-\d+)?/g, 'grid-cols-1$1$2');
  
  // grid-cols-2 md:grid-cols-3 -> grid-cols-1 lg:grid-cols-3 (User explicitly asked for this mapping in PRD Phase 1)
  content = content.replace(/grid-cols-2(\s+gap-\d+)?\s+md:grid-cols-3/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3$1');
  content = content.replace(/grid-cols-2(\s+md:grid-cols-3)(\s+gap-\d+)?/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3$2');

  // INNER GRIDS AND FORMS (Phase 5 Prep & Phase 1)
  // grid-cols-2 gap-4 sm:grid-cols-2 -> grid-cols-1 sm:grid-cols-2 gap-4
  content = content.replace(/grid-cols-2(\s+gap-\d+)?\s+sm:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2$1');
  content = content.replace(/grid-cols-2(\s+sm:grid-cols-2)(\s+gap-\d+)?/g, 'grid-cols-1 sm:grid-cols-2$2');

  // Forms / general 2-column grids (Phase 5 prep)
  content = content.replace(/grid-cols-2\s+md:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');
  content = content.replace(/grid-cols-2\s+sm:grid-cols-3/g, 'grid-cols-1 sm:grid-cols-3');
  
  // Naked grid-cols-2 in forms/lists
  // E.g. className="grid grid-cols-2 gap-4" -> "grid grid-cols-1 sm:grid-cols-2 gap-4"
  content = content.replace(/grid-cols-2\s+gap-([234568])/g, 'grid-cols-1 sm:grid-cols-2 gap-$1');
  // Clean up if we created duplicates like "grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-2"
  content = content.replace(/grid-cols-1\s+sm:grid-cols-2\s+gap-\d+\s+sm:grid-cols-2/g, (match) => {
    return match.replace(/\s+sm:grid-cols-2$/, '');
  });

  // KPI LAYOUTS (Phase 2)
  // KPI grids usually look like: grid-cols-2 md:grid-cols-4 or sm:grid-cols-4
  // We want: grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3
  content = content.replace(/grid-cols-2(\s+md:grid-cols-4)?(\s+lg:grid-cols-6)?\s+gap-([234568])/g, 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3');

  // Fix flex-row to flex-col lg:flex-row (Phase 1)
  // We only want to target major layout flex-row, but `flex flex-row` is often used for side-by-side elements.
  // The PRD says replace flex-row with flex-col lg:flex-row "Where appropriate."
  // Instead of a blind replace which might ruin small buttons/headers, we will leave flex-row for now
  // or only replace it in known layout wrappers manually later if it's missed.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    console.log('Modified:', filePath);
  }
});

console.log(`\nFinished! Modified ${modifiedFiles} files.`);
