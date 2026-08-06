/**
 * FuelPro Enterprise — Data Quality Engine (PRD v6.1 A.5)
 *
 * Scans operational records to find anomalies, missing linkages,
 * and negative balances. Feeds the ANL-06 dashboard.
 */

import { FirestoreAdapter } from '../../repositories/adapters/FirestoreAdapter';
import { FormulaRegistry } from '../../lib/reports-v2/engines/FormulaRegistry';
import { ReportRegistry } from '../../lib/reports-v2/registry/reportRegistry';
import { logger } from '../../lib/logger';

export interface DataQualityCheckResult {
  checkId: string;
  name: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  affectedRecords: number;
  details: { id: string; msg: string; context: any }[];
  lastRun: string;
}

class DataQualityEngineImpl {
  /**
   * Run the full suite of Data Quality checks (A.5)
   */
  async runAllChecks(stationId: string, orgId: string): Promise<DataQualityCheckResult[]> {
    logger.info(`[DataQualityEngine] Starting full sweep for station ${stationId}`);
    
    const results: DataQualityCheckResult[] = [];
    const now = new Date().toISOString();
    
    results.push(await this._checkMissingReadings(stationId, orgId, now));
    results.push(await this._checkNegativeStock(stationId, orgId, now));
    results.push(this._checkOrphanFormulas(now));
    
    return results;
  }

  /**
   * DQ_MISSING_READING: Scans shifts for missing closing readings.
   */
  private async _checkMissingReadings(stationId: string, orgId: string, timestamp: string): Promise<DataQualityCheckResult> {
    const details: any[] = [];
    try {
      const result: any = await FirestoreAdapter.fetchDocuments('shifts', { stationId, orgId });
      
      for (const shift of result.documents) {
        if (shift.status === 'closed') {
          // Check if any nozzles used in opening don't have closing
          const opens = Object.keys(shift.openingReadings || {});
          for (const nz of opens) {
            if (shift.closingReadings?.[nz] === undefined) {
              details.push({
                id: shift.id,
                msg: `Shift ${shift.id} (closed) is missing closing reading for nozzle ${nz}`,
                context: { date: shift.date }
              });
            }
          }
        }
      }
    } catch (err) {
      logger.error('[DataQualityEngine] Error in _checkMissingReadings:', err);
    }

    return {
      checkId: 'DQ_MISSING_READING',
      name: 'Missing Closing Readings',
      description: 'Finds closed shifts that lack a closing reading for an active nozzle.',
      severity: 'HIGH',
      affectedRecords: details.length,
      details,
      lastRun: timestamp
    };
  }

  /**
   * DQ_NEGATIVE_STOCK: Scans tanks for negative currentStock.
   */
  private async _checkNegativeStock(stationId: string, orgId: string, timestamp: string): Promise<DataQualityCheckResult> {
    const details: any[] = [];
    try {
      const result: any = await FirestoreAdapter.fetchDocuments('tanks', { stationId, orgId });
      
      for (const tank of result.documents) {
        const stock = Number(tank.currentStock) || 0;
        if (stock < 0) {
          details.push({
            id: tank.id,
            msg: `Tank ${tank.name || tank.id} has negative stock: ${stock}L`,
            context: { currentStock: stock, capacity: tank.capacity }
          });
        }
      }
    } catch (err) {
      logger.error('[DataQualityEngine] Error in _checkNegativeStock:', err);
    }

    return {
      checkId: 'DQ_NEGATIVE_STOCK',
      name: 'Negative Tank Stock',
      description: 'Identifies tanks where current inventory level has dropped below zero.',
      severity: 'HIGH',
      affectedRecords: details.length,
      details,
      lastRun: timestamp
    };
  }

  /**
   * DQ_ORPHAN_FORMULA: Scans report manifests for formula_ids not in FormulaRegistry.
   */
  private _checkOrphanFormulas(timestamp: string): DataQualityCheckResult {
    const details: any[] = [];
    
    try {
      // Get all registered formulas
      const allFormulas = new Set(FormulaRegistry.getAllFormulaIds());
      
      // Get all reports
      const reports = ReportRegistry.searchReports('');
      
      for (const r of reports) {
        if (r.formulaIds) {
          for (const fId of r.formulaIds) {
            if (!allFormulas.has(fId)) {
              details.push({
                id: r.id,
                msg: `Report ${r.id} references undefined formula: ${fId}`,
                context: { reportName: r.simpleNameEn }
              });
            }
          }
        }
      }
    } catch (err) {
      logger.error('[DataQualityEngine] Error in _checkOrphanFormulas:', err);
    }

    return {
      checkId: 'DQ_ORPHAN_FORMULA',
      name: 'Orphan Formulas',
      description: 'Detects reports mapped to formula IDs that do not exist in the Formula Registry.',
      severity: 'MEDIUM',
      affectedRecords: details.length,
      details,
      lastRun: timestamp
    };
  }
}

export const DataQualityEngine = new DataQualityEngineImpl();
