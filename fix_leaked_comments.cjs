const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
    );

    let replacements = [];

    function visit(node) {
        if (ts.isJsxText(node)) {
            const text = node.getText(sourceFile);
            if (text.includes('// eslint-disable-next-line')) {
                // Find the exact positions
                // We want to replace "// eslint-disable-next-line ..." with "{/* eslint-disable-next-line ... */}"
                // But JsxText includes surrounding whitespace.
                const regex = /\/\/\s*eslint-disable-next-line[^\n]*/g;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    replacements.push({
                        start: node.getStart(sourceFile) + match.index,
                        end: node.getStart(sourceFile) + match.index + match[0].length,
                        original: match[0],
                        newText: `{/* ${match[0].replace('// ', '').trim()} */}`
                    });
                }
            }
        }
        
        // Also check if there are JSX expressions that are just a comment inside them, though those wouldn't bleed to UI.
        
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (replacements.length > 0) {
        // Sort in reverse order so we don't mess up indices
        replacements.sort((a, b) => b.start - a.start);
        for (let r of replacements) {
            content = content.slice(0, r.start) + r.newText + content.slice(r.end);
        }
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${replacements.length} leaked comments in ${file}`);
    }
});
