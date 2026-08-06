/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Core Domain Types
 *
 * This file is the SINGLE SOURCE OF TRUTH for all type definitions
 * used across the Enterprise Reports Platform.
 *
 * Rule #125: Every report must be generated from the Enterprise Report Manifest.
 * Rule #84: Zero inline calculations in React UI components.
 * Rule #93: Full data lineage traceability.
 */

// ============================================================
// INTELLIGENCE LAYERS
// ============================================================

export type IntelligenceLayerId =
  | 'executive'
  | 'fuel_operations'
  | 'wet_stock'
  | 'financial'
  | 'banking'
  | 'staff'
  | 'supplier'
  | 'customer'
  | 'fleet'
  | 'risk'
  | 'forecast'
  | 'audit'
  | 'valuation'
  | 'tax'
  | 'multi_branch';

export interface IntelligenceLayerDefinition {
  readonly id: IntelligenceLayerId;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly layerNumber: number;
  readonly iconName: string;
  readonly emoji: string;
  readonly descriptionEn: string;
  readonly descriptionUr: string;
  readonly isEnabled: boolean;
}

// ============================================================
// REPORT LIFECYCLE
// ============================================================

export type ReportLifecycleState =
  | 'IDLE'
  | 'LOADING'
  | 'EXECUTING'
  | 'VERIFIED'
  | 'ERROR'
  | 'NO_DATA'
  | 'OFFLINE'
  | 'PERMISSION_DENIED';

// ============================================================
// RBAC
// ============================================================

export type RBACRole = 'owner' | 'admin' | 'manager' | 'supervisor' | 'cashier' | 'staff';

// ============================================================
// FIREBASE COLLECTIONS
// ============================================================

export type FirestoreCollection =
  | 'sales'
  | 'shifts'
  | 'inventory'
  | 'inventoryMovements'
  | 'purchases'
  | 'expenses'
  | 'ledger'
  | 'wallets'
  | 'tanks'
  | 'banks'
  | 'customers'
  | 'suppliers'
  | 'staff'
  | 'audit_logs'
  | 'lubePosSales'
  | 'stockTransactions'
  | 'rateHistory'
  | 'digitalAccounts'
  | 'nozzles'
  | 'pumps';

// ============================================================
// EXPORT FORMATS
// ============================================================

export type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json' | 'print' | 'whatsapp' | 'email';

// ============================================================
// DRILLDOWN
// ============================================================

export type DrilldownTarget =
  | 'invoice'
  | 'receipt'
  | 'journal'
  | 'audit'
  | 'shift'
  | 'tank'
  | 'pump'
  | 'nozzle'
  | 'inventory'
  | 'voucher'
  | 'firebase_doc';

// ============================================================
// CERTIFICATION
// ============================================================

export type CertificationStatus = 'DRAFT' | 'VERIFIED' | 'CERTIFIED' | 'PRODUCTION';

export interface CertificationChecks {
  readonly realtimeSync: boolean;
  readonly formulaIntegrity: boolean;
  readonly auditProvenance: boolean;
  readonly printCapability: boolean;
  readonly exportCapability: boolean;
  readonly aiSupport: boolean;
  readonly performanceBudget: boolean;
  readonly permissionSecured: boolean;
  readonly drilldownPathVerified: boolean;
  readonly traceabilityValid: boolean;
  readonly accessibilityPassed: boolean;
  readonly responsiveLayout: boolean;
}

export interface CertificationResult {
  readonly manifestId: string;
  readonly isCertified: boolean;
  readonly score: number;
  readonly checks: CertificationChecks;
  readonly certifiedAt: string | null;
  readonly certifiedBy: string | null;
}

// ============================================================
// PERFORMANCE BUDGET
// ============================================================

export interface PerformanceBudget {
  readonly maxReads: number;
  readonly maxLatencyMs: number;
  readonly maxMemoryMb?: number;
}

// ============================================================
// DATE RANGE
// ============================================================

export interface DateRange {
  readonly startDate: string;
  readonly endDate: string;
  readonly preset?: string;
}

// ============================================================
// REPORT FILTERS
// ============================================================

export interface ReportFilters {
  readonly dateRange: DateRange;
  readonly stationId?: string;
  readonly staffId?: string;
  readonly productId?: string;
  readonly paymentMode?: string;
  readonly shiftId?: string;
  readonly customerId?: string;
  readonly supplierId?: string;
  readonly tankId?: string;
  readonly [key: string]: unknown;
}

// ============================================================
// REPORT EXECUTION CONTEXT
// ============================================================

