/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise — Formula & Rule Version Registry (PRD v6.1 Addendum A.1)
 *
 * ARCHITECTURAL LAW:
 * Formulas and Rules are NEVER edited in place. Every change creates a new version.
 * Historical reports always recompute using the formula version active at the report's as_of_date.
 * The Register Engine resolves formula_id + as_of_date → correct version, every query.
 *
 * Powered by Umar Ali ⚡
 */

import { logger } from '../../logger';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export interface FormulaVersion {
  /** Stable identifier without version suffix, e.g. 'TRUE_PROFIT' */
  formulaId: string;
  /** Monotonically increasing version number */
  version: number;
  /** Full versioned key, e.g. 'TRUE_PROFIT_V1' */
  versionedId: string;
  /** Human-readable name */
  name: string;
  /** Domain tag (A.11) replacing separate engine classes */
  domain: string;
  /** Human-readable formula definition (display only) */
  definition: string;
  /** Report IDs that use this formula */
  usedBy: string[];
  /** ISO date string — when this version becomes active */
  effectiveFrom: string;
  /** ISO date string — when this version stops being active (null if still current) */
  effectiveTo: string | null;
  /** The versionedId of the next version that supersedes this one (null if current) */
  supersededBy: string | null;
  /**
   * The actual computation function.
   * Takes a data context and returns the computed value.
   */
  logicFn: (data: Record<string, any>) => number;
}

export interface RuleVersion {
  /** Stable identifier without version suffix, e.g. 'READING_DISCONTINUITY' */
  ruleId: string;
  /** Monotonically increasing version number */
  version: number;
  /** Full versioned key, e.g. 'READING_DISCONTINUITY_V1' */
  versionedId: string;
  /** Human-readable name */
  name: string;
  /** Domain tag (A.11) replacing separate engine classes */
  domain: string;
  /** Human-readable logic description */
  logic: string;
  /** Whether a Manager/Owner override is required */
  requiresOverride: boolean;
  /** ISO date string — when this version becomes active */
  effectiveFrom: string;
  /** ISO date string — when this version stops being active */
  effectiveTo: string | null;
  /** The versionedId of the next version that supersedes this one */
  supersededBy: string | null;
  /**
   * The actual evaluation function.
   * Takes a data context and returns { triggered: boolean, message: string }.
   */
  evaluateFn: (data: Record<string, any>) => { triggered: boolean; message: string };
}

// ──────────────────────────────────────────────
// FORMULA REGISTRY
// ──────────────────────────────────────────────

class FormulaRegistryImpl {
  /** All formula versions, keyed by versionedId (e.g. 'TRUE_PROFIT_V1') */
  private versions: Map<string, FormulaVersion> = new Map();
  /** Index: formulaId → ordered list of versionedIds */
  private formulaIndex: Map<string, string[]> = new Map();

  /**
   * Register a new formula version.
   * If a prior version exists for the same formulaId, sets supersededBy on it.
   */
  registerVersion(entry: FormulaVersion): void {
    // Validate: effectiveFrom must be set
    if (!entry.effectiveFrom) {
      throw new Error(`[FormulaRegistry] Formula ${entry.versionedId} missing effectiveFrom date.`);
    }

    // If a prior version exists, chain the supersedence
    const existingVersions = this.formulaIndex.get(entry.formulaId) || [];
    if (existingVersions.length > 0) {
      const lastVersionedId = existingVersions[existingVersions.length - 1];
      const lastVersion = this.versions.get(lastVersionedId);
      if (lastVersion && !lastVersion.supersededBy) {
        lastVersion.supersededBy = entry.versionedId;
        // Set effectiveTo to the day before the new version's effectiveFrom
        const newEffective = new Date(entry.effectiveFrom);
        newEffective.setDate(newEffective.getDate() - 1);
        lastVersion.effectiveTo = newEffective.toISOString().split('T')[0];
      }
    }

    this.versions.set(entry.versionedId, entry);

    if (!this.formulaIndex.has(entry.formulaId)) {
      this.formulaIndex.set(entry.formulaId, []);
    }
    this.formulaIndex.get(entry.formulaId)!.push(entry.versionedId);

    logger.info(`[FormulaRegistry] Registered ${entry.versionedId} (effective: ${entry.effectiveFrom})`);
  }

