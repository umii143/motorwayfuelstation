/**
 * FuelPro EOC — Analytics Engine
 * KPI computation with full drill-through to source transactions.
 * Every KPI is traceable to its source journal entries.
 * Powered by Umar Ali ⚡
 */

import { Shift, Nozzle, Product, Customer } from '../../types';
import { getAllCustomerBalances } from './ledgerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KPIComponent {
  label: string;
  value: number;
  sourceType: 'shift' | 'journal' | 'ledger';
  sourceIds: string[];
  drillable: boolean;
}

export interface KPIDrillThrough {
  kpiLabel: string;
  kpiValue: number;
  unit: string;
  formula: string;
  components: KPIComponent[];
  generatedAt: string;
}

export interface ShiftMetrics {
  shiftId: string;
  date: string;
  totalFuelLiters: number;
  totalFuelRevenue: number;

  totalCreditSales: number;
  totalRecoveries: number;
  totalExpenses: number;
  totalBankDeposits: number;
  totalDigitalPayments: number;
  totalSupplierPayments: number;
  totalDiscounts: number;
  grossRevenue: number;
  netCashPosition: number;
  cashVariance: number;
  integrityScore?: number;
  riskScore?: number;
}

export interface ProductProfitability {
  productId: string;
  productName: string;
  totalLiters: number;
  revenue: number;
  cogs: number;
  margin: number;
  marginPct: number;
}

export interface CustomerRiskItem {
  customerId: string;
  customerName: string;
  outstandingBalance: number;
  daysOutstanding: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastPaymentDate?: string;
}

export interface ShiftVarianceSummary {
  shiftId: string;
  date: string;
  operatorName: string;
  cashVariance: number;
  variancePct: number;
  integrityScore: number;
}

export interface ExpenseTrendData {
  month: string;
  category: string;
  total: number;
}

// ─── Core KPI Functions ───────────────────────────────────────────────────────

/** Compute shift-level metrics. */
export function computeShiftMetrics(shift: Shift, nozzles: Nozzle[], products: Product[]): ShiftMetrics {
  let totalFuelLiters = 0;
  let totalFuelRevenue = 0;

  nozzles.forEach(nz => {
    const open = shift.openingReadings[nz.id] ?? 0;
    const close = shift.closingReadings[nz.id] ?? open;
    const liters = Math.max(0, close - open);
    const product = products.find(p => p.id === nz.productId);
    if (product) {
      totalFuelLiters += liters;
      totalFuelRevenue += liters * product.rate;
    }
  });


  const totalCreditSales = shift.debitEntries.reduce((s, d) => s + d.amount, 0);
  const totalRecoveries = shift.recoveryEntries.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = shift.expenseEntries.reduce((s, e) => s + e.amount, 0);
  const totalBankDeposits = shift.bankCashEntries.reduce((s, b) => s + b.amount, 0);
  const totalDigitalPayments = shift.digitalCashEntries.reduce((s, d) => s + d.amount, 0);
  const totalSupplierPayments = shift.supplierPayments.reduce((s, p) => s + p.amount, 0);
  const totalDiscounts = (shift.discountEntries ?? []).reduce((s, d) => s + d.amount, 0);
  const grossRevenue = totalFuelRevenue;
  const cashVariance = (shift.submittedCash ?? 0) - (shift.expectedCash ?? 0);

  return {
    shiftId: shift.id,
    date: shift.date,
    totalFuelLiters,
    totalFuelRevenue,

    totalCreditSales,
    totalRecoveries,
    totalExpenses,
    totalBankDeposits,
    totalDigitalPayments,
    totalSupplierPayments,
    totalDiscounts,
    grossRevenue,
    netCashPosition: shift.submittedCash ?? 0,
    cashVariance,
  };
}

/** Compute Net Profit with full KPI drill-through. */
export async function computeNetProfitDrillThrough(
  stationId: string,
  shifts: Shift[],
  nozzles: Nozzle[],
  products: Product[],
  fromDate: string,
  toDate: string
): Promise<KPIDrillThrough> {
  const filteredShifts = shifts.filter(s => s.date >= fromDate && s.date <= toDate && s.status === 'closed');

  let totalRevenue = 0;
  let totalFuelRevenue = 0;

  let totalExpenses = 0;
  let totalDiscounts = 0;
  const shiftIds: string[] = [];

  for (const shift of filteredShifts) {
    const metrics = computeShiftMetrics(shift, nozzles, products);
    totalFuelRevenue += metrics.totalFuelRevenue;

    totalExpenses += metrics.totalExpenses;
    totalDiscounts += metrics.totalDiscounts;
    shiftIds.push(shift.id);
  }

  totalRevenue = totalFuelRevenue;
  const netProfit = totalRevenue - totalExpenses - totalDiscounts;

  return {
    kpiLabel: 'Net Profit',
    kpiValue: netProfit,
    unit: 'PKR',
    formula: 'Revenue − Expenses − Discounts',
    generatedAt: new Date().toISOString(),
    components: [
      { label: 'Fuel Revenue', value: totalFuelRevenue, sourceType: 'shift', sourceIds: shiftIds, drillable: true },

      { label: 'Total Expenses', value: -totalExpenses, sourceType: 'shift', sourceIds: shiftIds, drillable: true },
      { label: 'Discounts Given', value: -totalDiscounts, sourceType: 'shift', sourceIds: shiftIds, drillable: true },
    ],
  };
}

