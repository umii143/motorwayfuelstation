/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP - Query Engine & Execution Planner
 * 100% Live Firebase Operational Database Driven
 */

import { collection, getDocs, query } from 'firebase/firestore';
import { dbFS } from '../../../firebase';
import { SemanticLayer } from '../metrics/semanticLayer';
import { FormulaRegistry } from '../formulas/formulaRegistry';
import { DataQualityEngine } from '../verification/dataQuality';
import { AuditMetadataManager } from '../../foundation/security/auditMetadata';
import { DataQualityScore, MetricProvenance, ReportContext } from '../shared/types';

export interface ExecutionResult {
  metricId: string;
  value: number;
  quality: DataQualityScore;
  provenance: MetricProvenance;
}

export class EBIPQueryEngine {
  private semanticLayer = SemanticLayer.getInstance();
  private formulaRegistry = FormulaRegistry.getInstance();

  /**
   * Executes a metric calculation using 100% Live Firebase Data
   */
  public async executeMetric(metricId: string, context: ReportContext, dateRange?: { start: Date, end: Date }): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // 1. Resolve Semantic Layer
    const metricDef = this.semanticLayer.resolveMetric(metricId);
    
    if (!context.orgId || !context.stationId) {
      throw new Error('[EBIP Query Engine] Missing orgId or stationId in context.');
    }

    // 2. Execution Planner & Fetching (Real Firebase Data)
    const inputs: Record<string, any[]> = {};
    const sourceRefs: string[] = [];
    
    // Fetch every dependency required by the metric
    for (const collectionName of metricDef.requiredCollections) {
      const colRef = collection(dbFS, 'organizations', context.orgId, 'stations', context.stationId, collectionName);
      const snapshot = await getDocs(query(colRef));
      const records: Record<string, any>[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Client-side, schema-tolerant date filtering (timestamp || date ||
      // createdAt) — the same tolerant pattern as the main QueryEngine, so a
      // document using 'date' instead of 'timestamp' is never silently dropped.
      let filtered = records;
      if (dateRange) {
        const from = dateRange.start.getTime();
        const to = dateRange.end.getTime();
        filtered = records.filter(doc => {
          const raw = doc.timestamp || doc.date || doc.createdAt || doc.updatedAt;
          if (!raw) return true; // no date field — best-effort filter keeps it
          const t = raw instanceof Date ? raw.getTime() : new Date(raw).getTime();
          if (!Number.isFinite(t)) return true;
          return t >= from && t <= to;
        });
      }

      inputs[collectionName] = filtered;
      sourceRefs.push(`organizations/${context.orgId}/stations/${context.stationId}/${collectionName} (${filtered.length} records)`);
    }
    
    // 3. Data Quality Validation (Evaluates the primary collection)
    const primaryCollection = metricDef.requiredCollections[0] || 'unknown';
    const quality = DataQualityEngine.evaluateDataset(primaryCollection, inputs[primaryCollection] || []);
    
    // 4. Formula Execution
    const value = this.formulaRegistry.executeFormula(metricDef.formulaId, inputs);
    
    const executionTimeMs = Date.now() - startTime;

    // 5. Deterministic SHA-256 provenance — same inputs always produce the
    // same hash (Rule #51/#125). Never a timestamp-based pseudo-hash.
    const canonicalPayload = JSON.stringify({
      metricId,
      orgId: context.orgId,
      stationId: context.stationId,
      role: context.role,
      formulaId: metricDef.formulaId,
      formulaVersion: this.formulaRegistry.getFormulaVersion(metricDef.formulaId),
      records: inputs,
      dateRange: dateRange ? { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } : null
    });
    const hash = await AuditMetadataManager.generateHash(canonicalPayload);
    
    return {
      metricId,
      value,
      quality,
      provenance: {
        hash,
        formulaVersion: this.formulaRegistry.getFormulaVersion(metricDef.formulaId),
        executionTimeMs,
        sources: sourceRefs,
        generatedAt: new Date().toISOString()
      }
    };
  }
}
