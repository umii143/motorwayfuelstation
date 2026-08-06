/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise — Warm Cream Theme Migration (Legacy Reports Surface)
 *
 * Same token mapping as scripts/warm-cream-reports.mjs, applied to the
 * legacy reports family: Reports.tsx, AdvancedReportsHub.tsx, LubeReports.tsx,
 * PetroleumInventoryReport, FuelPurchaseHistoryReport, BankReconciliationReport,
 * FuelVarianceHeatmap, InventoryAgingDashboard, ShiftIntelligenceReport,
 * SingleProductDrillDownModal, and their shared components (ResponsiveTable,
 * EmptyState). No business logic changes — visual theme tokens only.
 *
 * Usage:  node scripts/warm-cream-legacy-reports.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TARGETS = [
  'src/components/features/Reports.tsx',
  'src/components/features/AdvancedReportsHub.tsx',
  'src/components/features/LubeReports.tsx',
  'src/components/features/PetroleumInventoryReport.tsx',
  'src/components/features/FuelPurchaseHistoryReport.tsx',
  'src/components/features/BankReconciliationReport.tsx',
  'src/components/features/FuelVarianceHeatmap.tsx',
  'src/components/features/InventoryAgingDashboard.tsx',
  'src/components/features/ShiftIntelligenceReport.tsx',
  'src/components/features/SingleProductDrillDownModal.tsx',
  'src/components/shared/ResponsiveTable.tsx',
  'src/components/ui/EmptyState.tsx',
];

