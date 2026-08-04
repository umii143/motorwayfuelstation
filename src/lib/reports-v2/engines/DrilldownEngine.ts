/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Drilldown Engine (Phase 9 C.1 Step 8)
 *
 * Reads a report's `dependencies` array and auto-builds Level 2/3 navigation.
 *
 * Drill-down depth is ALWAYS exactly 3 levels (per PRD §1.3):
 *   Level 1 — KPI Card (the headline number)
 *   Level 2 — Category/Breakdown View (tap the card, see components)
 *   Level 3 — Line-Item Detail (tap any row, see individual entries)
 *
 * No report is allowed to bury information at Level 4 or deeper.
 *
 * ARCHITECTURAL RULE:
 * No UI. Pure navigation path builder. Reads from ReportConfig.dependencies.
 */

import { logger } from '../../logger';
import { DrilldownPath, DrilldownLevel, ReportConfig } from './types';

// ──────────────────────────────────────────────
// DEFAULT DRILLDOWN MAP
// Maps report IDs to their default drilldown targets.
// Reports can override via ReportConfig.dependencies array.
// ──────────────────────────────────────────────

const DEFAULT_DRILLDOWN: Record<string, string[]> = {
  // A — Today's Dashboard → shortcuts into other reports
  'A': ['F', 'C1', 'C2', 'E', 'S2'],

  // C2 — Cash Variance → per-staff → individual shifts
  'C2': ['S1', 'S2'],

  // E — Expenses → by category → individual entries
  'E': ['J'],

  // F — Fuel Sales → per nozzle → per-shift entries
  'F': ['N', 'M'],

  // I — Inventory & Stock → tank history → individual events
  'I': ['T2', 'H'],

  // L1 — Customer Ledger → customer list → individual ledger
  'L1': ['O'],

  // P1 — True Profit → waterfall components → underlying reports
  'P1': ['H', 'E', 'M'],

  // S — Sales → by product/day → individual shifts
  'S': ['F', 'S2'],
};

export class DrilldownEngine {
  private static instance: DrilldownEngine;

  private constructor() {}

  static getInstance(): DrilldownEngine {
    if (!DrilldownEngine.instance) {
      DrilldownEngine.instance = new DrilldownEngine();
    }
    return DrilldownEngine.instance;
  }

  /**
   * Builds a drilldown path for a report.
   *
   * Level 1 is always the report itself.
   * Level 2 and 3 are built from the report's dependencies array
   * (or the DEFAULT_DRILLDOWN map if no config is provided).
   *
   * @param reportId - The report ID (e.g., 'A', 'P1', 'C2')
   * @param config - Optional ReportConfig with explicit dependencies
   * @param filterContext - Optional filter context passed from parent (e.g., date range, staffId)
   * @returns DrilldownPath with up to 3 levels
   */
  buildPath(reportId: string, config?: ReportConfig, filterContext?: Record<string, any>): DrilldownPath {
    // Level 1 — the report itself
    const level1: DrilldownLevel = {
      level: 1,
      reportId,
      title: config?.title ?? reportId,
      titleUr: config?.titleUr ?? reportId,
      filterContext,
    };

    // Get child report IDs from config or default map
    const childIds = config?.dependencies ?? DEFAULT_DRILLDOWN[reportId] ?? [];

    if (childIds.length === 0) {
      // No drilldown — flat report (like Z-Report)
      return {
        levels: [level1],
        currentLevel: 1,
      };
    }

    // Level 2 — first child (category/breakdown view)
    const level2ChildId = childIds[0];
    const level2: DrilldownLevel = {
      level: 2,
      reportId: level2ChildId,
      title: this.getReportTitle(level2ChildId),
      titleUr: this.getReportTitleUr(level2ChildId),
      filterContext: { ...filterContext, parentReportId: reportId },
      childReportIds: childIds.length > 1 ? childIds.slice(1) : undefined,
    };

    // Level 3 — line-item detail (drill into Level 2's children)
    const level2Children = DEFAULT_DRILLDOWN[level2ChildId] ?? [];
    const level3ChildId = level2Children[0] ?? level2ChildId;
    const level3: DrilldownLevel = {
      level: 3,
      reportId: level3ChildId,
      title: this.getReportTitle(level3ChildId),
      titleUr: this.getReportTitleUr(level3ChildId),
      filterContext: { ...filterContext, parentReportId: level2ChildId },
    };

    return {
      levels: [level1, level2, level3],
      currentLevel: 1,
    };
  }

  /**
   * Gets the drilldown path for a specific level.
   *
   * @param path - The full drilldown path
   * @param level - The target level (1, 2, or 3)
   * @returns The DrilldownLevel for the requested level, or null
   */
  getLevel(path: DrilldownPath, level: 1 | 2 | 3): DrilldownLevel | null {
    return path.levels.find(l => l.level === level) ?? null;
  }

  /**
   * Gets the next level in the drilldown path.
   *
   * @param path - The current drilldown path
   * @returns The next level, or null if already at max depth
   */
  getNextLevel(path: DrilldownPath): DrilldownLevel | null {
    if (path.currentLevel >= 3) return null;
    return this.getLevel(path, (path.currentLevel + 1) as 1 | 2 | 3);
  }

  /**
   * Gets the previous level in the drilldown path.
   *
   * @param path - The current drilldown path
   * @returns The previous level, or null if already at Level 1
   */
  getPreviousLevel(path: DrilldownPath): DrilldownLevel | null {
    if (path.currentLevel <= 1) return null;
    return this.getLevel(path, (path.currentLevel - 1) as 1 | 2 | 3);
  }

