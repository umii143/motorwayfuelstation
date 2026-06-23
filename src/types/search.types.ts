// All search-related TypeScript types

export type SearchResultType =
  | 'customer'
  | 'supplier'
  | 'shift'
  | 'batch'
  | 'expense'
  | 'staff'
  | 'report'
  | 'action';       // Command palette actions

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;                  // Primary text  e.g. "Ahmed Khan"
  subtitle: string;               // Secondary     e.g. "Customer • 03001234567"
  metadata?: string;              // Right side    e.g. "Rs. 85,000 balance"
  icon: string;                   // Material Symbol name
  badgeText?: string;             // e.g. "LOW STOCK", "OVERDUE"
  badgeColor?: 'red' | 'orange' | 'green' | 'blue';
  viewId: string;                 // Navigation target
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextData?: Record<string, any>; // Pre-fill data when navigating
  score?: number;                 // Fuse.js match score (lower = better)
  matchedKeys?: string[];         // Which fields matched
  highlightRanges?: HighlightRange[]; // For text highlighting
}

export interface HighlightRange {
  field: string;
  start: number;
  end: number;
}

export interface RecentSearch {
  query: string;
  resultType?: SearchResultType;
  timestamp: string;
  resultId?: string;
  resultTitle?: string;
}

export interface SearchIndex {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suppliers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shifts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batches: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  staff: any[];
}

export interface CommandAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;         // e.g. "Ctrl+N"
  category: 'navigation' | 'create' | 'report' | 'ai';
  action: () => void;
}
