import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';
import type { SearchResult, SearchIndex } from '../types/search.types';

// ─── FUSE.JS CONFIG PER MODULE ──────────────────────────────
// Lower threshold = stricter matching
// Keys with higher weight = ranked higher in results

const FUSE_CONFIGS = {
  customers: {
    threshold: 0.35,        // allows "ahmd" → "Ahmed"
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'name',          weight: 0.40 },
      { name: 'phone',         weight: 0.25 },
      { name: 'cnic',          weight: 0.15 },
      { name: 'vehicleNumber', weight: 0.15 },
      { name: 'accountNumber', weight: 0.05 },
    ],
  },
  suppliers: {
    threshold: 0.35,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'name',        weight: 0.40 },
      { name: 'companyName', weight: 0.30 },
      { name: 'phone',       weight: 0.20 },
      { name: 'city',        weight: 0.10 },
    ],
  },
  shifts: {
    threshold: 0.30,        // stricter — shift numbers must be exact-ish
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'shiftNumber',   weight: 0.35 },
      { name: 'salesmanName',  weight: 0.35 },
      { name: 'date',          weight: 0.20 },
      { name: 'status',        weight: 0.10 },
    ],
  },
  batches: {
    threshold: 0.30,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'batchNumber',    weight: 0.35 },
      { name: 'invoiceNumber',  weight: 0.25 },
      { name: 'supplierName',   weight: 0.25 },
      { name: 'productType',    weight: 0.15 },
    ],
  },
  expenses: {
    threshold: 0.35,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'category',    weight: 0.30 },
      { name: 'paidTo',      weight: 0.30 },
      { name: 'description', weight: 0.25 },
      { name: 'amount',      weight: 0.15 },
    ],
  },
  staff: {
    threshold: 0.35,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'name',  weight: 0.50 },
      { name: 'role',  weight: 0.30 },
      { name: 'phone', weight: 0.20 },
    ],
  },
};

// ─── SEARCH INDEX BUILDER ────────────────────────────────────
// Call this once on app load, and on data changes

let fuseInstances: Record<string, Fuse<any>> = {};

export function buildSearchIndex(data: SearchIndex) {
  fuseInstances = {
    customers: new Fuse(data.customers, FUSE_CONFIGS.customers),
    suppliers: new Fuse(data.suppliers, FUSE_CONFIGS.suppliers),
    shifts:    new Fuse(data.shifts,    FUSE_CONFIGS.shifts),
    batches:   new Fuse(data.batches,   FUSE_CONFIGS.batches),
    expenses:  new Fuse(data.expenses,  FUSE_CONFIGS.expenses),
    staff:     new Fuse(data.staff,     FUSE_CONFIGS.staff),
  };
}

// Rebuild index for a single module (on data change)
export function rebuildModuleIndex(
  module: keyof SearchIndex,
  data: any[]
) {
  fuseInstances[module] = new Fuse(
    data,
    FUSE_CONFIGS[module] as IFuseOptions<any>
  );
}

// ─── MAIN SEARCH FUNCTION ────────────────────────────────────

export function searchAll(query: string, limit = 20): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const allResults: SearchResult[] = [];

  // Search each module
  const modules: Array<[keyof SearchIndex, string]> = [
    ['customers', 'customer'],
    ['suppliers', 'supplier'],
    ['shifts',    'shift'],
    ['batches',   'batch'],
    ['expenses',  'expense'],
    ['staff',     'staff'],
  ];

  for (const [module, type] of modules) {
    const instance = fuseInstances[module];
    if (!instance) continue;

    const results = instance.search(query, { limit: 5 });

    for (const result of results) {
      const formatted = formatResult(result.item, type as any, result);
      if (formatted) allResults.push(formatted);
    }
  }

  // Sort by score (lower Fuse score = better match)
  return allResults
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, limit);
}

