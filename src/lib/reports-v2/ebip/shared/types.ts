/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP (Enterprise Business Intelligence Platform)
 * Shared Enterprise Types & Primitives
 */

export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'GBP';
export type UnitOfMeasure = 'Liters' | 'Gallons' | 'Pieces' | 'Amount' | 'Percentage' | 'Count';

export interface EnterpriseTimestamp {
  iso: string;
  unixMs: number;
}

export type PermissionLevel = 'OWNER' | 'MANAGER' | 'CASHIER' | 'AUDITOR';

export interface ReportContext {
  userId: string;
  role: PermissionLevel;
  branchId?: string;
  stationId: string;
  orgId: string;
}

export interface MetricProvenance {
  hash: string;
  formulaVersion: string;
  executionTimeMs: number;
  sources: string[]; // e.g. ['sales/inv-101', 'shifts/s-05']
  generatedAt: string;
}

export interface ExplainabilityData {
  why: string;
  how: string;
  dependencies: string[];
}

export interface DataQualityScore {
  percentage: number;
  status: 'COMPLETE' | 'MISSING_DATA' | 'UNBALANCED' | 'CONFLICT';
  issues: string[];
}