export interface ReportExecutionContext {
  readonly executionId: string;
  readonly stationId: string;
  readonly branchId: string;
  readonly fiscalYear: string;
  readonly dateRange: DateRange;
  readonly timezone: string;
  readonly userId: string;
  readonly userName: string;
  readonly role: RBACRole;
  readonly filters: ReportFilters;
  readonly requestedAt: string;
}

// ============================================================
// KPI CONFIGURATION
// ============================================================

export interface KPIDefinition {
  readonly id: string;
  readonly labelEn: string;
  readonly labelUr: string;
  readonly metricKey: string;
  readonly formulaId: string;
  readonly sourceCollections: FirestoreCollection[];
  readonly isCurrency?: boolean;
  readonly prefix?: string;
  readonly suffix?: string;
}

// ============================================================
// CHART CONFIGURATION
// ============================================================

export interface ChartDefinition {
  readonly id: string;
  readonly titleEn: string;
  readonly titleUr: string;
  readonly type: 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'scatter';
  readonly dataKeyX: string;
  readonly dataKeyY: string;
}

// ============================================================
// REGISTER COLUMN CONFIGURATION
// ============================================================

export interface RegisterColumnDefinition {
  readonly key: string;
  readonly labelEn: string;
  readonly labelUr: string;
  readonly isNumeric?: boolean;
  readonly isCurrency?: boolean;
  readonly isSortable?: boolean;
  readonly isFilterable?: boolean;
  readonly width?: string;
}

// ============================================================
// ENTERPRISE REPORT MANIFEST
// ============================================================

export interface EnterpriseReportManifest {
  readonly id: string;
  readonly layer: IntelligenceLayerId;
  readonly simpleNameEn: string;
  readonly simpleNameUr: string;
  readonly enterpriseNameEn: string;
  readonly enterpriseNameUr: string;
  readonly descriptionEn: string;
  readonly descriptionUr: string;

  // Data Dependencies
  readonly collections: FirestoreCollection[];
  readonly formulaIds: string[];
  readonly requiredPermissions: RBACRole[];

  // Architectural Metadata (PRD v6.1 A.9)
  readonly parentWorkspace?: string;
  readonly healthMonitored?: boolean;
  readonly dataQualityChecks?: string[];
  readonly apiVersion?: string;

  // UI Definitions
  readonly kpis: KPIDefinition[];
  readonly charts: ChartDefinition[];
  readonly registerColumns: RegisterColumnDefinition[];
  readonly exports: ExportFormat[];
  readonly drilldownPath: DrilldownTarget[];
  readonly aiCapabilities: string[];

  // Metadata
  readonly isRealtime: boolean;
  readonly version: string;
  readonly certificationStatus: CertificationStatus;
  readonly readinessScore: number;
  readonly performanceBudget?: PerformanceBudget;

  // Display
  readonly displayMode: 'simple' | 'advanced' | 'both';
  readonly tags: string[];
  readonly relatedReports: string[];
}

// ============================================================
// FORMULA SYSTEM
// ============================================================

export interface FormulaDefinition {
  readonly id: string;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly description: string;
  readonly formula: string;
  readonly inputKeys: string[];
  readonly outputKey: string;
  readonly sourceCollections: FirestoreCollection[];
  readonly category: 'financial' | 'petroleum' | 'inventory' | 'operational' | 'compliance';
}

export interface FormulaExecutionResult {
  readonly formulaId: string;
  readonly inputs: Record<string, number>;
  readonly output: number;
  readonly intermediates: Record<string, number>;
  readonly executedAt: string;
  readonly executionTimeMs: number;
  readonly auditHash: string;
}

// ============================================================
// QUERY SYSTEM
// ============================================================

export interface QueryPlan {
  readonly reportId: string;
  readonly collections: FirestoreCollection[];
  readonly filters: ReportFilters;
  readonly indexesRequired: string[];
  readonly estimatedReads: number;
  readonly strategy: 'LIVE' | 'CACHE' | 'HYBRID';
  readonly cacheTTLMs: number;
}

export interface QueryExecutionStats {
  readonly reads: number;
  readonly latencyMs: number;
  readonly cacheHit: boolean;
  readonly indexesUsed: string[];
}

export interface QueryResult {
  readonly reportId: string;
  readonly rows: ReportDataRow[];
  readonly totalAmount: number;
  readonly totalVolume: number;
  readonly recordCount: number;
  readonly stats: QueryExecutionStats;
  readonly isRealtime: boolean;
  readonly fetchedAt: string;
}

