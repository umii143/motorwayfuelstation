/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP - Data Quality Engine
 * Calculates confidence scores for reports based on missing data or conflicts.
 */

import { DataQualityScore } from '../shared/types';

export class DataQualityEngine {
  
  /**
   * Scans a dataset and returns a Data Quality Score
   */
  public static evaluateDataset(datasetName: string, records: any[]): DataQualityScore {
    if (!records || records.length === 0) {
      return {
        percentage: 0,
        status: 'MISSING_DATA',
        issues: [`No records found in ${datasetName}`]
      };
    }

    let issues: string[] = [];
    let score = 100;

    // Example generic checks (in production this would use strict schemas)
    const nulls = records.filter(r => Object.values(r).some(v => v === null || v === undefined));
    if (nulls.length > 0) {
      score -= (nulls.length / records.length) * 100;
      issues.push(`${nulls.length} records contain null/undefined values.`);
    }

    let status: DataQualityScore['status'] = 'COMPLETE';
    if (score < 100) status = 'MISSING_DATA';
    if (score < 50) status = 'CONFLICT';

    return {
      percentage: Math.max(0, Math.round(score * 10) / 10),
      status,
      issues
    };
  }
}
