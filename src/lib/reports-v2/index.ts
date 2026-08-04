/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Platform Index
 *
 * Clean barrel export for the entire Enterprise Reports Platform.
 * Phase 1: Infrastructure only.
 */

// Types
export type {
  IntelligenceLayerId,
  IntelligenceLayerDefinition,
  ReportLifecycleState,
  RBACRole,
  FirestoreCollection,
  ExportFormat,
  DrilldownTarget,
  CertificationStatus,
  CertificationChecks,
  CertificationResult,
  PerformanceBudget,
  DateRange,
  ReportFilters,
  ReportExecutionContext,
  KPIDefinition,
  ChartDefinition,
  RegisterColumnDefinition,
  EnterpriseReportManifest,
  FormulaDefinition,
  FormulaExecutionResult,
  QueryPlan,
  QueryExecutionStats,
  QueryResult,
  ReportDataRow,
  BusinessRule,
  BusinessRuleType,
  BusinessRuleSeverity,
  BusinessRuleResult,
  ReportRecommendation,
  ExplainabilityTrace,
  AuditRecord,
  ReportExecutionResult,
  WorkspaceState,
  PlatformHealthStatus
} from './types/enterpriseReportTypes';

// Manifest
export { ManifestRegistry } from './manifest/manifestRegistry';

// Registries
export { LayerRegistry } from './registry/layerRegistry';
export { ReportRegistry } from './registry/reportRegistry';
