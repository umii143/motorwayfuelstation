import { PerformanceBudget } from '../registry/types';

export interface QueryExecutionStats {
  reads: number;
  latencyMs: number;
  cacheHit: boolean;
  indexesUsed: string[];
}

export class QueryOptimizer {
  /**
   * Plans the query execution strategy (Cache vs Live vs Cloud Function)
   */
  static planExecution(collection: string, isHistorical: boolean): 'CACHE' | 'LIVE' {
    if (isHistorical) {
      return 'CACHE';
    }
    return 'LIVE';
  }

  /**
   * Evaluates the execution against the performance budget.
   */
  static evaluateBudget(stats: QueryExecutionStats, budget?: PerformanceBudget): { passed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    if (!budget) return { passed: true, warnings };

    if (stats.reads > budget.maxReads) {
      warnings.push(`Reads exceeded budget: ${stats.reads} > ${budget.maxReads}`);
    }
    
    if (stats.latencyMs > budget.maxLatencyMs) {
      warnings.push(`Latency exceeded budget: ${stats.latencyMs}ms > ${budget.maxLatencyMs}ms`);
    }

    return {
      passed: warnings.length === 0,
      warnings
    };
  }
}
