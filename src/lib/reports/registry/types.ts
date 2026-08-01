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

export interface DateRange {
  startDate: string;
  endDate: string;
  preset?: string;
}

export interface ReportFilters {
  [key: string]: any;
}

export interface ReportExecutionContext {
  stationId: string;
  branchId: string;
  fiscalYear: string;
  dateRange: DateRange;
  timezone: string;
  currentUser: any; // Using any for now to avoid circular dependency
  role: RBACRole;
  shiftId?: string;
  filters: ReportFilters;
  executionId: string;
}

export interface PerformanceBudget {
  maxReads: number;
  maxLatencyMs: number;
  maxMemoryMb?: number;
}

export type FirestoreCollection =
  | 'sales'
  | 'inventory'
  | 'inventoryMovements'
  | 'purchases'
  | 'expenses'
  | 'ledger'
  | 'wallets'
  | 'tanks'
  | 'shifts'
  | 'banks'
  | 'customers'
  | 'suppliers'
  | 'staff'
  | 'audit_logs';

export type FormulaDependency =
  | 'inventoryMovement'
  | 'grossProfit'
  | 'netProfit'
  | 'apiGravity'
  | 'atc'
  | 'shrinkage'
  | 'fifoValuation'
  | 'variance'
  | 'taxCalculation';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export type DrilldownTarget = 'invoice' | 'receipt' | 'journal' | 'audit' | 'shift' | 'tank' | 'pump' | 'nozzle' | 'inventory';

export type RBACRole = 'owner' | 'manager' | 'supervisor' | 'staff';

export type CertificationStatus = 'Draft' | 'Verified' | 'Certified' | 'Production';

export interface EnterpriseReportManifest {
  id: string;
  title: string;
  description: string;
  layer: IntelligenceLayerId;
  collections: FirestoreCollection[];
  formulaRegistry: FormulaDependency[];
  certified: boolean;
  version: string;
  readinessScore: number; // 0-100
  exports: ExportFormat[];
  drilldown: DrilldownTarget[];
  roles: RBACRole[];
  certificationStatus: CertificationStatus;
  tags?: string[];
  relatedReports?: string[];
  // Sprint 3: Analytics Engine Capabilities
  supportsComparison?: boolean;
  supportsTimeMachine?: boolean;
  supportsForecast?: boolean;
  supportsRootCause?: boolean;
  // Phase 4: EIDE Capabilities
  displayMode?: 'simple' | 'advanced' | 'both';
  simpleName?: string;
  enterpriseName?: string;
  dependencies?: FirestoreCollection[];
  performanceBudget?: PerformanceBudget;
  supportsMultiBranch?: boolean;
  supportsScheduling?: boolean;
}

export interface IntelligenceLayerDef {
  id: IntelligenceLayerId;
  name: string;
  layerNumber: number;
  iconName: string; // Map to Lucide icons at the UI level
  emoji: string;
}
