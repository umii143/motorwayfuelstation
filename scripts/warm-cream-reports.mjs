/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise — Warm Cream Theme Migration (Reports Module)
 *
 * One-off converter: replaces the hardcoded emerald brand palette (#0B5C3D,
 * emerald-*) used across the reports-v2 module with the active theme tokens
 * (--primary-accent / --primary-hover via Tailwind `primary` classes), so the
 * module renders in the Warm Cream Enterprise Theme (#D97706 amber) while
 * staying readable under every theme (AGENTS.md Rules #2/#3/#14/#37).
 *
 * Usage:  node scripts/warm-cream-reports.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIR = join(ROOT, 'src', 'components', 'features', 'reports-v2');

// Ordered replacements — most specific patterns first.
const REPLACEMENTS = [
  // ── Brand emerald #0B5C3D → theme tokens ──
  [/bg-\[#0B5C3D\]\/10/g, 'bg-primary/10'],
  [/bg-\[#0B5C3D\]/g, 'bg-primary'],
  [/text-\[#0B5C3D\]/g, 'text-primary'],
  [/border-\[#0B5C3D\]/g, 'border-primary'],
  [/ring-\[#0B5C3D\]/g, 'ring-primary'],
  [/focus:border-\[#0B5C3D\]/g, 'focus:border-primary'],
  [/focus:ring-\[#0B5C3D\]/g, 'focus:ring-primary'],
  [/via-\[#0B5C3D\]/g, 'via-primary'],
  [/from-\[#0B5C3D\]/g, 'from-primary'],
  [/to-\[#0B5C3D\]/g, 'to-primary'],
  [/hover:bg-\[#0B5C3D\]/g, 'hover:bg-primary'],
  [/hover:text-\[#0B5C3D\]/g, 'hover:text-primary'],
  [/stopColor="#0B5C3D"/g, 'stopColor="var(--primary-accent)"'],
  [/stroke="#0B5C3D"/g, 'stroke="var(--primary-accent)"'],
  [/fill="#0B5C3D"/g, 'fill="var(--primary-accent)"'],

  // ── emerald-* → warm amber (longest / most specific first) ──
  [/hover:bg-emerald-800/g, 'hover:bg-primary-hover'],
  [/hover:bg-emerald-700/g, 'hover:bg-primary-hover'],
  [/hover:bg-emerald-500/g, 'hover:bg-primary'],
  [/hover:bg-emerald-400/g, 'hover:bg-primary'],
  [/hover:bg-emerald-100/g, 'hover:bg-primary/15'],
  [/hover:border-emerald-400/g, 'hover:border-primary'],
  [/hover:border-emerald-500/g, 'hover:border-primary'],
  [/hover:text-emerald-700/g, 'hover:text-primary'],
  [/hover:text-emerald-800/g, 'hover:text-primary'],
  [/bg-emerald-950/g, 'bg-primary-hover'],
  [/bg-emerald-900/g, 'bg-primary-hover'],
  [/bg-emerald-800\/80/g, 'bg-primary/80'],
  [/bg-emerald-800/g, 'bg-primary'],
  [/bg-emerald-700\/80/g, 'bg-primary/80'],
  [/bg-emerald-700/g, 'bg-primary'],
  [/bg-emerald-600/g, 'bg-primary'],
  [/bg-emerald-500\/10/g, 'bg-primary/10'],
  [/bg-emerald-500/g, 'bg-primary'],
  [/bg-emerald-100/g, 'bg-primary/10'],
  [/bg-emerald-50\/80/g, 'bg-primary/10'],
  [/bg-emerald-50\/70/g, 'bg-primary/10'],
  [/bg-emerald-50\/50/g, 'bg-primary/10'],
  [/bg-emerald-50/g, 'bg-primary/10'],
  [/text-emerald-950/g, 'text-primary'],
  [/text-emerald-900/g, 'text-primary'],
  [/text-emerald-800/g, 'text-primary'],
  [/text-emerald-700/g, 'text-primary'],
  [/text-emerald-600/g, 'text-primary'],
  [/text-emerald-500/g, 'text-primary'],
  [/text-emerald-400/g, 'text-primary'],
  [/text-emerald-300/g, 'text-primary'],
  [/text-emerald-200/g, 'text-primary/70'],
  [/border-emerald-800\/40/g, 'border-primary/40'],
  [/border-emerald-800/g, 'border-primary/50'],
  [/border-emerald-700/g, 'border-primary/50'],
  [/border-emerald-500\/30/g, 'border-primary/30'],
  [/border-emerald-500\/20/g, 'border-primary/20'],
  [/border-emerald-500/g, 'border-primary'],
  [/border-emerald-400\/30/g, 'border-primary/30'],
  [/border-emerald-300/g, 'border-primary/35'],
  [/border-emerald-200\/90/g, 'border-primary/25'],
  [/border-emerald-200\/80/g, 'border-primary/25'],
  [/border-emerald-200/g, 'border-primary/25'],
  [/from-emerald-950/g, 'from-primary-hover'],
  [/from-emerald-500/g, 'from-primary'],
  [/to-emerald-950/g, 'to-primary-hover'],

  // ── dark-mode variants → stay on brand ──
  [/dark:bg-emerald-950\/20/g, 'dark:bg-primary/20'],
  [/dark:bg-emerald-900\/40/g, 'dark:bg-primary/30'],
  [/dark:bg-emerald-950/g, 'dark:bg-primary-hover'],
  [/dark:text-emerald-400/g, 'dark:text-primary'],
  [/dark:text-emerald-300/g, 'dark:text-primary'],
  [/dark:text-emerald-200/g, 'dark:text-primary/70'],
  [/dark:border-emerald-900\/40/g, 'dark:border-primary/30'],
  [/dark:border-emerald-500\/30/g, 'dark:border-primary/30'],
  [/dark:border-emerald-500\/20/g, 'dark:border-primary/20'],
  [/dark:from-emerald-950/g, 'dark:from-primary-hover'],
  [/dark:via-slate-900/g, 'dark:via-primary-hover'],

  // ── warm cream brand surfaces ──
  [/bg-\[#FAF8F5\]/g, 'bg-background'],
  [/ring-white/g, 'ring-card'],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (extname(p) === '.tsx' || extname(p) === '.ts') out.push(p);
  }
  return out;
}

let totalFiles = 0;
let totalReplacements = 0;

for (const file of walk(TARGET_DIR)) {
  let src = readFileSync(file, 'utf8');
  const before = src;
  let fileChanges = 0;
  for (const [re, replacement] of REPLACEMENTS) {
    const matches = src.match(re);
    if (matches && matches.length > 0) {
      src = src.replace(re, replacement);
      fileChanges += matches.length;
    }
  }
  if (src !== before) {
    writeFileSync(file, src);
    totalFiles += 1;
    totalReplacements += fileChanges;
    console.log(`✔ ${file.replace(ROOT + '/', '')} — ${fileChanges} replacements`);
  }
}

console.log(`\nDone: ${totalFiles} files changed, ${totalReplacements} replacements.`);
