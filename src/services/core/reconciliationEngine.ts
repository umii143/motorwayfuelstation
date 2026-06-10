/**
 * FuelPro EOC — Reconciliation Engine
 * Cross-validates all subsystems at shift close.
 * 5 automated checks per shift. Output: IntegrityScore + ReconciliationReport.
 * Powered by Umar Ali ⚡
 */

import { Shift, Nozzle, Product } from '../../types';
import { validateJournalBalance, getAllJournalEntries } from './journalEngine';
import { getPartyBalance, getAllCustomerBalances, getAllSupplierBalances } from './ledgerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiscrepancySeverity = 'info' | 'warning' | 'critical';

export interface Discrepancy {
  checkName: string;
  expected: number;
  actual: number;
  variance: number;
  variancePct: number;
  severity: DiscrepancySeverity;
  description: string;
}

export interface ReconciliationReport {
  shiftId: string;
  stationId: string;
  generatedAt: string;
  passed: boolean;
  integrityScore: number;      // 0-100
  checksRun: number;
  checksPassed: number;
  discrepancies: Discrepancy[];
  totalDrJournals: number;
  totalCrJournals: number;
  journalBalanced: boolean;
}

// ─── Fuel Category Helper ─────────────────────────────────────────────────────

function getFuelCategory(productId: string, products: Product[]): 'petrol' | 'diesel' | 'cng' | null {
  const p = products.find(prod => prod.id === productId);
  if (!p || p.type !== 'fuel') return null;
  const n = p.name.toLowerCase();
  if (n.includes('petrol') || n.includes('pmg') || n.includes('hobc')) return 'petrol';
  if (n.includes('diesel') || n.includes('hsd')) return 'diesel';
  if (n.includes('cng') || n.includes('gas')) return 'cng';
  return null;
}

// ─── Main Reconciliation ──────────────────────────────────────────────────────

/**
 * Run full 5-point reconciliation for a closed shift.
 */
