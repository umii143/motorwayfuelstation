/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Rule Engine (v2.1 Patch — Phase 9 C.1 Step 5)
 *
 * RuleEvaluator takes a ruleId + computed value → { status, color, icon, message }
 *
 * Thresholds are station-configurable via Settings — never hardcoded.
 * Rule definitions are mirrored in Firestore platform/ruleRegistry.
 * Code-level rule map is the execution layer.
 *
 * ARCHITECTURAL RULE:
 * No UI, no Firebase imports. Pure evaluation logic.
 * Station config is passed in — the engine never reads Settings directly.
 */

import { logger } from '../../logger';
import { RuleDefinition, RuleResult, RuleStatus } from './types';

// ──────────────────────────────────────────────
// DEFAULT THRESHOLDS (station-configurable via Settings)
// These are the fallback values when no station config is provided.
// ──────────────────────────────────────────────

const DEFAULT_THRESHOLDS: Record<string, { min?: number; max?: number }> = {
  RULE_CASH_VARIANCE_THRESHOLD: { min: -100, max: 100 },     // ₨100 either way is acceptable
  RULE_TANK_REORDER_LEVEL: { min: 15, max: 100 },             // Below 15% = red, 15-30% = amber
  RULE_PROFIT_MARGIN_HEALTH: { min: 10, max: 100 },           // Below 10% margin = danger
  RULE_EXPENSE_BUDGET_PERCENT: { min: 0, max: 80 },           // Above 80% of budget = warning
  RULE_FLAGGED_SHIFTS: { min: 0, max: 0 },                    // Any flagged shift = warning
  RULE_CUSTOMER_OVERDUE: { min: 0, max: 0 },                  // Any overdue > 60 days = warning
};

export class RuleEngine {
  private static instance: RuleEngine;
  private rules: Map<string, RuleDefinition> = new Map();

  private constructor() {
    this.seedRules();
  }

  static getInstance(): RuleEngine {
    if (!RuleEngine.instance) {
      RuleEngine.instance = new RuleEngine();
    }
    return RuleEngine.instance;
  }

  private register(rule: RuleDefinition) {
    this.rules.set(rule.id, rule);
  }

  /**
   * Evaluates a rule against a computed value.
   *
   * @param ruleId - The rule to evaluate (e.g., 'RULE_CASH_VARIANCE_THRESHOLD')
   * @param value - The computed value to evaluate
   * @param config - Optional station config with custom thresholds
   * @returns RuleResult with status, color, icon, message
   */
  evaluate(ruleId: string, value: number, config?: Record<string, any>): RuleResult {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      logger.warn(`[RuleEngine] Rule ${ruleId} not found.`);
      return {
        ruleId,
        status: 'NEUTRAL',
        color: 'neutral',
        icon: '?',
        message: `Rule ${ruleId} not found.`,
        messageUr: `رول ${ruleId} نہیں ملا۔`,
      };
    }

