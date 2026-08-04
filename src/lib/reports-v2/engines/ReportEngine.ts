/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Report Engine — Master Orchestrator
 *
 * Given registerReport({ id: "R001", engine: "BusinessDashboard" }),
 * the Report Engine calls all sub-engines and assembles the final result.
 *
 * This is the ONLY entry point for report execution.
 * No UI component calls sub-engines directly.
 */

import { QueryContext, ReportEngineResult, ReportEngineType } from './types';
import { KPIEngine } from './KPIEngine';
import { ChartEngine } from './ChartEngine';
import { RegisterEngine } from './RegisterEngine';
import { ReportConfigLoader } from './ReportConfigLoader';

export class ReportEngine {
  private static instance: ReportEngine;
  private kpiEngine: KPIEngine;
  private chartEngine: ChartEngine;
  private registerEngine: RegisterEngine;
  private configLoader: ReportConfigLoader;

  private constructor() {
    this.kpiEngine = KPIEngine.getInstance();
    this.chartEngine = ChartEngine.getInstance();
    this.registerEngine = RegisterEngine.getInstance();
    this.configLoader = ReportConfigLoader.getInstance();
  }

  static getInstance(): ReportEngine {
    if (!ReportEngine.instance) {
      ReportEngine.instance = new ReportEngine();
    }
    return ReportEngine.instance;
  }

  /**
   * Executes a complete report.
   * This is the ONLY method the UI ever calls.
   *
   * @param reportId - The report identifier (e.g., "A-001")
   * @param engineType - The engine type (e.g., "BusinessDashboard")
   * @param context - Query context with org, station, dates, filters
   * @param options - Optional execution options (useArchive for Rule #92 replays)
   * @returns Complete ReportEngineResult ready for rendering
   */
  async execute(reportId: string, engineType: string, context: QueryContext, options?: { useArchive?: boolean }): Promise<ReportEngineResult> {
    const startTime = performance.now();
    const useArchive = options?.useArchive === true;

    try {
      // Execute all sub-engines in parallel
      const [kpis, charts, register] = await Promise.all([
        this.kpiEngine.resolveKPIs(engineType, context, useArchive),
        this.chartEngine.resolveCharts(engineType, context, useArchive),
        this.registerEngine.resolveRegister(engineType, context, useArchive)
      ]);

      const totalExecutionTimeMs = Math.round(performance.now() - startTime);

      // Determine data quality
      const hasKPIData = kpis.some(k => typeof k.value === 'number' ? k.value !== 0 : k.value !== '');
      const hasRegisterData = register ? register.rows.length > 0 : false;
      const dataQuality = hasKPIData || hasRegisterData ? 'VERIFIED' : 'EMPTY';

      return {
        reportId,
        engineType: engineType as ReportEngineType,
        rendererProfile: 'Executive',  // v2.1 — default for backward compatibility
        executedAt: new Date(),
        totalExecutionTimeMs,
        kpis,
        charts,
        register,
        timeline: null,     // Timeline Engine — Phase 3.2
        alerts: [],          // Alert Engine — Phase 3.2
        rules: [],           // v2.1 — Rule Engine results (populated by config-driven path)
        dataQuality,
      };
    } catch (error: any) {
      console.error(`[ReportEngine] Failed to execute ${reportId}:`, error);
      return {
        reportId,
        engineType: engineType as ReportEngineType,
        rendererProfile: 'Executive',  // v2.1 — default for backward compatibility
        executedAt: new Date(),
        totalExecutionTimeMs: Math.round(performance.now() - startTime),
        kpis: [],
        charts: [],
        register: null,
        timeline: null,
        alerts: [],
        rules: [],
        dataQuality: 'ERROR',
        errorMessage: error.message || 'Report execution failed.'
      };
    }
  }

  /**
   * v2.1 Patch — Executes a report from configuration alone.
   *
   * This is the config-driven path: reads the ReportConfig from the registry,
   * checks permissions, resolves the query plan, computes formulas, evaluates
   * rules, builds drilldown, and assembles the final result.
   *
   * A new report can be added by writing a ReportConfig document alone —
   * zero new TypeScript/React code.
   *
   * @param reportId - The report ID (e.g., 'A', 'P1', 'C2')
   * @param context - Query context with org, station, dates, filters
   * @param options - Optional execution options (useArchive, stationConfig)
   * @returns Complete ReportEngineResult ready for rendering
   */
  async executeFromConfig(
    reportId: string,
    context: QueryContext,
    options?: { useArchive?: boolean; stationConfig?: Record<string, any> }
  ): Promise<ReportEngineResult> {
    return this.configLoader.execute(reportId, context, options);
  }
}