// Ordered replacements — most specific first. Mirrors warm-cream-reports.mjs.
const REPLACEMENTS = [
  // ── brand emerald hexes ──
  [/bg-\[#0B5C3D\]\/10/g, 'bg-primary/10'],
  [/bg-\[#0B5C3D\]/g, 'bg-primary'],
  [/text-\[#0B5C3D\]/g, 'text-primary'],
  [/border-\[#0B5C3D\]/g, 'border-primary'],
  [/stopColor="#0B5C3D"/g, 'stopColor="var(--primary-accent)"'],
  [/stroke="#0B5C3D"/g, 'stroke="var(--primary-accent)"'],
  [/fill="#0B5C3D"/g, 'fill="var(--primary-accent)"'],

  // ── emerald-* → warm amber ──
  [/hover:bg-emerald-800/g, 'hover:bg-primary-hover'],
  [/hover:bg-emerald-700/g, 'hover:bg-primary-hover'],
  [/hover:bg-emerald-600/g, 'hover:bg-primary'],
  [/hover:bg-emerald-500/g, 'hover:bg-primary'],
  [/hover:bg-emerald-400/g, 'hover:bg-primary'],
  [/hover:bg-emerald-100/g, 'hover:bg-primary/15'],
  [/hover:border-emerald-400/g, 'hover:border-primary'],
  [/hover:border-emerald-500/g, 'hover:border-primary'],
  [/hover:text-emerald-700/g, 'hover:text-primary'],
  [/hover:text-emerald-600/g, 'hover:text-primary'],
  [/hover:text-emerald-800/g, 'hover:text-primary'],
  [/bg-emerald-950/g, 'bg-primary-hover'],
  [/bg-emerald-900/g, 'bg-primary-hover'],
  [/bg-emerald-800\/80/g, 'bg-primary/80'],
  [/bg-emerald-800/g, 'bg-primary'],
  [/bg-emerald-700\/80/g, 'bg-primary/80'],
  [/bg-emerald-700/g, 'bg-primary'],
  [/bg-emerald-600\/80/g, 'bg-primary/80'],
  [/bg-emerald-600/g, 'bg-primary'],
  [/bg-emerald-500\/15/g, 'bg-primary/15'],
  [/bg-emerald-500\/10/g, 'bg-primary/10'],
  [/bg-emerald-500\/5/g, 'bg-primary/5'],
  [/bg-emerald-500/g, 'bg-primary'],
  [/bg-emerald-400/g, 'bg-primary'],
  [/bg-emerald-300/g, 'bg-primary'],
  [/bg-emerald-200\/80/g, 'bg-primary/15'],
  [/bg-emerald-200/g, 'bg-primary/15'],
  [/bg-emerald-100/g, 'bg-primary/10'],
  [/bg-emerald-50\/80/g, 'bg-primary/10'],
  [/bg-emerald-50\/70/g, 'bg-primary/10'],
  [/bg-emerald-50\/50/g, 'bg-primary/10'],
  [/bg-emerald-50/g, 'bg-primary/10'],
  [/text-emerald-950/g, 'text-primary'],
  [/text-emerald-900/g, 'text-primary'],
  [/text-emerald-800/g, 'text-primary'],
  [/text-emerald-705/g, 'text-primary'],
  [/text-emerald-700/g, 'text-primary'],
  [/text-emerald-600/g, 'text-primary'],
  [/text-emerald-500/g, 'text-primary'],
  [/text-emerald-400/g, 'text-primary'],
  [/text-emerald-300/g, 'text-primary'],
  [/text-emerald-200/g, 'text-primary/70'],
  [/border-emerald-800\/40/g, 'border-primary/40'],
  [/border-emerald-800/g, 'border-primary/50'],
  [/border-emerald-700\/50/g, 'border-primary/50'],
  [/border-emerald-700/g, 'border-primary/50'],
  [/border-emerald-500\/30/g, 'border-primary/30'],
  [/border-emerald-500\/20/g, 'border-primary/20'],
  [/border-emerald-500/g, 'border-primary'],
  [/border-emerald-400\/30/g, 'border-primary/30'],
  [/border-emerald-400/g, 'border-primary/40'],
  [/border-emerald-300/g, 'border-primary/35'],
  [/border-emerald-200\/90/g, 'border-primary/25'],
  [/border-emerald-200\/80/g, 'border-primary/25'],
  [/border-emerald-200\/60/g, 'border-primary/25'],
  [/border-emerald-200/g, 'border-primary/25'],
  [/border-emerald-100/g, 'border-primary/20'],
  [/from-emerald-950/g, 'from-primary-hover'],
  [/from-emerald-500/g, 'from-primary'],
  [/to-emerald-950/g, 'to-primary-hover'],

  // ── dark-mode variants ──
  [/dark:bg-emerald-950\/40/g, 'dark:bg-primary/30'],
  [/dark:bg-emerald-950\/30/g, 'dark:bg-primary/25'],
  [/dark:bg-emerald-950\/20/g, 'dark:bg-primary/20'],
  [/dark:bg-emerald-950/g, 'dark:bg-primary-hover'],
  [/dark:bg-emerald-800/g, 'dark:bg-primary'],
  [/dark:bg-emerald-900\/40/g, 'dark:bg-primary/30'],
  [/dark:text-emerald-400/g, 'dark:text-primary'],
  [/dark:text-emerald-300/g, 'dark:text-primary'],
  [/dark:text-emerald-200/g, 'dark:text-primary/70'],
  [/dark:text-emerald-100/g, 'dark:text-primary/70'],
  [/dark:border-emerald-700\/50/g, 'dark:border-primary/50'],
  [/dark:border-emerald-900\/40/g, 'dark:border-primary/30'],
  [/dark:border-emerald-500\/30/g, 'dark:border-primary/30'],
  [/dark:border-emerald-500\/20/g, 'dark:border-primary/20'],
  [/dark:from-emerald-950/g, 'dark:from-primary-hover'],
];

let totalFiles = 0;
let totalReplacements = 0;

for (const file of TARGETS) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    console.log(`✗ SKIP (missing): ${file}`);
    continue;
  }
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
    console.log(`✔ ${file} — ${fileChanges} replacements`);
  }
}

console.log(`\nDone: ${totalFiles} files changed, ${totalReplacements} replacements.`);