  /**
   * Resolve the correct formula version for a given formulaId and as_of_date.
   * Returns the version whose effectiveFrom <= asOfDate and (effectiveTo is null OR effectiveTo >= asOfDate).
   * If no asOfDate is provided, returns the current (latest non-superseded) version.
   */
  resolveFormula(formulaId: string, asOfDate?: Date | string): FormulaVersion | null {
    const versionedIds = this.formulaIndex.get(formulaId);
    if (!versionedIds || versionedIds.length === 0) {
      logger.warn(`[FormulaRegistry] No versions found for formulaId: ${formulaId}`);
      return null;
    }

    // If no date provided, return the latest version (the one with supersededBy === null)
    if (!asOfDate) {
      for (let i = versionedIds.length - 1; i >= 0; i--) {
        const v = this.versions.get(versionedIds[i])!;
        if (!v.supersededBy) return v;
      }
      // Fallback: return last registered
      return this.versions.get(versionedIds[versionedIds.length - 1])!;
    }

    const targetDate = typeof asOfDate === 'string' ? asOfDate : asOfDate.toISOString().split('T')[0];

    // Walk versions in reverse to find the one active on the target date
    for (let i = versionedIds.length - 1; i >= 0; i--) {
      const v = this.versions.get(versionedIds[i])!;
      const fromDate = v.effectiveFrom;
      const toDate = v.effectiveTo;

      if (targetDate >= fromDate && (toDate === null || targetDate <= toDate)) {
        return v;
      }
    }

    // Edge case: if targetDate is before all versions, return the earliest
    logger.warn(`[FormulaRegistry] No version found for ${formulaId} at ${targetDate}, returning earliest.`);
    return this.versions.get(versionedIds[0])!;
  }

  /**
   * Get a specific versioned formula by its full versionedId (e.g. 'TRUE_PROFIT_V1').
   */
  getVersion(versionedId: string): FormulaVersion | null {
    return this.versions.get(versionedId) || null;
  }

  /**
   * Get all versions for a given formulaId.
   */
  getAllVersions(formulaId: string): FormulaVersion[] {
    const ids = this.formulaIndex.get(formulaId) || [];
    return ids.map(id => this.versions.get(id)!);
  }

  /**
   * Get all registered formula base IDs.
   */
  getAllFormulaIds(): string[] {
    return Array.from(this.formulaIndex.keys());
  }

  /**
   * Get count of all registered formula versions.
   */
  getVersionCount(): number {
    return this.versions.size;
  }

  /**
   * Clear all registrations (for testing only).
   */
  _clear(): void {
    this.versions.clear();
    this.formulaIndex.clear();
  }
}

// ──────────────────────────────────────────────
// RULE REGISTRY
// ──────────────────────────────────────────────

class RuleRegistryImpl {
  private versions: Map<string, RuleVersion> = new Map();
  private ruleIndex: Map<string, string[]> = new Map();

  registerVersion(entry: RuleVersion): void {
    if (!entry.effectiveFrom) {
      throw new Error(`[RuleRegistry] Rule ${entry.versionedId} missing effectiveFrom date.`);
    }

    const existingVersions = this.ruleIndex.get(entry.ruleId) || [];
    if (existingVersions.length > 0) {
      const lastVersionedId = existingVersions[existingVersions.length - 1];
      const lastVersion = this.versions.get(lastVersionedId);
      if (lastVersion && !lastVersion.supersededBy) {
        lastVersion.supersededBy = entry.versionedId;
        const newEffective = new Date(entry.effectiveFrom);
        newEffective.setDate(newEffective.getDate() - 1);
        lastVersion.effectiveTo = newEffective.toISOString().split('T')[0];
      }
    }

    this.versions.set(entry.versionedId, entry);
    if (!this.ruleIndex.has(entry.ruleId)) {
      this.ruleIndex.set(entry.ruleId, []);
    }
    this.ruleIndex.get(entry.ruleId)!.push(entry.versionedId);

    logger.info(`[RuleRegistry] Registered ${entry.versionedId} (effective: ${entry.effectiveFrom})`);
  }

  resolveRule(ruleId: string, asOfDate?: Date | string): RuleVersion | null {
    const versionedIds = this.ruleIndex.get(ruleId);
    if (!versionedIds || versionedIds.length === 0) return null;

    if (!asOfDate) {
      for (let i = versionedIds.length - 1; i >= 0; i--) {
        const v = this.versions.get(versionedIds[i])!;
        if (!v.supersededBy) return v;
      }
      return this.versions.get(versionedIds[versionedIds.length - 1])!;
    }

    const targetDate = typeof asOfDate === 'string' ? asOfDate : asOfDate.toISOString().split('T')[0];

    for (let i = versionedIds.length - 1; i >= 0; i--) {
      const v = this.versions.get(versionedIds[i])!;
      if (targetDate >= v.effectiveFrom && (v.effectiveTo === null || targetDate <= v.effectiveTo)) {
        return v;
      }
    }

    return this.versions.get(versionedIds[0])!;
  }

