/**
 * FuelPro EOC — Fraud Engine
 * Real-time fraud detection and shift risk scoring.
 * Monitors behavioral patterns and raises flags with severity levels.
 * Powered by Umar Ali ⚡
 */

import { Shift } from '../../types';
import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';
export type OverallRisk = 'low' | 'medium' | 'high' | 'critical';

export interface FraudFlag {
  id: string;
  type: string;
  severity: FraudSeverity;
  description: string;
  evidence: string;
  detectedAt: string;
  relatedTransactionId?: string;
}

export interface ShiftRiskScore {
  shiftId: string;
  stationId: string;
  overallRisk: OverallRisk;
  score: number;              // 0-100 (higher = more risky)
  flags: FraudFlag[];
  cashExposure: number;
  creditExposure: number;
  discountExposure: number;
  reversalCount: number;
  analyzedAt: string;
}

export interface StationRiskSummary {
  stationId: string;
  date: string;
  highRiskShifts: number;
  totalFlags: number;
  criticalFlags: number;
  riskTrend: 'improving' | 'stable' | 'deteriorating';
  topRisks: FraudFlag[];
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const _riskKey = (shiftId: string, stationId: string) => `fuelpro_risk_${stationId}_${shiftId}`;

// ─── Core Detection ───────────────────────────────────────────────────────────

/**
 * Analyze a shift and compute risk score based on behavioral patterns.
 */
export async function analyzeShiftRisk(
  shift: Shift,
  stationId: string,
  reversalCount: number = 0,
  operatorName?: string
): Promise<ShiftRiskScore> {
  const flags: FraudFlag[] = [];
  let riskScore = 0;
  const now = new Date().toISOString();
  const shiftStart = new Date(`${shift.date}T${shift.startTime ?? '08:00'}`);

  // ─── Flag 1: Excessive Discounts (same shift) ────────────────────────
  const discounts = shift.discountEntries ?? [];
  if (discounts.length >= 4) {
    const flag: FraudFlag = {
      id: `ff_disc_${shift.id}`,
      type: 'EXCESSIVE_DISCOUNTS',
      severity: discounts.length >= 6 ? 'high' : 'medium',
      description: `${discounts.length} discounts posted in a single shift`,
      evidence: `Discount count: ${discounts.length}. Total discount value: Rs ${discounts.reduce((s, d) => s + d.amount, 0).toLocaleString()}`,
      detectedAt: now,
    };
    flags.push(flag);
    riskScore += discounts.length >= 6 ? 25 : 15;
  }

  // ─── Flag 2: Large Cash Variance ─────────────────────────────────────
  const cashVariance = Math.abs(shift.submittedCash - shift.expectedCash);
  const variancePct = shift.expectedCash > 0 ? (cashVariance / shift.expectedCash) * 100 : 0;

  if (variancePct >= 20) {
    flags.push({ id: `ff_var_${shift.id}`, type: 'CRITICAL_CASH_VARIANCE', severity: 'critical', description: `Cash variance of ${variancePct.toFixed(1)}% detected`, evidence: `Expected: Rs ${shift.expectedCash.toLocaleString()}, Submitted: Rs ${shift.submittedCash.toLocaleString()}, Variance: Rs ${cashVariance.toLocaleString()}`, detectedAt: now });
    riskScore += 35;
  } else if (variancePct >= 10) {
    flags.push({ id: `ff_var_${shift.id}`, type: 'HIGH_CASH_VARIANCE', severity: 'high', description: `Cash variance of ${variancePct.toFixed(1)}% detected`, evidence: `Expected: Rs ${shift.expectedCash.toLocaleString()}, Submitted: Rs ${shift.submittedCash.toLocaleString()}`, detectedAt: now });
    riskScore += 20;
  } else if (variancePct >= 5) {
    flags.push({ id: `ff_var_${shift.id}`, type: 'MODERATE_CASH_VARIANCE', severity: 'medium', description: `Cash variance of ${variancePct.toFixed(1)}% detected`, evidence: `Variance: Rs ${cashVariance.toLocaleString()}`, detectedAt: now });
    riskScore += 10;
  }

  // ─── Flag 3: Excessive Test Liters ───────────────────────────────────
  const testPetrol = shift.testLiters?.petrol ?? 0;
  const testDiesel = shift.testLiters?.diesel ?? 0;
  const totalTest = testPetrol + testDiesel;

  if (totalTest > 100) {
    flags.push({ id: `ff_test_${shift.id}`, type: 'EXCESSIVE_TEST_LITERS', severity: 'high', description: `Excessive test liters claimed: ${totalTest}L`, evidence: `Petrol test: ${testPetrol}L, Diesel test: ${testDiesel}L. Standard is < 10L per nozzle.`, detectedAt: now });
    riskScore += 20;
  } else if (totalTest > 50) {
    flags.push({ id: `ff_test_${shift.id}`, type: 'HIGH_TEST_LITERS', severity: 'medium', description: `Above-average test liters: ${totalTest}L`, evidence: `Total test deduction: ${totalTest}L`, detectedAt: now });
    riskScore += 10;
  }

  // ─── Flag 4: High Reversal Count ────────────────────────────────────
  if (reversalCount > 5) {
    flags.push({ id: `ff_rev_${shift.id}`, type: 'HIGH_REVERSAL_FREQUENCY', severity: 'high', description: `${reversalCount} entry reversals in one shift`, evidence: `High reversal count may indicate repeated data entry errors or intentional manipulation.`, detectedAt: now });
    riskScore += 20;
  } else if (reversalCount >= 3) {
    flags.push({ id: `ff_rev_${shift.id}`, type: 'MODERATE_REVERSALS', severity: 'medium', description: `${reversalCount} reversals posted`, evidence: `Reversal count: ${reversalCount}`, detectedAt: now });
    riskScore += 8;
  }

  // ─── Flag 5: Recovery Without Balance ────────────────────────────────
  const suspiciousRecoveries = shift.recoveryEntries.filter(r => r.amount > 500000);
  if (suspiciousRecoveries.length > 0) {
    flags.push({ id: `ff_rec_${shift.id}`, type: 'SUSPICIOUS_LARGE_RECOVERY', severity: 'high', description: `${suspiciousRecoveries.length} unusually large recovery entries`, evidence: `Largest recovery: Rs ${Math.max(...suspiciousRecoveries.map(r => r.amount)).toLocaleString()}`, detectedAt: now });
    riskScore += 15;
  }

  // ─── Flag 6: Single Customer Dominance ───────────────────────────────
  const totalDebitValue = shift.debitEntries.reduce((s, d) => s + d.amount, 0);
  if (totalDebitValue > 0) {
    const customerGroups: Record<string, number> = {};
    shift.debitEntries.forEach(d => {
      customerGroups[d.customerId] = (customerGroups[d.customerId] ?? 0) + d.amount;
    });
    const maxCustomerShare = Math.max(...Object.values(customerGroups));
    const sharePct = (maxCustomerShare / totalDebitValue) * 100;
    if (sharePct > 80 && totalDebitValue > 200000) {
      flags.push({ id: `ff_cust_${shift.id}`, type: 'CUSTOMER_CONCENTRATION_RISK', severity: 'medium', description: `Single customer represents ${sharePct.toFixed(0)}% of credit sales`, evidence: `Credit concentration: Rs ${maxCustomerShare.toLocaleString()} / Rs ${totalDebitValue.toLocaleString()} total`, detectedAt: now });
      riskScore += 8;
    }
  }

  // ─── Compute Final Risk Level ─────────────────────────────────────────
  const finalScore = Math.min(100, riskScore);
  const overallRisk: OverallRisk =
    finalScore >= 60 ? 'critical' :
    finalScore >= 35 ? 'high' :
    finalScore >= 15 ? 'medium' : 'low';

  const result: ShiftRiskScore = {
    shiftId: shift.id,
    stationId,
    overallRisk,
    score: finalScore,
    flags,
    cashExposure: shift.expectedCash,
    creditExposure: shift.debitEntries.reduce((s, d) => s + d.amount, 0),
    discountExposure: discounts.reduce((s, d) => s + d.amount, 0),
    reversalCount,
    analyzedAt: now,
  };

  // Persist risk score
  await safeSetItem(_riskKey(shift.id, stationId), JSON.stringify(result));

  return result;
}

/** Retrieve stored risk score for a shift. */
export async function getShiftRiskScore(
  shiftId: string,
  stationId: string
): Promise<ShiftRiskScore | null> {
  const raw = await safeGetItem(_riskKey(shiftId, stationId));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Get station-level risk summary for a date. */
export async function getStationRiskSummary(
  stationId: string,
  shiftRiskScores: ShiftRiskScore[],
  date: string
): Promise<StationRiskSummary> {
  const highRiskShifts = shiftRiskScores.filter(r => r.overallRisk === 'high' || r.overallRisk === 'critical').length;
  const allFlags = shiftRiskScores.flatMap(r => r.flags);
  const criticalFlags = allFlags.filter(f => f.severity === 'critical').length;

  return {
    stationId,
    date,
    highRiskShifts,
    totalFlags: allFlags.length,
    criticalFlags,
    riskTrend: highRiskShifts === 0 ? 'improving' : highRiskShifts <= 1 ? 'stable' : 'deteriorating',
    topRisks: allFlags.sort((a, b) => {
      const sev: Record<FraudSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return sev[b.severity] - sev[a.severity];
    }).slice(0, 5),
  };
}
