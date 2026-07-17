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
  tanks: {
    threshold: 0.30,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'name',        weight: 0.50 },
      { name: 'productName', weight: 0.30 },
      { name: 'physicalLabel', weight: 0.20 },
    ],
  },
  nozzles: {
    threshold: 0.30,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'name',        weight: 0.50 },
      { name: 'productName', weight: 0.30 },
      { name: 'pumpId',      weight: 0.20 },
    ],
  },
  products: {
    threshold: 0.30,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'name',    weight: 0.50 },
      { name: 'urduName', weight: 0.20 },
      { name: 'type',    weight: 0.15 },
      { name: 'category', weight: 0.15 },
    ],
  },
  invoices: {
    threshold: 0.30,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'invoiceNo', weight: 0.40 },
      { name: 'customerName', weight: 0.30 },
      { name: 'transactionId', weight: 0.20 },
      { name: 'reference', weight: 0.10 },
    ],
  },
};

// ─── SEARCH INDEX BUILDER ────────────────────────────────────
// Call this once on app load, and on data changes

let fuseInstances: Record<string, Fuse<any>> = { /* empty */ };

export function buildSearchIndex(data: SearchIndex) {
  fuseInstances = {
    customers: new Fuse(data.customers, FUSE_CONFIGS.customers),
    suppliers: new Fuse(data.suppliers, FUSE_CONFIGS.suppliers),
    shifts:    new Fuse(data.shifts,    FUSE_CONFIGS.shifts),
    batches:   new Fuse(data.batches,   FUSE_CONFIGS.batches),
    expenses:  new Fuse(data.expenses,  FUSE_CONFIGS.expenses),
    staff:     new Fuse(data.staff,     FUSE_CONFIGS.staff),
    tanks:     new Fuse(data.tanks,     FUSE_CONFIGS.tanks),
    nozzles:   new Fuse(data.nozzles,   FUSE_CONFIGS.nozzles),
    products:  new Fuse(data.products,  FUSE_CONFIGS.products),
    invoices:  new Fuse(data.invoices,  FUSE_CONFIGS.invoices),
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
    ['tanks',     'tank'],
    ['nozzles',   'nozzle'],
    ['products',  'product'],
    ['invoices',  'invoice'],
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
        entityRef: { kind: 'customer', id: item.id },
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
        entityRef: { kind: 'supplier', id: item.id },
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
        entityRef: { kind: 'shift', id: item.id },
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
        entityRef: { kind: 'batch', id: item.id },
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
        entityRef: { kind: 'expense', id: item.id },
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
        entityRef: { kind: 'staff', id: item.id },
        score,
      };

    case 'tank':
    case 'tanks':
      return {
        id: item.id,
        type: 'tank',
        title: item.name,
        subtitle: `Tank • ${item.productName || item.productId}`,
        metadata: `${item.currentStock?.toLocaleString()} / ${item.capacity?.toLocaleString()} L`,
        icon: 'local_gas_station',
        viewId: 'fuel_stock',
        contextData: { tankId: item.id },
        entityRef: { kind: 'tank', id: item.id },
        score,
      };

    case 'nozzle':
    case 'nozzles':
      return {
        id: item.id,
        type: 'nozzle',
        title: item.name,
        subtitle: `Nozzle • ${item.productName || item.productId}`,
        icon: 'opacity',
        viewId: 'inventory',
        contextData: { nozzleId: item.id },
        entityRef: { kind: 'nozzle', id: item.id },
        score,
      };

    case 'product':
    case 'products':
      return {
        id: item.id,
        type: 'product',
        title: item.name,
        subtitle: `${item.type} • Rs.${item.rate}`,
        metadata: `${item.currentStock?.toLocaleString()} ${item.unit}`,
        icon: 'inventory_2',
        viewId: 'inventory',
        contextData: { productId: item.id },
        entityRef: { kind: 'product', id: item.id },
        score,
      };

    case 'invoice':
    case 'invoices':
      return {
        id: item.id,
        type: 'invoice',
        title: item.invoiceNo || item.invoiceNumber || item.id,
        subtitle: `${item.customerName || 'Invoice'} • ${item.paymentMode || ''}`,
        metadata: item.total ? `Rs. ${Number(item.total).toLocaleString('en-PK')}` : undefined,
        badgeText: item.paymentMode === 'credit' ? 'CREDIT' : undefined,
        badgeColor: 'orange',
        icon: 'receipt_long',
        viewId: 'customers',
        contextData: { customerId: item.customerId },
        entityRef: { kind: 'invoice', id: item.id },
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
  return str.replace(/[.*+?^${ /* empty */ }()|[\]\\]/g, '\\$&');
}