  getVersion(versionedId: string): RuleVersion | null {
    return this.versions.get(versionedId) || null;
  }

  getAllVersions(ruleId: string): RuleVersion[] {
    const ids = this.ruleIndex.get(ruleId) || [];
    return ids.map(id => this.versions.get(id)!);
  }

  getAllRuleIds(): string[] {
    return Array.from(this.ruleIndex.keys());
  }

  _clear(): void {
    this.versions.clear();
    this.ruleIndex.clear();
  }
}

// ──────────────────────────────────────────────
// SINGLETON INSTANCES
// ──────────────────────────────────────────────

export const FormulaRegistry = new FormulaRegistryImpl();
export const RuleRegistry = new RuleRegistryImpl();

// ──────────────────────────────────────────────
// SEED DATA — PRD v6.0 Section 4.2 & 4.3
// ──────────────────────────────────────────────

export function seedFormulaRegistry(): void {
  FormulaRegistry.registerVersion({
    formulaId: 'TRUE_PROFIT',
    version: 1,
    versionedId: 'TRUE_PROFIT_V1',
    name: 'True Profit per Litre',
    domain: 'finance',
    definition: 'Pump Price − (Landed Cost + Freight + Levy)',
    usedBy: ['FO-03', 'PRC-01', 'LED-05'],
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    logicFn: (data) => {
      const pumpPrice = Number(data.pumpPrice) || 0;
      const landedCost = Number(data.landedCost) || 0;
      const freight = Number(data.freight) || 0;
      const levy = Number(data.levy) || 0;
      return pumpPrice - (landedCost + freight + levy);
    },
  });

  FormulaRegistry.registerVersion({
    formulaId: 'OGRA_MARGIN',
    version: 1,
    versionedId: 'OGRA_MARGIN_V1',
    name: 'Dealer Margin',
    domain: 'pricing',
    definition: 'Fixed by OGRA circular (currently Rs. 8.64/L reference)',
    usedBy: ['PRC-01', 'INV-01'],
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    logicFn: (data) => {
      return Number(data.ograDealerMargin) || 8.64;
    },
  });

  FormulaRegistry.registerVersion({
    formulaId: 'DSO',
    version: 1,
    versionedId: 'DSO_V1',
    name: 'Days Sales Outstanding',
    domain: 'ar',
    definition: '(AR Balance / Credit Sales) × Period Days',
    usedBy: ['CUS-02'],
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    logicFn: (data) => {
      const arBalance = Number(data.arBalance) || 0;
      const creditSales = Number(data.creditSales) || 1;
      const periodDays = Number(data.periodDays) || 30;
      return (arBalance / creditSales) * periodDays;
    },
  });

  FormulaRegistry.registerVersion({
    formulaId: 'DPO',
    version: 1,
    versionedId: 'DPO_V1',
    name: 'Days Payable Outstanding',
    domain: 'ap',
    definition: '(AP Balance / Credit Purchases) × Period Days',
    usedBy: ['SUP-02'],
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    logicFn: (data) => {
      const apBalance = Number(data.apBalance) || 0;
      const creditPurchases = Number(data.creditPurchases) || 1;
      const periodDays = Number(data.periodDays) || 30;
      return (apBalance / creditPurchases) * periodDays;
    },
  });

  FormulaRegistry.registerVersion({
    formulaId: 'CASH_ACCURACY',
    version: 1,
    versionedId: 'CASH_ACCURACY_V1',
    name: 'Cashier Accuracy %',
    domain: 'staff',
    definition: '1 − (|Shortage+Excess| / Expected Cash)',
    usedBy: ['STF-02'],
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    logicFn: (data) => {
      const shortageExcess = Math.abs(Number(data.shortage) || 0);
      const expectedCash = Number(data.expectedCash) || 1;
      return (1 - (shortageExcess / expectedCash)) * 100;
    },
  });

  FormulaRegistry.registerVersion({
    formulaId: 'EVAP_LOSS',
    version: 1,
    versionedId: 'EVAP_LOSS_V1',
    name: 'Evaporation Loss %',
    domain: 'inventory',
    definition: '(Dip Δ − Meter Δ) / Meter Δ, capped alert at 0.15%',
    usedBy: ['FO-06', 'INV-03'],
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    logicFn: (data) => {
      const dipDelta = Number(data.dipDelta) || 0;
      const meterDelta = Number(data.meterDelta) || 1;
      return ((dipDelta - meterDelta) / meterDelta) * 100;
    },
  });

  FormulaRegistry.registerVersion({
    formulaId: 'LANDED_COST',
    version: 1,
    versionedId: 'LANDED_COST_V1',
    name: 'Landed Cost per Litre',
    domain: 'procurement',
    definition: 'OMC Purchase Rate + Freight per Litre',
    usedBy: ['LED-05', 'PRC-03'],
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    logicFn: (data) => {
      return (Number(data.omcPurchaseRate) || 0) + (Number(data.freightPerLitre) || 0);
    },
  });

  logger.info('[FormulaRegistry] Seed data loaded: 7 formula versions registered.');
}