export interface ReportDataRow {
  readonly id: string;
  readonly date: string;
  readonly time: string;
  readonly staffId?: string;
  readonly staffName?: string;
  readonly sourceRef: string;
  readonly productCategory: string;
  readonly quantity: number;
  readonly rate: number;
  readonly amount: number;
  readonly approvalStatus: string;
  readonly paymentMode?: string;
  readonly shiftType?: string;
  readonly productId?: string;
  readonly entityName?: string;
  readonly [key: string]: unknown;
}

// ============================================================
// BUSINESS RULES
// ============================================================

export type BusinessRuleType = 'VALIDATION' | 'TRANSFORMATION' | 'ENRICHMENT' | 'ALERT' | 'THRESHOLD';

export type BusinessRuleSeverity = 'INFO' | 'WARNING' | 'ACTION_REQUIRED' | 'CRITICAL';

export interface BusinessRule {
  readonly id: string;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly type: BusinessRuleType;
  readonly severity: BusinessRuleSeverity;
  readonly applicableCollections: FirestoreCollection[];
  readonly condition: (row: ReportDataRow, context: ReportExecutionContext) => boolean;
  readonly action: (row: ReportDataRow, context: ReportExecutionContext) => ReportDataRow;
  readonly description: string;
  readonly isEnabled: boolean;
}

export interface BusinessRuleResult {
  readonly ruleId: string;
  readonly triggered: boolean;
  readonly severity: BusinessRuleSeverity;
  readonly message: string;
  readonly affectedRows: number;
}

// ============================================================
// DECISION ENGINE
// ============================================================

export interface ReportRecommendation {
  readonly id: string;
  readonly titleEn: string;
  readonly titleUr: string;
  readonly descriptionEn: string;
  readonly descriptionUr: string;
  readonly actionId: string;
  readonly severity: BusinessRuleSeverity;
  readonly sourceReportId: string;
  readonly sourceDataRef: string;
  readonly confidence: number;
}

// ============================================================
// EXPLAINABILITY
// ============================================================

export interface ExplainabilityTrace {
  readonly metricId: string;
  readonly metricName: string;
  readonly value: number;
  readonly formulaUsed: string;
  readonly formulaId: string;
  readonly sourceCollections: FirestoreCollection[];
  readonly inputValues: Record<string, number>;
  readonly intermediateSteps: { step: string; value: number }[];
  readonly firebaseDocRefs: string[];
  readonly journalEntriesLinked: number;
  readonly verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'PARTIAL';
  readonly humanReadableEn: string;
  readonly humanReadableUr: string;
  readonly generatedAt: string;
}

// ============================================================
// AUDIT
// ============================================================

export interface AuditRecord {
  readonly executionId: string;
  readonly reportId: string;
  readonly userId: string;
  readonly userRole: RBACRole;
  readonly stationId: string;
  readonly filterSnapshot: ReportFilters;
  readonly resultHash: string;
  readonly recordCount: number;
  readonly executionTimeMs: number;
  readonly timestamp: string;
  readonly action: 'EXECUTE' | 'EXPORT' | 'PRINT' | 'DRILLDOWN' | 'FILTER_CHANGE';
}

// ============================================================
// REPORT EXECUTION RESULT
// ============================================================

export interface ReportExecutionResult {
  readonly executionId: string;
  readonly reportId: string;
  readonly manifest: EnterpriseReportManifest;
  readonly context: ReportExecutionContext;
  readonly queryResult: QueryResult;
  readonly formulaResults: FormulaExecutionResult[];
  readonly ruleResults: BusinessRuleResult[];
  readonly recommendations: ReportRecommendation[];
  readonly certification: CertificationResult;
  readonly auditRecord: AuditRecord;
  readonly lifecycleState: ReportLifecycleState;
  readonly executionTimeMs: number;
}

// ============================================================
// WORKSPACE STATE
// ============================================================

export interface WorkspaceState {
  readonly selectedLayerId: IntelligenceLayerId | null;
  readonly selectedReportId: string | null;
  readonly filters: ReportFilters;
  readonly lifecycleState: ReportLifecycleState;
  readonly lastExecution: ReportExecutionResult | null;
  readonly isFilterPanelOpen: boolean;
  readonly isNavTreeCollapsed: boolean;
}

// ============================================================
// PLATFORM STATUS
// ============================================================

export interface PlatformHealthStatus {
  readonly registryLoaded: boolean;
  readonly registryReportCount: number;
  readonly layerCount: number;
  readonly formulaCount: number;
  readonly ruleCount: number;
  readonly queryEngineReady: boolean;
  readonly auditEngineReady: boolean;
  readonly databaseConnected: boolean;
  readonly lastSyncTimestamp: string | null;
  readonly platformVersion: string;
}
