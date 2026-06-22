/**
 * FuelPro EOC — Integrity Engine
 * Daily Data Integrity Score (0-100).
 * Aggregates shift reconciliation results into a station-level health score.
 * Powered by Umar Ali ⚡
 */

import { ReconciliationReport } from './reconciliationEngine';
import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IntegrityCheck {
  name: string;
  passed: boolean;
  score: number;        // Points contributed (max varies by check)
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface IntegrityScore {
  stationId: string;
  date: string;
  score: number;        // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: IntegrityCheck[];
  generatedAt: string;
  shiftsAnalyzed: number;
  totalDiscrepancies: number;
}

export interface DailyIntegrityReport {
  stationId: string;
  date: string;
  shiftReports: ReconciliationReport[];
  aggregateScore: IntegrityScore;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const _scoreKey = (stationId: string, date: string) => `fuelpro_integrity_${stationId}_${date}`;

// ─── Core Scoring ─────────────────────────────────────────────────────────────

/**
 * Compute daily integrity score from all shift reconciliation reports.
 */
export async function computeIntegrityScore(
  stationId: string,
  date: string,
  shiftReports: ReconciliationReport[],
  extraContext?: {
    pendingApprovals?: number;      // Unresolved approval requests
    reversalCount?: number;         // Total reversals in day
    missingShifts?: number;         // Expected shifts not found
  }
): Promise<IntegrityScore> {
  const checks: IntegrityCheck[] = [];
  let totalScore = 100;
  const ctx = extraContext ?? {};

  // ─── Check 1: Journal Balance (25 pts) ────────────────────────────────
  const unbalancedShifts = shiftReports.filter(r => !r.journalBalanced);
  if (unbalancedShifts.length === 0) {
    checks.push({ name: 'Journal Balance', passed: true, score: 25, details: 'All shift journals are balanced (ΣDR = ΣCR).', severity: 'info' });
  } else {
    const deduction = Math.min(25, unbalancedShifts.length * 15);
    totalScore -= deduction;
    checks.push({ name: 'Journal Balance', passed: false, score: 25 - deduction, details: `${unbalancedShifts.length} shift(s) have unbalanced journals. This indicates data corruption or missing entries.`, severity: 'critical' });
  }

  // ─── Check 2: Cash Variance (25 pts) ──────────────────────────────────
  const cashVarianceDiscrepancies = shiftReports.flatMap(r => r.discrepancies.filter(d => d.checkName === 'Sales vs Cash'));
  const maxVariancePct = cashVarianceDiscrepancies.length > 0 ? Math.max(...cashVarianceDiscrepancies.map(d => d.variancePct)) : 0;

  if (maxVariancePct === 0) {
    checks.push({ name: 'Cash Variance', passed: true, score: 25, details: 'Perfect cash reconciliation across all shifts.', severity: 'info' });
  } else if (maxVariancePct <= 2) {
    const deduction = 5;
    totalScore -= deduction;
    checks.push({ name: 'Cash Variance', passed: true, score: 20, details: `Minor cash variance (${maxVariancePct.toFixed(1)}%) — within acceptable range.`, severity: 'info' });
  } else if (maxVariancePct <= 10) {
    const deduction = 15;
    totalScore -= deduction;
    checks.push({ name: 'Cash Variance', passed: false, score: 10, details: `Cash variance of ${maxVariancePct.toFixed(1)}% detected — investigate immediately.`, severity: 'warning' });
  } else {
    totalScore -= 25;
    checks.push({ name: 'Cash Variance', passed: false, score: 0, details: `Critical cash variance of ${maxVariancePct.toFixed(1)}% — possible theft or fraud.`, severity: 'critical' });
  }

  // ─── Check 3: Ledger Mismatch (20 pts) ────────────────────────────────
  const ledgerDiscrepancies = shiftReports.flatMap(r =>
    r.discrepancies.filter(d =>
      d.checkName === 'Credit Sales vs Customer Ledger' ||
      d.checkName === 'Supplier Payments vs Supplier Ledger'
    )
  );

  if (ledgerDiscrepancies.length === 0) {
    checks.push({ name: 'Ledger Mismatch', passed: true, score: 20, details: 'All customer and supplier ledgers match transaction records.', severity: 'info' });
  } else {
    const deduction = Math.min(20, ledgerDiscrepancies.length * 7);
    totalScore -= deduction;
    checks.push({ name: 'Ledger Mismatch', passed: false, score: 20 - deduction, details: `${ledgerDiscrepancies.length} ledger mismatch(es) found. Check customer and supplier ledgers.`, severity: 'warning' });
  }

  // ─── Check 4: Pending Approvals (15 pts) ──────────────────────────────
  const pendingApprovals = ctx.pendingApprovals ?? 0;
  if (pendingApprovals === 0) {
    checks.push({ name: 'Pending Approvals', passed: true, score: 15, details: 'No outstanding approval requests.', severity: 'info' });
  } else if (pendingApprovals <= 2) {
    const deduction = 5;
    totalScore -= deduction;
    checks.push({ name: 'Pending Approvals', passed: false, score: 10, details: `${pendingApprovals} approval request(s) pending review.`, severity: 'warning' });
  } else {
    const deduction = 15;
    totalScore -= deduction;
    checks.push({ name: 'Pending Approvals', passed: false, score: 0, details: `${pendingApprovals} approval requests stalled — operations may be blocked.`, severity: 'critical' });
  }

  // ─── Check 5: Reversal Frequency (10 pts) ─────────────────────────────
  const reversals = ctx.reversalCount ?? 0;
  if (reversals === 0) {
    checks.push({ name: 'Reversal Frequency', passed: true, score: 10, details: 'No reversals posted today — clean operation.', severity: 'info' });
  } else if (reversals <= 3) {
    const deduction = 3;
    totalScore -= deduction;
    checks.push({ name: 'Reversal Frequency', passed: true, score: 7, details: `${reversals} reversal(s) posted today — within acceptable range.`, severity: 'info' });
  } else {
    const deduction = 10;
    totalScore -= deduction;
    checks.push({ name: 'Reversal Frequency', passed: false, score: 0, details: `High reversal frequency: ${reversals} reversals today. Investigate operator behavior.`, severity: 'warning' });
  }

  // ─── Check 6: Missing Shifts (5 pts) ──────────────────────────────────
  const missingShifts = ctx.missingShifts ?? 0;
  if (missingShifts === 0) {
    checks.push({ name: 'Shift Completeness', passed: true, score: 5, details: 'All expected shifts are present and accounted for.', severity: 'info' });
  } else {
    totalScore -= 5;
    checks.push({ name: 'Shift Completeness', passed: false, score: 0, details: `${missingShifts} expected shift(s) are missing or incomplete.`, severity: 'warning' });
  }

  const finalScore = Math.max(0, Math.min(100, totalScore));
  const grade = finalScore >= 90 ? 'A' : finalScore >= 75 ? 'B' : finalScore >= 60 ? 'C' : finalScore >= 40 ? 'D' : 'F';

  const result: IntegrityScore = {
    stationId,
    date,
    score: finalScore,
    grade,
    checks,
    generatedAt: new Date().toISOString(),
    shiftsAnalyzed: shiftReports.length,
    totalDiscrepancies: shiftReports.reduce((s, r) => s + r.discrepancies.length, 0),
  };

  // Persist score
  await safeSetItem(_scoreKey(stationId, date), JSON.stringify(result));

  return result;
}

/** Retrieve a stored integrity score for a date. */
export async function getIntegrityScore(
  stationId: string,
  date: string
): Promise<IntegrityScore | null> {
  const raw = await safeGetItem(_scoreKey(stationId, date));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Get integrity score history for last N days. */
export async function getIntegrityHistory(
  stationId: string,
  days: number
): Promise<IntegrityScore[]> {
  const results: IntegrityScore[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const score = await getIntegrityScore(stationId, dateStr);
    if (score) results.push(score);
  }
  return results;
}
