/**
 * FuelPro Enterprise — Formula & Rule Registry Tests (PRD v6.1 A.1)
 *
 * Acceptance Proof: resolveFormula resolves the correct version by as_of_date.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FormulaRegistry,
  RuleRegistry,
  seedFormulaRegistry,
  seedRuleRegistry,
  type FormulaVersion,
} from '../FormulaRegistry';

describe('FormulaRegistry (A.1 — Formula Versioning)', () => {
  beforeEach(() => {
    FormulaRegistry._clear();
    seedFormulaRegistry();
  });

  it('should seed all 7 formula versions', () => {
    expect(FormulaRegistry.getVersionCount()).toBe(7);
  });

  it('resolveFormula("TRUE_PROFIT", "2026-01-01") returns V1', () => {
    const result = FormulaRegistry.resolveFormula('TRUE_PROFIT', '2026-01-01');
    expect(result).not.toBeNull();
    expect(result!.versionedId).toBe('TRUE_PROFIT_V1');
    expect(result!.version).toBe(1);
  });

  it('resolveFormula("TRUE_PROFIT", today) returns V1 (no V2 exists yet)', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = FormulaRegistry.resolveFormula('TRUE_PROFIT', today);
    expect(result).not.toBeNull();
    expect(result!.versionedId).toBe('TRUE_PROFIT_V1');
  });

  it('resolveFormula("TRUE_PROFIT") with no date returns current (V1)', () => {
    const result = FormulaRegistry.resolveFormula('TRUE_PROFIT');
    expect(result).not.toBeNull();
    expect(result!.versionedId).toBe('TRUE_PROFIT_V1');
    expect(result!.supersededBy).toBeNull();
  });

  it('after registering V2, resolve for July returns V1, resolve for August returns V2', () => {
    // Register TRUE_PROFIT_V2 effective August 1, 2026
    FormulaRegistry.registerVersion({
      formulaId: 'TRUE_PROFIT',
      domain: 'finance',
      version: 2,
      versionedId: 'TRUE_PROFIT_V2',
      name: 'True Profit per Litre (Revised)',
      definition: 'Pump Price − (Landed Cost + Freight + Levy + IFEM)',
      usedBy: ['FO-03', 'PRC-01', 'LED-05'],
      effectiveFrom: '2026-08-01',
      effectiveTo: null,
      supersededBy: null,
      logicFn: (data) => {
        const pumpPrice = Number(data.pumpPrice) || 0;
        const landedCost = Number(data.landedCost) || 0;
        const freight = Number(data.freight) || 0;
        const levy = Number(data.levy) || 0;
        const ifem = Number(data.ifem) || 0;
        return pumpPrice - (landedCost + freight + levy + ifem);
      },
    });

    // V1 should now have supersededBy set
    const v1 = FormulaRegistry.getVersion('TRUE_PROFIT_V1');
    expect(v1!.supersededBy).toBe('TRUE_PROFIT_V2');
    expect(v1!.effectiveTo).toBe('2026-07-31');

    // July 15, 2026 → should resolve to V1
    const julyResult = FormulaRegistry.resolveFormula('TRUE_PROFIT', '2026-07-15');
    expect(julyResult!.versionedId).toBe('TRUE_PROFIT_V1');

    // August 5, 2026 → should resolve to V2
    const augResult = FormulaRegistry.resolveFormula('TRUE_PROFIT', '2026-08-05');
    expect(augResult!.versionedId).toBe('TRUE_PROFIT_V2');

    // No date → should resolve to V2 (current)
    const currentResult = FormulaRegistry.resolveFormula('TRUE_PROFIT');
    expect(currentResult!.versionedId).toBe('TRUE_PROFIT_V2');
  });

  it('logicFn computes correctly for TRUE_PROFIT_V1', () => {
    const formula = FormulaRegistry.resolveFormula('TRUE_PROFIT')!;
    const result = formula.logicFn({
      pumpPrice: 280,
      landedCost: 250,
      freight: 2,
      levy: 10,
    });
    expect(result).toBe(18); // 280 - (250 + 2 + 10) = 18
  });

  it('logicFn computes correctly for OGRA_MARGIN_V1', () => {
    const formula = FormulaRegistry.resolveFormula('OGRA_MARGIN')!;
    const result = formula.logicFn({ ograDealerMargin: 8.64 });
    expect(result).toBe(8.64);
  });

  it('logicFn computes correctly for DSO_V1', () => {
    const formula = FormulaRegistry.resolveFormula('DSO')!;
    const result = formula.logicFn({ arBalance: 300000, creditSales: 1000000, periodDays: 30 });
    expect(result).toBe(9); // (300000 / 1000000) * 30 = 9
  });

  it('logicFn computes correctly for EVAP_LOSS_V1', () => {
    const formula = FormulaRegistry.resolveFormula('EVAP_LOSS')!;
    const result = formula.logicFn({ dipDelta: 998, meterDelta: 1000 });
    expect(result).toBeCloseTo(-0.2); // (998 - 1000) / 1000 * 100 = -0.2%
  });

  it('returns null for unknown formulaId', () => {
    const result = FormulaRegistry.resolveFormula('NONEXISTENT');
    expect(result).toBeNull();
  });

  it('getAllVersions returns all versions for a formulaId', () => {
    const versions = FormulaRegistry.getAllVersions('TRUE_PROFIT');
    expect(versions.length).toBe(1);
    expect(versions[0].versionedId).toBe('TRUE_PROFIT_V1');
  });
});

describe('RuleRegistry (A.1 — Rule Versioning)', () => {
  beforeEach(() => {
    RuleRegistry._clear();
    seedRuleRegistry();
  });

  it('should seed all 5 rule versions', () => {
    expect(RuleRegistry.getAllRuleIds().length).toBe(5);
  });

  it('resolveRule("READING_DISCONTINUITY") returns V1', () => {
    const result = RuleRegistry.resolveRule('READING_DISCONTINUITY');
    expect(result).not.toBeNull();
    expect(result!.versionedId).toBe('READING_DISCONTINUITY_V1');
    expect(result!.requiresOverride).toBe(true);
  });

  it('READING_DISCONTINUITY evaluateFn triggers on current < previous', () => {
    const rule = RuleRegistry.resolveRule('READING_DISCONTINUITY')!;
    const result = rule.evaluateFn({ currentReading: 5000, previousReading: 6000, meterChanged: false });
    expect(result.triggered).toBe(true);
  });

  it('READING_DISCONTINUITY evaluateFn does NOT trigger when meterChanged is true', () => {
    const rule = RuleRegistry.resolveRule('READING_DISCONTINUITY')!;
    const result = rule.evaluateFn({ currentReading: 100, previousReading: 6000, meterChanged: true });
    expect(result.triggered).toBe(false);
  });

  it('CREDIT_HOLD triggers at 90%+ utilization', () => {
    const rule = RuleRegistry.resolveRule('CREDIT_HOLD')!;
    const result = rule.evaluateFn({ utilization: 950000, creditLimit: 1000000 });
    expect(result.triggered).toBe(true);
  });

  it('AR_AGING_BUCKET triggers for >30 days outstanding', () => {
    const rule = RuleRegistry.resolveRule('AR_AGING_BUCKET')!;
    const result = rule.evaluateFn({ daysOutstanding: 45 });
    expect(result.triggered).toBe(true);
    expect(result.message).toContain('31-60 days');
  });
});