/** Compute Revenue drill-through. */
export async function computeRevenueDrillThrough(
  shifts: Shift[],
  nozzles: Nozzle[],
  products: Product[],
  shiftIds: string[]
): Promise<KPIDrillThrough> {
  const targetShifts = shifts.filter(s => shiftIds.includes(s.id));
  const productRevMap: Record<string, { name: string; liters: number; revenue: number }> = {};

  for (const shift of targetShifts) {
    nozzles.forEach(nz => {
      const open = shift.openingReadings[nz.id] ?? 0;
      const close = shift.closingReadings[nz.id] ?? open;
      const liters = Math.max(0, close - open);
      const product = products.find(p => p.id === nz.productId);
      if (product && liters > 0) {
        if (!productRevMap[product.id]) productRevMap[product.id] = { name: product.name, liters: 0, revenue: 0 };
        productRevMap[product.id].liters += liters;
        productRevMap[product.id].revenue += liters * product.rate;
      }
    });
  }

  const total = Object.values(productRevMap).reduce((s, p) => s + p.revenue, 0);

  return {
    kpiLabel: 'Revenue Breakdown',
    kpiValue: total,
    unit: 'PKR',
    formula: 'Σ (Nozzle Liters × Product Rate)',
    generatedAt: new Date().toISOString(),
    components: Object.values(productRevMap).map((data) => ({
      label: `${data.name} (${data.liters.toLocaleString()}L)`,
      value: data.revenue,
      sourceType: 'shift' as const,
      sourceIds: shiftIds,
      drillable: true,
    })),
  };
}

/** Get top N shifts by cash variance (highest risk). */
export function getTopVarianceShifts(
  shifts: Shift[],
  limit: number = 10
): ShiftVarianceSummary[] {
  return shifts
    .filter(s => s.status === 'closed')
    .map(s => ({
      shiftId: s.id,
      date: s.date,
      operatorName: s.staffId ?? 'Unknown',
      cashVariance: Math.abs((s.submittedCash ?? 0) - (s.expectedCash ?? 0)),
      variancePct: s.expectedCash ? (Math.abs((s.submittedCash ?? 0) - (s.expectedCash ?? 0)) / s.expectedCash) * 100 : 0,
      integrityScore: 100, // Will be filled from integrityEngine if available
    }))
    .sort((a, b) => b.cashVariance - a.cashVariance)
    .slice(0, limit);
}

/** Get customer risk ranking by outstanding balance. */
export async function getCustomerRiskRanking(
  stationId: string,
  customers: Customer[]
): Promise<CustomerRiskItem[]> {
  const balances = await getAllCustomerBalances(stationId);

  return customers
    .map(c => {
      const balance = balances[c.id] ?? 0;
      const riskLevel: CustomerRiskItem['riskLevel'] =
        balance > 1000000 ? 'critical' :
        balance > 500000  ? 'high' :
        balance > 100000  ? 'medium' : 'low';

      return {
        customerId: c.id,
        customerName: c.name,
        outstandingBalance: balance,
        daysOutstanding: 0,  // Could be computed from first unpaid debit date
        riskLevel,
        lastPaymentDate: undefined,
      };
    })
    .filter(c => c.outstandingBalance > 0)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance);
}

/** Get expense category trend over N months. */
export function getExpenseCategoryTrend(
  shifts: Shift[],
  months: number = 6
): ExpenseTrendData[] {
  const result: ExpenseTrendData[] = [];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const relevant = shifts.filter(s => new Date(s.date) >= cutoff && s.status === 'closed');

  const monthCategoryMap: Record<string, Record<string, number>> = {};
  relevant.forEach(shift => {
    const month = shift.date.substring(0, 7); // YYYY-MM
    if (!monthCategoryMap[month]) monthCategoryMap[month] = {};
    shift.expenseEntries.forEach(e => {
      const cat = e.category || 'Uncategorized';
      monthCategoryMap[month][cat] = (monthCategoryMap[month][cat] ?? 0) + e.amount;
    });
  });

  Object.entries(monthCategoryMap).forEach(([month, categories]) => {
    Object.entries(categories).forEach(([category, total]) => {
      result.push({ month, category, total });
    });
  });

  return result.sort((a, b) => a.month.localeCompare(b.month));
}
