/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP - Explainability Engine
 * Provides the "Why" and "How" for any rendered metric.
 */

import { MetricProvenance, ExplainabilityData } from '../shared/types';

export class ExplainabilityEngine {
  
  public static generateExplanation(
    metricId: string, 
    value: number, 
    provenance: MetricProvenance
  ): ExplainabilityData {
    
    // In a full implementation, this might call a local LLM or rule-engine 
    // to map the metricId and value into a human readable string.
    
    return {
      why: `This metric represents the aggregated output for ${metricId} derived from ${provenance.sources.length} sources.`,
      how: `Calculated using Formula v${provenance.formulaVersion} executed in ${provenance.executionTimeMs}ms.`,
      dependencies: provenance.sources
    };
  }
}