// Module-specific search (for search bars within a module page)
export function searchModule(
  module: keyof SearchIndex,
  query: string,
  limit = 50
): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const instance = fuseInstances[module];
  if (!instance) return [];

  const results = instance.search(query, { limit });
  return results
    .map(r => formatResult(r.item, module as any, r))
    .filter(Boolean) as SearchResult[];
}

// ─── RESULT FORMATTER ────────────────────────────────────────
// Transform raw data + Fuse result into SearchResult format

function formatResult(
  item: any,
  type: string,
  fuseResult: FuseResult<any>
): SearchResult | null {
  const score = fuseResult.score ?? 0.5;

  switch (type) {
    case 'customer':
    case 'customers':
      return {
        id: item.id,
        type: 'customer',
        title: item.name,
        subtitle: `Customer • ${item.phone || 'No phone'}`,
        metadata: item.outstandingBalance
          ? `Rs. ${item.outstandingBalance.toLocaleString('en-PK')} balance`
          : undefined,
        badgeText: item.outstandingBalance > 50000 ? 'HIGH BALANCE' : undefined,
        badgeColor: 'orange',
        icon: 'person',
        viewId: 'customers',
        contextData: { customerId: item.id },
        score,
        matchedKeys: fuseResult.matches?.map(m => m.key as string),
      };

    case 'supplier':
    case 'suppliers':
      return {
        id: item.id,
        type: 'supplier',
        title: item.name,
        subtitle: `Supplier • ${item.companyName || item.phone || ''}`,
        metadata: item.totalPurchases
          ? `Rs. ${(item.totalPurchases / 100000).toFixed(1)}L total`
          : undefined,
        icon: 'local_shipping',
        viewId: 'suppliers',
        contextData: { supplierId: item.id },
        score,
      };

    case 'shift':
    case 'shifts':
      return {
        id: item.id,
        type: 'shift',
        title: `Shift #${item.shiftNumber}`,
        subtitle: `${item.salesmanName} • ${item.date}`,
        metadata: item.totalRevenue
          ? `Rs. ${item.totalRevenue.toLocaleString('en-PK')}`
          : undefined,
        badgeText: item.status === 'active' ? 'ACTIVE' : undefined,
        badgeColor: 'green',
        icon: 'schedule',
        viewId: 'shifts',
        contextData: { shiftId: item.id },
        score,
      };

    case 'batch':
    case 'batches':
      return {
        id: item.id,
        type: 'batch',
        title: item.batchNumber,
        subtitle: `${item.productType?.toUpperCase()} • ${item.supplierName}`,
        metadata: `${item.qtyReceived?.toLocaleString()} L`,
        badgeText: item.batchStatus === 'exhausted' ? 'USED' : undefined,
        icon: 'inventory_2',
        viewId: 'fuel_stock',
        contextData: { batchId: item.id },
        score,
      };

    case 'expense':
    case 'expenses':
      return {
        id: item.id,
        type: 'expense',
        title: item.category,
        subtitle: `${item.paidTo || 'General'} • ${item.expenseDate}`,
        metadata: `Rs. ${item.amount?.toLocaleString('en-PK')}`,
        icon: 'receipt_long',
        viewId: 'expenses',
        contextData: { expenseId: item.id },
        score,
      };

    case 'staff':
      return {
        id: item.id,
        type: 'staff',
        title: item.name,
        subtitle: `${item.role} • ${item.phone || ''}`,
        icon: 'badge',
        viewId: 'staff_payroll',
        contextData: { staffId: item.id },
        score,
      };

    default:
      return null;
  }
}

// ─── TEXT HIGHLIGHT HELPER ───────────────────────────────────
// Returns JSX-ready segments for highlighting matched text

export function getHighlightedText(
  text: string,
  query: string
): Array<{ text: string; highlight: boolean }> {
  if (!query || !text) return [{ text, highlight: false }];

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map(part => ({
    text: part,
    highlight: regex.test(part),
  }));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