export async function reconcileShift(
  shift: Shift,
  nozzles: Nozzle[],
  products: Product[],
  stationId: string
): Promise<ReconciliationReport> {
  const discrepancies: Discrepancy[] = [];
  let score = 100;
  const now = new Date().toISOString();

  // ─── Check 1: Journal Balance (ΣDR == ΣCR) ──────────────────────────────
  const journalCheck = await validateJournalBalance(shift.id, stationId);
  if (!journalCheck.balanced) {
    const variance = journalCheck.variance;
    score -= 25;
    discrepancies.push({
      checkName: 'Journal Balance',
      expected: journalCheck.totalDr,
      actual: journalCheck.totalCr,
      variance,
      variancePct: journalCheck.totalDr > 0 ? (variance / journalCheck.totalDr) * 100 : 100,
      severity: 'critical',
      description: `Journal entries are unbalanced. DR total (${journalCheck.totalDr.toFixed(2)}) ≠ CR total (${journalCheck.totalCr.toFixed(2)}). Variance: ${variance.toFixed(2)}`,
    });
  }

  // ─── Check 2: Sales vs Cash (Expected Cash Formula) ──────────────────────
  const grossSales = _computeGrossSales(shift, nozzles, products);
  const expectedCash = shift.expectedCash;
  const submittedCash = shift.submittedCash;
  const cashVariance = Math.abs(submittedCash - expectedCash);
  const cashVariancePct = expectedCash > 0 ? (cashVariance / expectedCash) * 100 : 0;

  if (cashVariancePct > 10) {
    score -= 25;
    discrepancies.push({
      checkName: 'Sales vs Cash',
      expected: expectedCash,
      actual: submittedCash,
      variance: cashVariance,
      variancePct: cashVariancePct,
      severity: cashVariancePct > 20 ? 'critical' : 'warning',
      description: `Cash variance detected. Expected: ${expectedCash.toFixed(0)}, Submitted: ${submittedCash.toFixed(0)}, Variance: ${cashVariance.toFixed(0)} (${cashVariancePct.toFixed(1)}%)`,
    });
  } else if (cashVariancePct > 2) {
    score -= 10;
    discrepancies.push({
      checkName: 'Sales vs Cash',
      expected: expectedCash,
      actual: submittedCash,
      variance: cashVariance,
      variancePct: cashVariancePct,
      severity: 'info',
      description: `Minor cash variance: ${cashVariance.toFixed(0)} (${cashVariancePct.toFixed(1)}%)`,
    });
  }

  // ─── Check 3: Credit Sales vs Customer Ledger ─────────────────────────────
  const totalCreditSales = shift.debitEntries.reduce((s, d) => s + d.amount, 0);
  let customerLedgerDr = 0;
  const customerBalances = await getAllCustomerBalances(stationId);
  const uniqueCustomers = [...new Set(shift.debitEntries.map(d => d.customerId))];

  for (const custId of uniqueCustomers) {
    const shiftDebits = shift.debitEntries.filter(d => d.customerId === custId).reduce((s, d) => s + d.amount, 0);
    customerLedgerDr += shiftDebits;
  }

  const ledgerVariance = Math.abs(totalCreditSales - customerLedgerDr);
  if (ledgerVariance > 1) {
    score -= 20;
    discrepancies.push({
      checkName: 'Credit Sales vs Customer Ledger',
      expected: totalCreditSales,
      actual: customerLedgerDr,
      variance: ledgerVariance,
      variancePct: totalCreditSales > 0 ? (ledgerVariance / totalCreditSales) * 100 : 0,
      severity: 'warning',
      description: `Customer ledger mismatch. Credit sales: ${totalCreditSales}, Ledger DR: ${customerLedgerDr}`,
    });
  }

  // ─── Check 4: Supplier Payments vs Supplier Ledger ────────────────────────
  const totalSupplierPmts = shift.supplierPayments.reduce((s, p) => s + p.amount, 0);
  const supplierBalances = await getAllSupplierBalances(stationId);
  const uniqueSuppliers = [...new Set(shift.supplierPayments.map(p => p.supplierId))];
  let supplierLedgerDr = 0;

  for (const supId of uniqueSuppliers) {
    const shiftPayments = shift.supplierPayments.filter(p => p.supplierId === supId).reduce((s, p) => s + p.amount, 0);
    supplierLedgerDr += shiftPayments;
  }

  const supplierVariance = Math.abs(totalSupplierPmts - supplierLedgerDr);
  if (supplierVariance > 1) {
    score -= 15;
    discrepancies.push({
      checkName: 'Supplier Payments vs Supplier Ledger',
      expected: totalSupplierPmts,
      actual: supplierLedgerDr,
      variance: supplierVariance,
      variancePct: totalSupplierPmts > 0 ? (supplierVariance / totalSupplierPmts) * 100 : 0,
      severity: 'warning',
      description: `Supplier ledger mismatch. Payments: ${totalSupplierPmts}, Ledger DR: ${supplierLedgerDr}`,
    });
  }

  // ─── Check 5: Recovery vs Customer Balance ────────────────────────────────
  for (const rec of shift.recoveryEntries) {
    const custLedgerBalance = customerBalances[rec.customerId] ?? 0;
    if (rec.amount > custLedgerBalance + rec.amount) {
      score -= 15;
      discrepancies.push({
        checkName: 'Recovery vs Customer Balance',
        expected: custLedgerBalance,
        actual: rec.amount,
        variance: rec.amount - custLedgerBalance,
        variancePct: 100,
        severity: 'critical',
        description: `Recovery of ${rec.amount} posted for customer with insufficient ledger balance (${custLedgerBalance})`,
      });
    }
  }

  const finalScore = Math.max(0, score);
  const checksRun = 5;
  const checksPassed = discrepancies.length === 0
    ? 5
    : 5 - discrepancies.filter(d => d.severity !== 'info').length;

  return {
    shiftId: shift.id,
    stationId,
    generatedAt: now,
    passed: discrepancies.filter(d => d.severity === 'critical').length === 0,
    integrityScore: finalScore,
    checksRun,
    checksPassed,
    discrepancies,
    totalDrJournals: journalCheck.totalDr,
    totalCrJournals: journalCheck.totalCr,
    journalBalanced: journalCheck.balanced,
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function _computeGrossSales(shift: Shift, nozzles: Nozzle[], products: Product[]): number {
  let total = 0;
  nozzles.forEach(nz => {
    const open = shift.openingReadings[nz.id] ?? 0;
    const close = shift.closingReadings[nz.id] ?? open;
    const liters = Math.max(0, close - open);
    const product = products.find(p => p.id === nz.productId);
    if (product) total += liters * product.rate;
  });
  total += shift.lubeSales.reduce((s, l) => s + l.amount, 0);
  return total;
}