    try {
      return rule.evaluate(value, config);
    } catch (e) {
      logger.error(`[RuleEngine] Rule ${ruleId} evaluation failed:`, e);
      return {
        ruleId,
        status: 'NEUTRAL',
        color: 'neutral',
        icon: '?',
        message: `Rule evaluation failed.`,
        messageUr: `رول جانچ ناکام ہوگئی۔`,
      };
    }
  }

  /**
   * Evaluates multiple rules in batch.
   *
   * @param evaluations - Array of { ruleId, value, config? }
   * @returns Array of RuleResult
   */
  evaluateBatch(evaluations: Array<{ ruleId: string; value: number; config?: Record<string, any> }>): RuleResult[] {
    return evaluations.map(e => this.evaluate(e.ruleId, e.value, e.config));
  }

  /**
   * Returns all registered rule IDs.
   * Used by the CI check script to compare against Firestore registry.
   */
  getRuleIds(): string[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Returns all registered rule definitions (metadata only, no execute function).
   * Used for syncing to Firestore platform/ruleRegistry.
   */
  getRuleMetadata(): Array<{ id: string; version: string; description: string; owner: string }> {
    return Array.from(this.rules.values()).map(r => ({
      id: r.id,
      version: r.version,
      description: r.description,
      owner: r.owner,
    }));
  }

  /**
   * Checks if a rule exists by ID.
   */
  hasRule(id: string): boolean {
    return this.rules.has(id);
  }

  /**
   * Gets the default thresholds for a rule.
   * Used by Settings UI to show editable threshold values.
   */
  getDefaultThresholds(ruleId: string): { min?: number; max?: number } | undefined {
    return DEFAULT_THRESHOLDS[ruleId];
  }

  // ──────────────────────────────────────────────
  // SEED RULES
  // ──────────────────────────────────────────────

  private seedRules() {
    // 1. Cash Variance Threshold (C2 Report)
    this.register({
      id: 'RULE_CASH_VARIANCE_THRESHOLD',
      version: '1.0.0',
      description: 'Evaluates cash variance: green if within ±threshold, amber if moderate, red if excessive.',
      owner: 'FINANCE',
      evaluate: (value, config) => {
        const thresholds = config?.thresholds || DEFAULT_THRESHOLDS['RULE_CASH_VARIANCE_THRESHOLD'];
        const absValue = Math.abs(value);

        let status: RuleStatus;
        let icon: string;

        if (absValue <= (thresholds.min ?? -100) * -1 || absValue <= (thresholds.max ?? 100)) {
          status = 'SUCCESS';
          icon = '✓';
        } else if (absValue <= 500) {
          status = 'WARNING';
          icon = '⚠';
        } else {
          status = 'DANGER';
          icon = '✕';
        }

        return {
          ruleId: 'RULE_CASH_VARIANCE_THRESHOLD',
          status,
          color: status === 'SUCCESS' ? 'success' : status === 'WARNING' ? 'warning' : 'danger',
          icon,
          message: `Cash variance: ₨${value.toFixed(0)}`,
          messageUr: `نقدی فرق: ₨${value.toFixed(0)}`,
          threshold: thresholds,
          actualValue: value,
        };
      }
    });

    // 2. Tank Reorder Level (I Report)
    this.register({
      id: 'RULE_TANK_REORDER_LEVEL',
      version: '1.0.0',
      description: 'Evaluates tank fill percentage: green if healthy, amber if approaching reorder, red if below reorder.',
      owner: 'INVENTORY',
      evaluate: (value, config) => {
        const thresholds = config?.thresholds || DEFAULT_THRESHOLDS['RULE_TANK_REORDER_LEVEL'];
        const reorderLevel = thresholds.min ?? 15;

        let status: RuleStatus;
        let icon: string;

        if (value > 30) {
          status = 'SUCCESS';
          icon = '✓';
        } else if (value > reorderLevel) {
          status = 'WARNING';
          icon = '⚠';
        } else {
          status = 'DANGER';
          icon = '✕';
        }

        return {
          ruleId: 'RULE_TANK_REORDER_LEVEL',
          status,
          color: status === 'SUCCESS' ? 'success' : status === 'WARNING' ? 'warning' : 'danger',
          icon,
          message: `Tank fill: ${value.toFixed(1)}%`,
          messageUr: `ٹینک بھرائی: ${value.toFixed(1)}%`,
          threshold: thresholds,
          actualValue: value,
        };
      }
    });

    // 3. Profit Margin Health (P1 Report)
    this.register({
      id: 'RULE_PROFIT_MARGIN_HEALTH',
      version: '1.0.0',
      description: 'Evaluates profit margin: green if healthy, amber if thin, red if negative.',
      owner: 'FINANCE',
      evaluate: (value, config) => {
        const thresholds = config?.thresholds || DEFAULT_THRESHOLDS['RULE_PROFIT_MARGIN_HEALTH'];
        const minMargin = thresholds.min ?? 10;

        let status: RuleStatus;
        let icon: string;

        if (value >= minMargin) {
          status = 'SUCCESS';
          icon = '✓';
        } else if (value >= 0) {
          status = 'WARNING';
          icon = '⚠';
        } else {
          status = 'DANGER';
          icon = '✕';
        }

        return {
          ruleId: 'RULE_PROFIT_MARGIN_HEALTH',
          status,
          color: status === 'SUCCESS' ? 'success' : status === 'WARNING' ? 'warning' : 'danger',
          icon,
          message: `Profit margin: ${value.toFixed(1)}%`,
          messageUr: `منافع مارجن: ${value.toFixed(1)}%`,
          threshold: thresholds,
          actualValue: value,
        };
      }
    });

    // 4. Expense Budget Percent (E Report)
    this.register({
      id: 'RULE_EXPENSE_BUDGET_PERCENT',
      version: '1.0.0',
      description: 'Evaluates budget usage: green if under budget, amber if approaching, red if over budget.',
      owner: 'FINANCE',
      evaluate: (value, config) => {
        const thresholds = config?.thresholds || DEFAULT_THRESHOLDS['RULE_EXPENSE_BUDGET_PERCENT'];
        const maxBudget = thresholds.max ?? 80;

        let status: RuleStatus;
        let icon: string;

        if (value < maxBudget) {
          status = 'SUCCESS';
          icon = '✓';
        } else if (value < 100) {
          status = 'WARNING';
          icon = '⚠';
        } else {
          status = 'DANGER';
          icon = '✕';
        }

        return {
          ruleId: 'RULE_EXPENSE_BUDGET_PERCENT',
          status,
          color: status === 'SUCCESS' ? 'success' : status === 'WARNING' ? 'warning' : 'danger',
          icon,
          message: `Budget used: ${value.toFixed(1)}%`,
          messageUr: `بجٹ استعمال: ${value.toFixed(1)}%`,
          threshold: thresholds,
          actualValue: value,
        };
      }
    });

    // 5. Flagged Shifts Count (A Report)
    this.register({
      id: 'RULE_FLAGGED_SHIFTS',
      version: '1.0.0',
      description: 'Evaluates flagged shifts count: green if zero, red if any flagged.',
      owner: 'OPERATIONS',
      evaluate: (value, config) => {
        const thresholds = config?.thresholds || DEFAULT_THRESHOLDS['RULE_FLAGGED_SHIFTS'];

        const status: RuleStatus = value === 0 ? 'SUCCESS' : 'WARNING';
        const icon = value === 0 ? '✓' : '⚠';

        return {
          ruleId: 'RULE_FLAGGED_SHIFTS',
          status,
          color: status === 'SUCCESS' ? 'success' : 'warning',
          icon,
          message: value === 0 ? 'No flagged shifts' : `${value} flagged shift(s)`,
          messageUr: value === 0 ? 'کوئی پرچر شفٹ نہیں' : `${value} پرچر شفٹ(ز)`,
          threshold: thresholds,
          actualValue: value,
        };
      }
    });

    // 6. Customer Overdue Count (L1 Report)
    this.register({
      id: 'RULE_CUSTOMER_OVERDUE',
      version: '1.0.0',
      description: 'Evaluates overdue customer count: green if zero, amber if few, red if many.',
      owner: 'FINANCE',
      evaluate: (value, config) => {
        const thresholds = config?.thresholds || DEFAULT_THRESHOLDS['RULE_CUSTOMER_OVERDUE'];

        let status: RuleStatus;
        let icon: string;

        if (value === 0) {
          status = 'SUCCESS';
          icon = '✓';
        } else if (value <= 5) {
          status = 'WARNING';
          icon = '⚠';
        } else {
          status = 'DANGER';
          icon = '✕';
        }

        return {
          ruleId: 'RULE_CUSTOMER_OVERDUE',
          status,
          color: status === 'SUCCESS' ? 'success' : status === 'WARNING' ? 'warning' : 'danger',
          icon,
          message: value === 0 ? 'No overdue customers' : `${value} overdue customer(s)`,
          messageUr: value === 0 ? 'کوئی بقایا کسٹمر نہیں' : `${value} بقایا کسٹمر(ز)`,
          threshold: thresholds,
          actualValue: value,
        };
      }
    });
  }
}