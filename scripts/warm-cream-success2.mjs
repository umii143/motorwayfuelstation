// Phase-1 follow-up: restore semantic success-green states in reports-v2
// that the brand conversion over-mapped to amber. Only touches genuine
// healthy/verified/success semantics — brand accents (nav active states,
// workspace colors, quick-action icons) stay warm amber.
import { readFileSync, writeFileSync } from 'fs';

const fixes = [
  // EngineHealthDashboard: HEALTHY pill
  [
    'src/components/features/reports-v2/analytics/EngineHealthDashboard.tsx',
    `case 'ENGINE_HEALTHY':\n        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">Healthy</span>;`,
    `case 'ENGINE_HEALTHY':\n        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">Healthy</span>;`,
  ],
  // EngineHealthDashboard: error-rate ternary (0 errors = healthy)
  [
    'src/components/features/reports-v2/analytics/EngineHealthDashboard.tsx',
    `metric.errorRate1h > 0 ? 'text-amber-600' : 'text-primary'`,
    `metric.errorRate1h > 0 ? 'text-amber-600' : 'text-success'`,
  ],
  // ReportViewer: SUCCESS status map → success token
  [
    'src/components/features/reports-v2/ReportViewer.tsx',
    `SUCCESS: { bg: 'bg-primary/10 dark:bg-primary-hover/20', border: 'border-primary', text: 'text-primary dark:text-primary', bar: 'bg-primary', icon: '✓' },`,
    `SUCCESS: { bg: 'bg-success/10 dark:bg-success/20', border: 'border-success', text: 'text-success dark:text-success', bar: 'bg-success', icon: '✓' },`,
  ],
  // InventoryOverviewTab: stock level bar (not low = healthy)
  [
    'src/components/features/reports-v2/components/workspaces/inventory/InventoryOverviewTab.tsx',
    `isLow ? 'bg-red-500' : 'bg-primary'`,
    `isLow ? 'bg-red-500' : 'bg-success'`,
  ],
  // Analytics verified badges (carry 🟢 success emoji — text should match)
  [
    'src/components/features/reports-v2/components/workspaces/analytics/InventoryAnalyticsTab.tsx',
    `text-primary dark:text-primary font-bold`,
    `text-success dark:text-success font-bold`,
  ],
  [
    'src/components/features/reports-v2/components/workspaces/analytics/OverviewAnalyticsTab.tsx',
    `bg-primary/10 text-primary dark:text-primary border border-primary/20`,
    `bg-success/10 text-success dark:text-success border border-success/20`,
  ],
  [
    'src/components/features/reports-v2/components/workspaces/analytics/PricingAnalyticsTab.tsx',
    `text-primary dark:text-primary font-bold`,
    `text-success dark:text-success font-bold`,
  ],
  [
    'src/components/features/reports-v2/components/workspaces/analytics/PurchaseAnalyticsTab.tsx',
    `text-primary dark:text-primary font-bold`,
    `text-success dark:text-success font-bold`,
  ],
  [
    'src/components/features/reports-v2/components/workspaces/analytics/SalesAnalyticsTab.tsx',
    `text-primary dark:text-primary font-bold`,
    `text-success dark:text-success font-bold`,
  ],
  [
    'src/components/features/reports-v2/components/workspaces/analytics/SupplierAnalyticsTab.tsx',
    `text-primary dark:text-primary font-bold`,
    `text-success dark:text-success font-bold`,
  ],
];

let total = 0;
for (const [path, from, to] of fixes) {
  let src = readFileSync(path, 'utf8');
  const before = src;
  if (!src.includes(from)) {
    console.log(`MISS  ${path}: ${from.slice(0, 60)}...`);
    continue;
  }
  src = src.split(from).join(to);
  total++;
  if (src !== before) writeFileSync(path, src);
}
console.log(`Applied ${total} reports-v2 semantic success fixes.`);
