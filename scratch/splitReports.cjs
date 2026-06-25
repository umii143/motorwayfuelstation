const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '../src/lib/reportCompilers.ts');
const outDir = path.join(__dirname, '../src/lib/reports');
const compilersDir = path.join(outDir, 'compilers');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(compilersDir)) fs.mkdirSync(compilersDir, { recursive: true });

const content = fs.readFileSync(srcFile, 'utf8');

// 1. Extract types and utils
const topMatch = content.match(/([\s\S]*?)\/\/\s*={10,}\s*\/\/\s*THE 40\+\s*REPORT TEMPLATES/i);
let topSection = topMatch ? topMatch[1] : '';

// Split topSection into types and utils
const utilsIndex = topSection.indexOf('// UTILITY HELPERS');
let typesSection = topSection.substring(0, utilsIndex);
let utilsSection = topSection.substring(utilsIndex);

// We need to fix imports in typesSection
fs.writeFileSync(path.join(outDir, 'types.ts'), typesSection);

// utils needs types
let utilsImports = `import { Product, Staff } from '../../types';\n`;
fs.writeFileSync(path.join(outDir, 'utils.ts'), utilsImports + utilsSection);

// 2. Extract the REPORT_TEMPLATES array
const arrayStart = content.indexOf('export const REPORT_TEMPLATES: ReportTemplate[] = [');
const arrayEnd = content.lastIndexOf('];');
const arrayContent = content.substring(arrayStart + 'export const REPORT_TEMPLATES: ReportTemplate[] = ['.length, arrayEnd);

// Split into templates
const templates = [];
let braceCount = 0;
let currentTemplate = '';
let inString = false;
let stringChar = '';

for (let i = 0; i < arrayContent.length; i++) {
  const char = arrayContent[i];
  
  if ((char === "'" || char === '"' || char === '`') && arrayContent[i-1] !== '\\') {
    if (!inString) {
      inString = true;
      stringChar = char;
    } else if (stringChar === char) {
      inString = false;
    }
  }

  if (!inString) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }

  currentTemplate += char;

  if (braceCount === 0 && currentTemplate.trim().length > 0) {
    if (char === '}') {
      // Find the next comma or just end
      let nextComma = arrayContent.indexOf(',', i);
      if (nextComma !== -1 && arrayContent.substring(i+1, nextComma).trim() === '') {
        i = nextComma;
        currentTemplate += arrayContent.substring(currentTemplate.length, (nextComma - i + 1) + currentTemplate.length - 1); // rough
      }
      templates.push(currentTemplate.trim().replace(/^,/, '').trim());
      currentTemplate = '';
    }
  }
}

// Group by category
const categoryMap = {
  'A': 'sales',
  'B': 'inventory',
  'C': 'financial',
  'D': 'staff',
  'E': 'customers',
  'F': 'suppliers',
  'G': 'audit',
  'H': 'extended',
  'I': 'enterprise'
};

const grouped = {};
templates.forEach(t => {
  const catMatch = t.match(/category:\s*['"]([A-Z])['"]/);
  if (catMatch) {
    const cat = catMatch[1];
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }
});

let indexExports = `import { ReportTemplate } from './types';\n\n`;
let masterArray = `export const REPORT_TEMPLATES: ReportTemplate[] = [\n`;

Object.keys(grouped).forEach(cat => {
  const fileName = categoryMap[cat] + 'Reports.ts';
  const fileContent = `import { ReportTemplate, ReportRow } from '../types';\n` +
    `import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';\n\n` +
    `export const ${categoryMap[cat]}Templates: ReportTemplate[] = [\n  ` + 
    grouped[cat].join(',\n  ') + 
    `\n];\n`;
  
  fs.writeFileSync(path.join(compilersDir, fileName), fileContent);
  
  indexExports += `import { ${categoryMap[cat]}Templates } from './compilers/${categoryMap[cat]}Reports';\n`;
  masterArray += `  ...${categoryMap[cat]}Templates,\n`;
});

masterArray += `];\n`;
fs.writeFileSync(path.join(outDir, 'index.ts'), indexExports + '\n' + masterArray);

console.log('Successfully split reports!');
