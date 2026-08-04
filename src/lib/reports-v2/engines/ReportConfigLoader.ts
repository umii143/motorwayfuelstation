/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Report Config Loader (Phase 9 C.1 Step 10)
 *
 * Reads a reportId's full metadata document (ReportConfig) and orchestrates
 * the entire execution pipeline:
 *
 *   1. Permission check (PermissionEngine)
 *   2. Resolve query (QueryPlanResolver)
 *   3. Execute query (RegisterEngine)
 *   4. Compute formulas (FormulaRegistry)
 *   5. Evaluate rules (RuleEngine)
 *   6. Build drilldown paths (DrilldownEngine)
 *   7. Assemble result (ReportEngineResult)
 *
 * This is the ONLY entry point for config-driven report execution.
 * A new report can be added by writing a ReportConfig document alone —
 * zero new TypeScript/React code.
 *
 * ARCHITECTURAL RULE:
 * No UI. Pure orchestration. Delegates to individual engines.
 */

import { logger } from '../../logger';
import {
  QueryContext,
  ReportConfig,
  ReportEngineResult,
  ReportEngineType,
  RendererProfile,
  KPIResult,
  ChartResult,
  RuleResult,
  ResolvedQueryResult,
} from './types';
import { QueryPlanResolver } from './QueryPlanResolver';
import { RegisterEngine } from './RegisterEngine';
import { RuleEngine } from './RuleEngine';
import { PermissionEngine } from './PermissionEngine';
import { DrilldownEngine } from './DrilldownEngine';
import { FormulaRegistry } from '../ebip/formulas/formulaRegistry';

// ──────────────────────────────────────────────
// REPORT CONFIG REGISTRY
// Code-level registry of ReportConfig documents.
// The 5 proof reports are registered here.
// Future reports can be added by calling register().
// This mirrors what will eventually live in Firestore.
// ──────────────────────────────────────────────

class ReportConfigRegistryImpl {
  private configs: Map<string, ReportConfig> = new Map();

  register(config: ReportConfig): void {
    if (this.configs.has(config.reportId)) {
      logger.warn(`[ReportConfigRegistry] Overwriting existing config: ${config.reportId}`);
    }
    this.configs.set(config.reportId, config);
  }

  get(reportId: string): ReportConfig | null {
    return this.configs.get(reportId) ?? null;
  }

  getAll(): ReportConfig[] {
    return Array.from(this.configs.values());
  }

  has(reportId: string): boolean {
    return this.configs.has(reportId);
  }

  getCount(): number {
    return this.configs.size;
  }
}

export const ReportConfigRegistry = new ReportConfigRegistryImpl();

// ──────────────────────────────────────────────
// REPORT CONFIG LOADER
// ──────────────────────────────────────────────

export class ReportConfigLoader {
  private static instance: ReportConfigLoader;
  private queryPlanResolver: QueryPlanResolver;
  private registerEngine: RegisterEngine;
  private ruleEngine: RuleEngine;
  private permissionEngine: PermissionEngine;
  private drilldownEngine: DrilldownEngine;
  private formulaRegistry: FormulaRegistry;

  private constructor() {
    this.queryPlanResolver = QueryPlanResolver.getInstance();
    this.registerEngine = RegisterEngine.getInstance();
    this.ruleEngine = RuleEngine.getInstance();
    this.permissionEngine = PermissionEngine.getInstance();
    this.drilldownEngine = DrilldownEngine.getInstance();
    this.formulaRegistry = FormulaRegistry.getInstance();
  }

  static getInstance(): ReportConfigLoader {
    if (!ReportConfigLoader.instance) {
      ReportConfigLoader.instance = new ReportConfigLoader();
    }
    return ReportConfigLoader.instance;
  }