  /**
   * Advances the drilldown path to the next level.
   *
   * @param path - The current drilldown path
   * @param filterContext - Optional new filter context to apply at the next level
   * @returns Updated DrilldownPath
   */
  drillDown(path: DrilldownPath, filterContext?: Record<string, any>): DrilldownPath {
    if (path.currentLevel >= 3) {
      logger.warn(`[DrilldownEngine] Already at max depth (Level 3). Cannot drill further.`);
      return path;
    }

    const nextLevel = (path.currentLevel + 1) as 1 | 2 | 3;
    const targetLevel = this.getLevel(path, nextLevel);
    if (!targetLevel) return path;

    return {
      levels: path.levels.map(l =>
        l.level === nextLevel
          ? { ...l, filterContext: { ...l.filterContext, ...filterContext } }
          : l
      ),
      currentLevel: nextLevel,
    };
  }

  /**
   * Returns to the previous level in the drilldown path.
   *
   * @param path - The current drilldown path
   * @returns Updated DrilldownPath
   */
  drillUp(path: DrilldownPath): DrilldownPath {
    if (path.currentLevel <= 1) return path;
    return {
      ...path,
      currentLevel: (path.currentLevel - 1) as 1 | 2 | 3,
    };
  }

  /**
   * Checks if a report has drilldown capability.
   *
   * @param reportId - The report ID
   * @param config - Optional ReportConfig
   * @returns true if the report has drilldown targets
   */
  hasDrilldown(reportId: string, config?: ReportConfig): boolean {
    const deps = config?.dependencies ?? DEFAULT_DRILLDOWN[reportId] ?? [];
    return deps.length > 0;
  }

  /**
   * Gets the child report IDs for a report.
   *
   * @param reportId - The report ID
   * @param config - Optional ReportConfig
   * @returns Array of child report IDs
   */
  getChildReportIds(reportId: string, config?: ReportConfig): string[] {
    return config?.dependencies ?? DEFAULT_DRILLDOWN[reportId] ?? [];
  }

  // ──────────────────────────────────────────────
  // REPORT TITLE LOOKUP (for drilldown navigation labels)
  // ──────────────────────────────────────────────

  private getReportTitle(reportId: string): string {
    const titles: Record<string, string> = {
      'A': "Today's Dashboard",
      'B': 'Bank Cash Ledger',
      'C1': 'Cash Book',
      'C2': 'Cash Variance',
      'C3': 'Credit Given Today',
      'D': 'Daily Report Summary',
      'D2': 'Digital Cash Ledger',
      'E': 'Expenses',
      'F': 'Fuel Sales',
      'G': 'General Ledger',
      'H': 'Purchase History',
      'I': 'Inventory & Stock',
      'J': 'Manual Entries',
      'K': 'KPI Dashboard',
      'L1': 'Customer Ledger',
      'L2': 'Supplier Ledger',
      'M': 'Meter Readings',
      'N': 'Nozzle Performance',
      'O': 'Outstanding & Overdue',
      'P1': 'True Profit',
      'P2': 'Purchase Spend',
      'Q': 'Quick Comparison',
      'R1': 'Rate Change History',
      'R2': 'Recoveries',
      'S': 'Sales Report',
      'S1': 'Staff Report',
      'S2': 'Shift Logs',
      'S3': 'Supplier Payments',
      'S4': 'Stock Report',
      'T1': 'Tax / OGRA',
      'T2': 'Tank Report',
      'T3': 'Test Liters',
      'U': 'Udhaar Summary',
      'V': 'Variance Trend',
      'W1': 'Wages / Salary',
      'W2': 'WhatsApp Share Log',
      'X': 'X-Report (Live)',
      'Y': 'Yearly Annual',
      'Z': 'Z-Report (Closing)',
    };
    return titles[reportId] ?? reportId;
  }

  private getReportTitleUr(reportId: string): string {
    const titles: Record<string, string> = {
      'A': 'آج کا خلاصہ',
      'B': 'بینک کیش لیجر',
      'C1': 'کیش بک',
      'C2': 'نقدی فرق',
      'C3': 'آج کا ادھار',
      'D': 'روزانہ رپورٹ',
      'D2': 'ڈیجیٹل کیش لیجر',
      'E': 'اخراجات',
      'F': 'فیول سیلز',
      'G': 'جنرل لیجر',
      'H': 'خریداری ہسٹری',
      'I': 'انوینٹری و اسٹاک',
      'J': 'مینول انٹریز',
      'K': 'کے پی آئی ڈیش بورڈ',
      'L1': 'کسٹمر لیجر',
      'L2': 'سپلائر لیجر',
      'M': 'میٹر ریڈنگز',
      'N': 'نوزل پرفارمنس',
      'O': 'بقایا و پرانا',
      'P1': 'اصل منافع',
      'P2': 'خریداری خرچ',
      'Q': 'فوری موازنہ',
      'R1': 'ریٹ تبدیلی ہسٹری',
      'R2': 'وصولی',
      'S': 'سیلز رپورٹ',
      'S1': 'عملہ رپورٹ',
      'S2': 'شفٹ لاگز',
      'S3': 'سپلائر ادائیگیاں',
      'S4': 'اسٹاک رپورٹ',
      'T1': 'ٹیکس / اوگرا',
      'T2': 'ٹینک رپورٹ',
      'T3': 'ٹیسٹ لیٹرز',
      'U': 'ادھار خلاصہ',
      'V': 'فرق ٹرینڈ',
      'W1': 'تنخواہ',
      'W2': 'واٹس ایپ شیئر لاگ',
      'X': 'ایکس رپورٹ (براہ راست)',
      'Y': 'سالانہ رپورٹ',
      'Z': 'زیڈ رپورٹ (اختتامی)',
    };
    return titles[reportId] ?? reportId;
  }
}