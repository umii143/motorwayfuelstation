/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP - Report Manifest Core
 * Every report in the system MUST implement this interface.
 */

import { PermissionLevel } from '../shared/types';

export type ReportVersion = string;

export interface EBIPFilterConfig {
  type: 'DATE_RANGE' | 'SINGLE_DATE' | 'BRANCH' | 'SHIFT' | 'PUMP' | 'TANK';
  required: boolean;
  defaultValue?: any;
}

export interface EBIPMetricRef {
  metricId: string;
  displayAs: 'KPI_CARD' | 'CHART_BAR' | 'CHART_LINE' | 'TABLE_COLUMN';
}

export interface EBIPSection {
  id: string;
  titleEn: string;
  titleUr: string;
  requiredPermissions: PermissionLevel[];
  metrics: EBIPMetricRef[];
}

export interface EnterpriseReportManifest {
  // 1. Identity
  id: string; // e.g. 'R-01'
  version: ReportVersion;
  schemaVersion: number;
  
  // 2. Security
  requiredPermissions: PermissionLevel[];
  
  // 3. Inputs
  filters: EBIPFilterConfig[];
  
  // 4. Output Architecture (Semantic UI mapping)
  sections: EBIPSection[];
  
  // 5. Exports
  supportedExports: ('PDF' | 'EXCEL' | 'CSV' | 'JSON')[];
}
