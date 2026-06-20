const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      const original = content;

      content = content.replace(/Math\.random\(\)\.toString\(36\)\.subst?r(?:ing)?\(\d+,\s*\d+\)/g, "crypto.randomUUID().split('-')[0]");
      content = content.replace(/Math\.floor\(Math\.random\(\)\s*\*\s*\d+\)/g, "crypto.randomUUID().split('-')[0]");
      content = content.replace(/Math\.floor\(1000 \+ Math\.random\(\) \* 9000\)/g, "Date.now().toString().slice(-4)");
      content = content.replace(/Math\.random\(\)\.toString\(36\)\.slice\(\d+,\s*\d+\)/g, "crypto.randomUUID().split('-')[0]");
      content = content.replace(/Math\.random\(\)\.toString\(36\)\.substring\(\d+,\s*\d+\)\.toUpperCase\(\)/g, "crypto.randomUUID().split('-')[0].toUpperCase()");

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir('src');
console.log('Replaced Math.random with crypto.randomUUID()');
