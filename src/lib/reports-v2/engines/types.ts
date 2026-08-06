/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Engine-Driven Architecture — Type Contracts
 *
 * Every engine implements a strict contract.
 * Reports are pure configuration. Engines do all the work.
 */

// ──────────────────────────────────────────────
// ENGINE TYPES — What kind of report is this?
// ──────────────────────────────────────────────

export interface IObservableEngine {
  getMetrics(): Record<string, number>;
}

export type ReportEngineType =
  | 'BusinessDashboard'    // Executive overview (KPIs + Charts + Register)
  | 'SalesRegister'        // Sales-focused register with sales KPIs
  | 'StockDashboard'       // Tank/fuel stock focused
  | 'ShiftSummary'         // Shift opening/closing
  | 'CashSummary'          // Cash in/out/safe
  | 'ExpenseRegister'      // Expense tracking
  | 'CustomerLedger'       // Customer outstanding/payments
  | 'SupplierLedger'       // Supplier outstanding/payments
  | 'BankPosition'         // Bank accounts overview
  | 'DigitalPayments'      // EasyPaisa/JazzCash/etc
  | 'LedgerView'           // General/specific ledger
  | 'StaffRegister'        // HR/attendance
  | 'AssetRegister'        // Pumps/tanks/equipment
  | 'AuditLog'             // System audit trail
  | 'AIIntelligence'       // AI-powered insights
  | 'TaxReport'            // GST/Withholding
  | 'PurchaseRegister'     // Purchase orders/deliveries
  | 'PriceHistory'         // OGRA/rate changes
  | 'TankDipReport'        // Dip readings
  | 'PumpNozzleReport'     // Pump readings/calibration
  | 'FleetReport'          // Vehicle/driver tracking
  | 'ComplianceReport'     // Regulatory compliance
  | 'TreasuryDashboard'    // Liquidity/cash position
  | 'AnalyticsDashboard'   // Forecasting/what-if
  | 'BranchComparison'    // Multi-branch
  | 'Variance'            // Cash variance tracking (v2.1)
  | 'ProfitReport'        // True Profit / P&L waterfall (v2.1);

/**
 * v2.1 Patch A.5 — Two-Level Engine Typing
 * engineType picks the underlying data-shape/engine behavior.
 * rendererProfile picks the visual layout within that engine type.
 * Same engine, different layout, zero new engine code.
 */
export type RendererProfile =
  | 'Executive'     // KPI grid, minimal, big numbers first
  | 'Operational'   // Denser grid, more cards, heatmap included
  | 'Financial'     // Waterfall, ledger, profit focus
  | 'Inventory'     // Gauges, stock registers, tank levels
  | 'Audit';        // Timeline, audit log, compliance focus

// ──────────────────────────────────────────────
// QUERY ENGINE TYPES
// ──────────────────────────────────────────────

export interface QueryContext {
  orgId: string;
  stationId: string;
  userId: string;
  role: string;
  dateFrom?: Date;
  dateTo?: Date;
  filters?: Record<string, any>;
}

export interface RawDataResult {
  collection: string;
  documents: Record<string, any>[];
  count: number;
  fetchedAt: Date;
  executionTimeMs: number;
  /** True when resolved from the Historical Archive window cache (Rule #92). */
  fromCache?: boolean;
}

// ──────────────────────────────────────────────
// QUERY PLAN TYPES (v2.1 Patch A.1)
// Declarative query specification — reports write a queryPlan, not a query.
// QueryPlanResolver is the ONLY layer that knows Firestore's collection/index structure.
// RegisterEngine never sees a collection name — it only executes what QueryPlanResolver hands it.
// ──────────────────────────────────────────────

export interface QueryJoin {
  collection: string;              // Abstract domain key (e.g., 'productRates')
  on: string;                      // Join key field name (e.g., 'productType')
  asOf?: string;                   // Temporal join field (e.g., 'shiftReadings.recordedAt')
  type?: 'left' | 'inner';         // Default: 'left'
  prefix?: string;                 // Optional prefix for joined fields (e.g., 'rate_')
}