  /**
   * Executes a report from configuration alone.
   *
   * This is the ONLY method the UI ever calls for config-driven reports.
   * It reads the ReportConfig, checks permissions, resolves the query,
   * computes formulas, evaluates rules, builds drilldown, and assembles
   * the final ReportEngineResult.
   *
   * @param reportId - The report ID (e.g., 'A', 'P1', 'C2')
   * @param context - Query context with org, station, dates, filters
   * @param options - Optional execution options
   * @returns Complete ReportEngineResult ready for rendering
   */
  async execute(
    reportId: string,
    context: QueryContext,
    options?: { useArchive?: boolean; stationConfig?: Record<string, any> }
  ): Promise<ReportEngineResult> {
    const startTime = performance.now();
    const useArchive = options?.useArchive === true;
    const stationConfig = options?.stationConfig;

    // Step 0: Load the ReportConfig
    const config = ReportConfigRegistry.get(reportId);
    if (!config) {
      logger.warn(`[ReportConfigLoader] No config found for report ${reportId}.`);
      return this.errorResult(reportId, 'BusinessDashboard', 'Executive', `Report ${reportId} not found.`);
    }

    // Step 1: Permission check — fail fast if user can't access
    if (!this.permissionEngine.canAccess(reportId, context.role, config)) {
      logger.info(`[ReportConfigLoader] Access denied: ${context.role} cannot access ${reportId}.`);
      return this.errorResult(
        reportId,
        config.engineType,
        config.rendererProfile,
        `Access denied. Your role (${context.role}) cannot access this report.`
      );
    }

    try {
      // Step 2: Resolve the query plan (base + joins + merge)
      const resolved = await this.queryPlanResolver.resolve(config.queryPlan, context, useArchive);

      // Step 3: Execute register (columns + rows from resolved data)
      const register = await this.registerEngine.resolveRegisterFromConfig(
        {
          queryPlan: config.queryPlan,
          register: config.register,
          title: config.title,
          titleUr: config.titleUr,
        },
        context,
        useArchive
      );

      // Step 4: Compute formulas for KPIs
      const kpis = this.computeKPIs(config, resolved, context);

      // Step 5: Evaluate rules
      const rules = this.evaluateRules(config, kpis, stationConfig);

      // Step 6: Build drilldown path
      const drilldown = this.drilldownEngine.buildPath(reportId, config, {
        dateFrom: context.dateFrom?.toISOString(),
        dateTo: context.dateTo?.toISOString(),
        ...context.filters,
      });

      // Step 7: Build charts (from config or derived from data)
      const charts = this.buildCharts(config, resolved);

      const totalExecutionTimeMs = Math.round(performance.now() - startTime);

      // Determine data quality
      const hasKPIData = kpis.some(k => typeof k.value === 'number' ? k.value !== 0 : k.value !== '');
      const hasRegisterData = register ? register.rows.length > 0 : false;
      const dataQuality = hasKPIData || hasRegisterData ? 'VERIFIED' : 'EMPTY';

      // Performance budget check
      if (totalExecutionTimeMs > config.performanceBudgetMs) {
        logger.warn(
          `[ReportConfigLoader] Report ${reportId} exceeded performance budget: ${totalExecutionTimeMs}ms > ${config.performanceBudgetMs}ms`
        );
      }

      return {
        reportId,
        engineType: config.engineType,
        rendererProfile: config.rendererProfile,
        executedAt: new Date(),
        totalExecutionTimeMs,
        kpis,
        charts,
        register,
        timeline: null,
        alerts: [],
        rules,
        drilldown,
        dataQuality,
      };
    } catch (error: any) {
      logger.error(`[ReportConfigLoader] Failed to execute ${reportId}:`, error);
      return this.errorResult(
        reportId,
        config.engineType,
        config.rendererProfile,
        error.message || 'Report execution failed.'
      );
    }
  }

