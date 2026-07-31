// All search-related TypeScript types

export type SearchResultType =
 | 'customer'
 | 'supplier'
 | 'shift'
 | 'batch'
 | 'expense'
 | 'staff'
 | 'report'
 | 'action' // Command palette actions
 | 'tank'
 | 'nozzle'
 | 'product'
 | 'invoice'; // Fuel/lube sale, debit, recovery, bank/digital entry

export interface SearchResult {
 id: string;
 type: SearchResultType;
 title: string; // Primary text e.g."Ahmed Khan"
 subtitle: string; // Secondary e.g."Customer • 03001234567"
 metadata?: string; // Right side e.g."Rs. 85,000 balance"
 icon: string; // Material Symbol name
 badgeText?: string; // e.g."LOW STOCK","OVERDUE"
 badgeColor?: 'red' | 'orange' | 'green' | 'blue';
 viewId: string; // Navigation target
 contextData?: Record<string, any>; // Pre-fill data when navigating
 score?: number; // Fuse.js match score (lower = better)
 matchedKeys?: string[]; // Which fields matched
 highlightRanges?: HighlightRange[]; // For text highlighting
 // If present, selecting this result opens the entity graph drawer
 // instead of (or in addition to) navigating to a module.
 entityRef?: EntityRef;
}

export interface EntityRef {
 kind: SearchResultType;
 id: string;
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
 customers: any[];
 suppliers: any[];
 shifts: any[];
 batches: any[];
 expenses: any[];
 staff: any[];
 tanks: any[];
 nozzles: any[];
 products: any[];
 invoices: any[];
}

export interface CommandAction {
 id: string;
 label: string;
 description: string;
 icon: string;
 shortcut?: string; // e.g."Ctrl+N"
 category: 'navigation' | 'create' | 'report' | 'ai';
 action: () => void;
}

// ─── BUSINESS GRAPH MODEL ──────────────────────────────────────
// The unified relationship spine: every module connected as a graph.

export type GraphNodeKind =
 | 'customer' | 'supplier' | 'shift' | 'product' | 'tank' | 'nozzle'
 | 'invoice' | 'payment' | 'expense' | 'ledger' | 'journal' | 'audit'
 | 'roznamcha' | 'staff' | 'batch';

export interface GraphNode {
 id: string;
 kind: GraphNodeKind;
 label: string;
 sublabel?: string;
 meta?: string; // e.g. amount / balance
 viewId: string; // module to open
 contextData?: Record<string, any>;
}

export interface GraphEdge {
 from: string; // node id
 to: string; // node id
 relation: string; // e.g. 'CREDITED_TO', 'PAID_VIA', 'PART_OF'
}

export interface GraphTrail {
 nodes: GraphNode[];
 edges: GraphEdge[];
}