export interface QueryFilter {
  field: string;                   // Document field to filter on
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'array-contains';
  value: any;
}

export interface QueryPlan {
  base: string;                     // Abstract domain key for base collection (e.g., 'shiftReadings')
  joins?: QueryJoin[];              // Join definitions
  filters?: QueryFilter[];          // Optional pre-filters applied at fetch time
}

/** Result of resolving a queryPlan — multiple raw data results keyed by domain. */
export interface ResolvedQueryResult {
  base: RawDataResult;              // Base collection rows
  joins: Record<string, RawDataResult>;  // Joined collection results keyed by domain
  /** Joined/merged rows — base rows with join data merged in via client-side join. */
  mergedRows: Record<string, any>[];
  totalExecutionTimeMs: number;
}

// ──────────────────────────────────────────────
// KPI ENGINE TYPES
// ──────────────────────────────────────────────

export type KPIDisplayType =
  | 'simple'       // Just label + value
  | 'progress'     // Value + progress bar
  | 'gauge'        // Circular gauge
  | 'sparkline'    // Value + mini trend line
  | 'target'       // Value vs target
  | 'comparison'   // This period vs last period
  | 'variance'     // Expected vs actual
  | 'risk'         // Risk indicator
  | 'ai';          // AI-generated insight

export interface KPIResult {
  id: string;
  label: string;
  labelUr: string;
  value: number | string;
  unit: string;
  trend?: number;              // percentage change from previous period
  status: 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL';
  displayType: KPIDisplayType;
  drilldownReportId?: string;  // Which report to open on click
  explainText?: string;        // Human-readable explanation
}

// ──────────────────────────────────────────────
// CHART ENGINE TYPES
// ──────────────────────────────────────────────

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'heatmap' | 'stacked' | 'scatter';