  /**
   * Computes KPI values from the resolved query data using the Formula Registry.
   */
  private computeKPIs(
    config: ReportConfig,
    resolved: ResolvedQueryResult,
    _context: QueryContext
  ): KPIResult[] {
    if (!config.kpis || config.kpis.length === 0) {
      return [];
    }

    // Build the formula inputs from resolved data
    // Use lowercase collection names as keys (matching FormulaRegistry expectations)
    const formulaInputs: Record<string, any[]> = {
      [resolved.base.collection]: resolved.mergedRows,
    };

    // Also add join data keyed by lowercase collection name
    for (const [, result] of Object.entries(resolved.joins)) {
      formulaInputs[result.collection] = result.documents;
    }

    return config.kpis.map(kpiConfig => {
      let value: number | string = 0;

      if (kpiConfig.formulaId) {
        // Compute via Formula Registry
        value = this.formulaRegistry.executeFormula(kpiConfig.formulaId, formulaInputs);
      }

      // Determine status based on value (simple heuristic)
      const numValue = typeof value === 'number' ? value : 0;
      let status: 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL' = 'NEUTRAL';
      if (numValue > 0) status = 'SUCCESS';
      else if (numValue < 0) status = 'DANGER';

      return {
        id: kpiConfig.id,
        label: kpiConfig.label,
        labelUr: kpiConfig.labelUr,
        value,
        unit: kpiConfig.unit,
        status,
        displayType: kpiConfig.displayType,
        drilldownReportId: kpiConfig.drilldownReportId,
      };
    });
  }

  /**
   * Evaluates rules for the report's KPIs and register.
   */
  private evaluateRules(
    config: ReportConfig,
    kpis: KPIResult[],
    stationConfig?: Record<string, any>
  ): RuleResult[] {
    if (!config.rules || config.rules.length === 0) {
      return [];
    }

    const results: RuleResult[] = [];

    for (const ruleConfig of config.rules) {
      // Find the KPI value this rule applies to
      const kpi = kpis.find(k => k.id === ruleConfig.appliesTo);
      if (!kpi) continue;

      const value = typeof kpi.value === 'number' ? kpi.value : 0;
      const result = this.ruleEngine.evaluate(ruleConfig.ruleId, value, stationConfig);
      results.push(result);
    }

    return results;
  }

  /**
   * Builds chart results from config or derives them from resolved data.
   */
  private buildCharts(
    config: ReportConfig,
    resolved: ResolvedQueryResult
  ): ChartResult[] {
    if (!config.charts || config.charts.length === 0) {
      return [];
    }

    return config.charts.map(chartConfig => ({
      chartId: chartConfig.id,
      chartType: chartConfig.chartType,
      title: chartConfig.title,
      titleUr: chartConfig.titleUr,
      data: resolved.mergedRows,
      xKey: chartConfig.xKey,
      yKeys: chartConfig.yKeys,
      colors: chartConfig.colors,
    }));
  }

  /**
   * Creates an error result.
   */
  private errorResult(
    reportId: string,
    engineType: ReportEngineType,
    rendererProfile: RendererProfile,
    errorMessage: string
  ): ReportEngineResult {
    return {
      reportId,
      engineType,
      rendererProfile,
      executedAt: new Date(),
      totalExecutionTimeMs: 0,
      kpis: [],
      charts: [],
      register: null,
      timeline: null,
      alerts: [],
      rules: [],
      dataQuality: 'ERROR',
      errorMessage,
    };
  }

  /**
   * Registers a report config.
   * This is how new reports are added — zero code, pure configuration.
   */
  registerConfig(config: ReportConfig): void {
    ReportConfigRegistry.register(config);
  }

  /**
   * Gets a report config by ID.
   */
  getConfig(reportId: string): ReportConfig | null {
    return ReportConfigRegistry.get(reportId);
  }

  /**
   * Gets all registered report configs.
   */
  getAllConfigs(): ReportConfig[] {
    return ReportConfigRegistry.getAll();
  }

  /**
   * Gets all configs accessible by a given role.
   */
  getAccessibleConfigs(role: string): ReportConfig[] {
    return this.permissionEngine.filterAccessible(this.getAllConfigs(), role);
  }
}