export function seedRuleRegistry(): void {
  RuleRegistry.registerVersion({
    ruleId: 'READING_DISCONTINUITY',
    version: 1,
    versionedId: 'READING_DISCONTINUITY_V1',
    name: 'Unexplained Reading Gap',
    domain: 'fuel_ops',
    logic: 'Current < Previous with no Meter Changed flag',
    requiresOverride: true,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    evaluateFn: (data) => {
      const current = Number(data.currentReading) || 0;
      const previous = Number(data.previousReading) || 0;
      const meterChanged = Boolean(data.meterChanged);
      if (current < previous && !meterChanged) {
        return { triggered: true, message: `Current reading (${current}) < Previous (${previous}) — Manager override required.` };
      }
      return { triggered: false, message: '' };
    },
  });

  RuleRegistry.registerVersion({
    ruleId: 'METER_CHANGED',
    version: 1,
    versionedId: 'METER_CHANGED_V1',
    name: 'Intentional Meter Reset',
    domain: 'fuel_ops',
    logic: 'New baseline entry, previous meter archived',
    requiresOverride: true,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    evaluateFn: (data) => {
      if (Boolean(data.meterChanged)) {
        return { triggered: true, message: 'Meter changed — new baseline audit entry required.' };
      }
      return { triggered: false, message: '' };
    },
  });

  RuleRegistry.registerVersion({
    ruleId: 'AR_AGING_BUCKET',
    version: 1,
    versionedId: 'AR_AGING_BUCKET_V1',
    name: 'AR Aging Classification',
    domain: 'ar',
    logic: 'Current / 1-15 / 16-30 / 31-60 / 60+ days',
    requiresOverride: false,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    evaluateFn: (data) => {
      const days = Number(data.daysOutstanding) || 0;
      let bucket: string;
      if (days <= 0) bucket = 'Current';
      else if (days <= 15) bucket = '1-15 days';
      else if (days <= 30) bucket = '16-30 days';
      else if (days <= 60) bucket = '31-60 days';
      else bucket = '60+ days';
      return { triggered: days > 30, message: `Aging bucket: ${bucket}` };
    },
  });

  RuleRegistry.registerVersion({
    ruleId: 'CREDIT_HOLD',
    version: 1,
    versionedId: 'CREDIT_HOLD_V1',
    name: 'Auto Credit Block',
    domain: 'ar',
    logic: 'Utilization ≥ 90% of limit',
    requiresOverride: true,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    evaluateFn: (data) => {
      const utilization = Number(data.utilization) || 0;
      const limit = Number(data.creditLimit) || 1;
      const pct = (utilization / limit) * 100;
      if (pct >= 90) {
        return { triggered: true, message: `Credit utilization at ${pct.toFixed(1)}% — auto hold. Owner override to release.` };
      }
      return { triggered: false, message: '' };
    },
  });

  RuleRegistry.registerVersion({
    ruleId: 'AP_UPCOMING_7D',
    version: 1,
    versionedId: 'AP_UPCOMING_7D_V1',
    name: 'Payment Due Alert',
    domain: 'ap',
    logic: 'Due date within 7 calendar days',
    requiresOverride: false,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    supersededBy: null,
    evaluateFn: (data) => {
      const dueDate = new Date(data.dueDate);
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        return { triggered: true, message: `Payment due in ${diffDays} day(s).` };
      }
      return { triggered: false, message: '' };
    },
  });

  logger.info('[RuleRegistry] Seed data loaded: 5 rule versions registered.');
}
