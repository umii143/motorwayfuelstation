import fs from 'fs';
import path from 'path';

const componentsDir = 'd:/newfuelstation5/fuelpro/src/components';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;

walkDir(componentsDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // 1. Fixed widths in className: w-[800px] -> w-full max-w-[800px]
    // Handles className="w-[800px]"
    content = content.replace(/className="([^"]*?)\bw-\[([0-9]+px)\]([^"]*?)"/g, (match, before, width, after) => {
        if (before.includes('max-w-') || after.includes('max-w-')) return match;
        return `className="${before}w-full max-w-[${width}]${after}"`;
    });

    // Handles className={`... w-[800px] ...`}
    content = content.replace(/className=\{\`([^\`]*?)\bw-\[([0-9]+px)\]([^\`]*?)\`\}/g, (match, before, width, after) => {
        if (before.includes('max-w-') || after.includes('max-w-')) return match;
        return `className={\`${before}w-full max-w-[${width}]${after}\`}`;
    });

    // 2. Grids: grid-cols-2 -> grid-cols-1 sm:grid-cols-2 (only if not already responsive)
    content = content.replace(/className="([^"]*?)\bgrid-cols-([2-6])\b([^"]*?)"/g, (match, before, num, after) => {
        if (before.match(/[a-z]+:grid-cols-/)) return match; // Already has responsive grid
        if (before.includes('grid-cols-1')) return match;
        return `className="${before}grid-cols-1 sm:grid-cols-${num}${after}"`;
    });

    content = content.replace(/className=\{\`([^\`]*?)\bgrid-cols-([2-6])\b([^\`]*?)\`\}/g, (match, before, num, after) => {
        if (before.match(/[a-z]+:grid-cols-/)) return match;
        if (before.includes('grid-cols-1')) return match;
        return `className={\`${before}grid-cols-1 sm:grid-cols-${num}${after}\`}`;
    });

    // 3. w-1/2 -> w-full sm:w-1/2
    content = content.replace(/className="([^"]*?)\bw-1\/2\b([^"]*?)"/g, (match, before, after) => {
        if (before.includes('sm:w-') || before.includes('md:w-')) return match; 
        return `className="${before}w-full sm:w-1/2${after}"`;
    });

    // 4. h-[95vh] -> h-[100dvh] md:h-[95vh]
    content = content.replace(/className="([^"]*?)\bh-\[95vh\]\b([^"]*?)"/g, (match, before, after) => {
        if (before.includes('md:h-')) return match; 
        return `className="${before}h-[100dvh] md:h-[95vh]${after}"`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        modifiedFiles++;
        console.log(`Updated: ${filePath}`);
    }
});

console.log(`\nOptimization Complete! Modified ${modifiedFiles} files.`);
