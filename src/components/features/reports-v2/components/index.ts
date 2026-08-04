/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.4 — Enterprise Report Component Library
 *
 * Exposes the 20 universal UI components that will construct all R-01 to R-100 reports.
 * 
 * STRICT RULES:
 * - Zero Firebase queries in these components.
 * - Zero Business Logic / KPI Calculations.
 * - Pure UI, fully responsive, token-based design.
 */

// 1. KPIs & Metrics
export * from './EnterpriseKPICard';
export * from './EnterpriseMetricTile';
export * from './EnterpriseComparisonCard';

// 2. Charts & Registers
export * from './EnterpriseChartContainer';
export * from './EnterpriseRegisterTable';
export * from './EnterpriseEmptyRegister';

// 3. Timeline & Activity
export * from './EnterpriseTimeline';
export * from './EnterpriseActivityFeed';

// 4. Intelligence & AI
export * from './EnterpriseAIInsightCard';
export * from './EnterpriseRecommendationCard';

// 5. Audit & Explainability
export * from './EnterpriseFormulaCard';
export * from './EnterpriseDataSourceCard';
export * from './EnterpriseExplainabilityCard';
export * from './EnterpriseAuditCard';

// 6. Common & Layout
export * from './EnterpriseSummaryPanel';
export * from './EnterpriseAlertCard';
export * from './EnterpriseFilterChips';
export * from './EnterpriseBadgeLibrary';
export * from './EnterpriseSectionHeader';
export * from './EnterpriseCardLayoutSystem';