export interface ChartResult {
  chartId: string;
  chartType: ChartType;
  title: string;
  titleUr: string;
  data: any[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
}

// ──────────────────────────────────────────────
// REGISTER ENGINE TYPES
// ──────────────────────────────────────────────

export interface RegisterColumnDef {
  id: string;
  header: string;
  headerUr: string;
  accessor: string;
  isNumeric?: boolean;
  isCurrency?: boolean;
  isDate?: boolean;
  isStatus?: boolean;
  width?: number;
  frozen?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

export interface RegisterResult {
  title: string;
  titleUr: string;
  columns: RegisterColumnDef[];
  rows: Record<string, any>[];
  totalCount: number;
  summaryRow?: Record<string, any>;   // Totals row at bottom
  groupByOptions?: string[];
  defaultSortColumn?: string;
  defaultSortDirection?: 'asc' | 'desc';
}

// ──────────────────────────────────────────────
// TIMELINE ENGINE TYPES
// ──────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  category: 'SALE' | 'EXPENSE' | 'SHIFT' | 'STOCK' | 'PAYMENT' | 'ALERT' | 'SYSTEM';
}

export interface TimelineResult {
  events: TimelineEvent[];
  hasMore: boolean;
}

// ──────────────────────────────────────────────
// ALERT TYPES
// ──────────────────────────────────────────────

export interface AlertResult {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  messageUr: string;
  timestamp: Date;
  actionLabel?: string;
  actionReportId?: string;
}

// ──────────────────────────────────────────────
// RULE ENGINE TYPES (v2.1 Patch — Phase 9 C.1 Step 5)
// RuleEvaluator takes a ruleId + computed value → { status, color, icon, message }
// Thresholds are station-configurable via Settings — never hardcoded.
// ──────────────────────────────────────────────

export type RuleStatus = 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL';

export interface RuleResult {
  ruleId: string;
  status: RuleStatus;
  color: string;                    // Semantic color token (e.g., 'success', 'warning', 'danger')
  icon: string;                     // Icon name (e.g., '✓', '⚠', '✕', '↑', '↓')
  message: string;
  messageUr: string;
  threshold?: { min?: number; max?: number };  // The thresholds that were evaluated
  actualValue?: number;             // The actual value that was evaluated
}

export interface RuleDefinition {
  id: string;
  version: string;
  description: string;
  owner: string;
  evaluate: (value: number, config?: Record<string, any>) => RuleResult;
}

// ──────────────────────────────────────────────
// WORKFLOW ENGINE TYPES (v2.1 Patch A.4)
// Seventh shared engine — approval chains and state transitions.
// Formalizes what Phase 6's "never auto-post without Owner confirmation" did informally.
// ──────────────────────────────────────────────

export type WorkflowState = 'Pending' | 'ManagerReview' | 'OwnerReview' | 'Posted' | 'Rejected';

export interface WorkflowTransition {
  from: WorkflowState;
  to: WorkflowState;
  requiredRole: 'Manager' | 'Owner' | 'Admin';
  condition?: (entity: Record<string, any>) => boolean;
  publishEvent?: string;            // Event Bus topic to publish on transition (e.g., 'expense.approved')
}

export interface WorkflowDefinition {
  id: string;                       // e.g., 'WORKFLOW_EXPENSE_APPROVAL'
  version: string;
  description: string;
  entityCollection: string;         // e.g., 'expenses'
  initialState: WorkflowState;
  transitions: WorkflowTransition[];
}

export interface WorkflowInstance {
  workflowId: string;
  entityId: string;
  currentState: WorkflowState;
  history: Array<{
    fromState: WorkflowState;
    toState: WorkflowState;
    userId: string;
    userRole: string;
    timestamp: Date;
    reason?: string;
  }>;
}

// ──────────────────────────────────────────────
// PLUGIN ARCHITECTURE TYPES (v2.1 Patch A.3)
// Every future business vertical is a Plugin, not a fork of the Core.
// Core Platform (Fuel Sales, Shift Wizard, Ledgers) is Plugin #1 by this same definition.
// ──────────────────────────────────────────────

export interface PluginDefinition {
  businessType: string;             // e.g., 'fuel', 'lube', 'carwash', 'ev_charging'
  registerDefinitions: Array<{
    engineType: string;
    title: string;
    titleUr: string;
    queryPlan: QueryPlan;
    columns: RegisterColumnDef[];
    defaultSortColumn?: string;
    defaultSortDirection?: 'asc' | 'desc';
    summaryFields?: string[];
  }>;
  formulaDefinitions: string[];    // Formula IDs this plugin provides
  ruleDefinitions: string[];       // Rule IDs this plugin provides
  reportConfigs: string[];         // Report IDs this plugin provides
}

// ──────────────────────────────────────────────
// DRILLDOWN ENGINE TYPES (Phase 9 C.1 Step 8)
// Reads a report's dependencies array and auto-builds Level 2/3 navigation.
// Never more than 3 levels deep (per PRD §1.3).
// ──────────────────────────────────────────────

export interface DrilldownLevel {
  level: 1 | 2 | 3;
  reportId: string;
  title: string;
  titleUr: string;
  filterContext?: Record<string, any>;  // Filters passed from parent level
  childReportIds?: string[];            // Report IDs for the next drilldown level
}

export interface DrilldownPath {
  levels: DrilldownLevel[];
  currentLevel: 1 | 2 | 3;
}

// ──────────────────────────────────────────────
// REPORT CONFIG TYPES (Phase 9 C.1 Step 10)
// The metadata document that defines a report — zero code, pure configuration.
// A new report can be added by writing this document alone.
// ──────────────────────────────────────────────

export interface ReportKPIConfig {
  id: string;
  label: string;
  labelUr: string;
  formulaId?: string;              // If computed via Formula Engine
  displayType: KPIDisplayType;
  unit: string;
  drilldownReportId?: string;
}

export interface ReportChartConfig {
  id: string;
  chartType: ChartType;
  title: string;
  titleUr: string;
  xKey: string;
  yKeys: string[];
  colors?: string[];
}

// ──────────────────────────────────────────────
// ENTERPRISE RULE #129 — CONTEXT-AWARE BUSINESS CENTER
// Every report defines its own search, filters, quick actions, and saved views.
// The UI framework (shell) is shared. Business content is report-driven.
// Fuel Sales ≠ Customer Ledger ≠ Expenses ≠ Inventory
// ──────────────────────────────────────────────

export interface FilterGroupOption {
  value: string;
  label: string;
  labelUr: string;
  icon?: string;
}

export interface FilterGroupConfig {
  id: string;
  label: string;
  labelUr: string;
  /** 'pills' = row of toggle buttons; 'radio' = single select; 'checkbox' = multi-select */
  type: 'pills' | 'radio' | 'checkbox';
  /** 'static' = options listed in config; 'dynamic' = resolved from register rows at runtime */
  source?: 'static' | 'dynamic';
  /** Static options — leave empty if source='dynamic' */
  options: FilterGroupOption[];
  /** For dynamic: which register column to extract unique values from */
  dynamicColumn?: string;
}

export interface QuickActionConfig {
  id: string;
  label: string;
  labelUr: string;
  icon: string;
  targetReportId?: string;
  color: 'emerald' | 'orange' | 'blue' | 'purple' | 'teal' | 'red' | 'slate';
}

export interface SavedView {
  id: string;
  label: string;
  labelUr: string;
  icon?: string;
  filters: Record<string, string>;
  datePreset: string;
  isDefault?: boolean;
}

export interface ReportSearchConfig {
  /** Context-aware placeholder — shown in the search input */
  placeholder: string;
  placeholderUr: string;
  /** Which register column accessors to search across */
  searchFields: string[];
}

export interface ReportConfig {
  reportId: string;
  engineType: ReportEngineType;
  rendererProfile: RendererProfile;
  title: string;
  titleUr: string;
  queryPlan: QueryPlan;
  cacheTier: 'realtime' | 'cached' | 'snapshot';
  visibleTo: string[];              // RBAC roles that can see this report
  kpis?: ReportKPIConfig[];
  charts?: ReportChartConfig[];
  register?: {
    columns: RegisterColumnDef[];
    defaultSortColumn?: string;
    defaultSortDirection?: 'asc' | 'desc';
    summaryFields?: string[];
  };
  rules?: Array<{ ruleId: string; appliesTo: string }>;  // appliesTo = KPI id or 'register'
  dependencies?: string[];          // Report IDs for drilldown (Level 2/3)
  exports: string[];                // ['pdf', 'excel', 'csv', 'print']
  performanceBudgetMs: number;      // SLA for this report

