/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * useReportExecution — React Hook for config-driven report execution
 *
 * Executes a report via ReportConfigLoader and supports realtime updates
 * via QueryPlanResolver.subscribe().
 *
 * Usage:
 *   const { result, loading, error, refetch } = useReportExecution('A', context);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ReportConfigLoader } from '../lib/reports-v2/engines/ReportConfigLoader';
import { QueryPlanResolver } from '../lib/reports-v2/engines/QueryPlanResolver';
import { ReportEngineResult, QueryContext } from '../lib/reports-v2/engines/types';
import '../lib/reports-v2/config/proofReports'; // Auto-register 5 proof reports

export interface UseReportExecutionOptions {
  /** Enable realtime updates via Firestore onSnapshot listener */
  realtime?: boolean;
  /** Station config for rule thresholds */
  stationConfig?: Record<string, any>;
  /** Use archive cache for historical replays (Rule #92) */
  useArchive?: boolean;
}

export function useReportExecution(
  reportId: string,
  context: QueryContext,
  options?: UseReportExecutionOptions
) {
  const [result, setResult] = useState<ReportEngineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const realtime = options?.realtime ?? true;
  const stationConfig = options?.stationConfig;
  const useArchive = options?.useArchive ?? false;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loader = ReportConfigLoader.getInstance();
      const res = await loader.execute(reportId, context, { useArchive, stationConfig });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Report execution failed.');
    } finally {
      setLoading(false);
    }
  }, [reportId, context.orgId, context.stationId, context.userId, context.role,
      useArchive, stationConfig]);

  // Initial execution + re-execute on context change
  useEffect(() => {
    execute();
  }, [execute]);

  // Realtime subscription — re-execute when base collection changes
  useEffect(() => {
    if (!realtime) return;

    const loader = ReportConfigLoader.getInstance();
    const config = loader.getConfig(reportId);
    if (!config) return;

    const planResolver = QueryPlanResolver.getInstance();

    // Subscribe to the report's queryPlan
    // When data changes, re-execute the full report pipeline
    const unsubscribe = planResolver.subscribe(
      config.queryPlan,
      context,
      () => {
        // Data changed — re-execute the report
        execute();
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [realtime, reportId, context.orgId, context.stationId, execute]);

  return { result, loading, error, refetch: execute };
}