  // ── Enterprise Rule #129 — Context-Aware Business Center ──
  /** Context-aware search config — placeholder and fields differ per report */
  searchConfig?: ReportSearchConfig;
  /** Context-aware filter groups — rendered inside AdvancedFiltersPanel */
  filterGroups?: FilterGroupConfig[];
  /** Context-aware quick action buttons — rendered in the Quick Actions bar */
  quickActions?: QuickActionConfig[];
  /** User-saved filter presets for this report — persisted in localStorage */
  defaultSavedViews?: SavedView[];
}

// ──────────────────────────────────────────────
// MASTER REPORT RESULT — Output of Report Engine
// ──────────────────────────────────────────────

export interface ReportEngineResult {
  reportId: string;
  engineType: ReportEngineType;
  rendererProfile: RendererProfile;  // v2.1 Patch A.5 — visual layout profile
  executedAt: Date;
  totalExecutionTimeMs: number;

  // Sections — each engine populates its own
  kpis: KPIResult[];
  charts: ChartResult[];
  register: RegisterResult | null;
  timeline: TimelineResult | null;
  alerts: AlertResult[];
  rules: RuleResult[];              // v2.1 — Rule Engine results
  drilldown?: DrilldownPath;        // v2.1 — Drilldown Engine navigation

  // Data quality
  dataQuality: 'VERIFIED' | 'PARTIAL' | 'EMPTY' | 'ERROR';
  errorMessage?: string;
  aiSummary?: string;
}
