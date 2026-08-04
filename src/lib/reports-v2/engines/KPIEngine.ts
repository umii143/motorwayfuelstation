/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * KPI Engine — Resolves metrics for any report engine type
 *
 * The KPI Engine knows which metrics belong to which engine type.
 * It calls the Query Engine to get raw data, then computes KPIs.
 * Reports never calculate business numbers. This engine does.
 */

import { QueryContext, KPIResult, KPIDisplayType } from './types';
import { QueryEngine } from './QueryEngine';

// ──────────────────────────────────────────────
// KPI DEFINITIONS PER ENGINE TYPE
// Each engine type has a set of KPIs it resolves.
// ──────────────────────────────────────────────

interface KPIDefinition {
  id: string;
  label: string;
  labelUr: string;
  unit: string;
  displayType: KPIDisplayType;
  domains: string[];              // Query Engine domains needed
  calculate: (data: Record<string, any[]>) => number;
  statusRule: (value: number) => 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL';
  drilldownReportId?: string;
}

const ENGINE_KPI_MAP: Record<string, KPIDefinition[]> = {
  BusinessDashboard: [
    {
      id: 'kpi_total_sales', label: "Today's Sales", labelUr: 'آج کی سیل', unit: 'PKR',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL',
      drilldownReportId: 'B-001'
    },
    {
      id: 'kpi_total_volume', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).reduce((sum: number, s: any) => sum + (Number(s.quantity) || Number(s.liters) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL',
      drilldownReportId: 'B-001'
    },
    {
      id: 'kpi_cash_received', label: 'Cash Received', labelUr: 'کیش وصول', unit: 'PKR',
      displayType: 'simple', domains: ['CASH_LEDGER'],
      calculate: (data) => (data['CASH_LEDGER'] || []).filter((e: any) => e.type === 'IN' || e.type === 'credit').reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'WARNING',
      drilldownReportId: 'I-001'
    },
    {
      id: 'kpi_fuel_stock', label: 'Fuel Stock', labelUr: 'فیول اسٹاک', unit: 'L',
      displayType: 'simple', domains: ['TANKS'],
      calculate: (data) => (data['TANKS'] || []).reduce((sum: number, t: any) => sum + (Number(t.currentStock) || Number(t.currentLevel) || 0), 0),
      statusRule: (v) => v > 5000 ? 'SUCCESS' : v > 2000 ? 'WARNING' : 'DANGER',
      drilldownReportId: 'C-001'
    }
  ],

  SalesRegister: [
    {
      id: 'kpi_sales_count', label: 'Total Transactions', labelUr: 'کل ٹرانزیکشنز', unit: '',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).length,
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_sales_amount', label: 'Total Sales', labelUr: 'کل سیلز', unit: 'PKR',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL'
    },
    {
      id: 'kpi_avg_sale', label: 'Average Sale', labelUr: 'اوسط سیل', unit: 'PKR',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => {
        const sales = data['SALES'] || [];
        if (sales.length === 0) return 0;
        const total = sales.reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0);
        return Math.round(total / sales.length);
      },
      statusRule: () => 'NEUTRAL'
    }
  ],

  StockDashboard: [
    {
      id: 'kpi_total_stock', label: 'Total Stock', labelUr: 'کل اسٹاک', unit: 'L',
      displayType: 'simple', domains: ['TANKS'],
      calculate: (data) => (data['TANKS'] || []).reduce((sum: number, t: any) => sum + (Number(t.currentStock) || Number(t.currentLevel) || 0), 0),
      statusRule: (v) => v > 5000 ? 'SUCCESS' : v > 2000 ? 'WARNING' : 'DANGER'
    },
    {
      id: 'kpi_tank_count', label: 'Active Tanks', labelUr: 'ٹینکس', unit: '',
      displayType: 'simple', domains: ['TANKS'],
      calculate: (data) => (data['TANKS'] || []).length,
      statusRule: () => 'NEUTRAL'
    }
  ],

  CashSummary: [
    {
      id: 'kpi_cash_in', label: 'Cash In', labelUr: 'کیش آمد', unit: 'PKR',
      displayType: 'simple', domains: ['CASH_LEDGER'],
      calculate: (data) => (data['CASH_LEDGER'] || []).filter((e: any) => e.type === 'IN' || e.type === 'credit').reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL',
      drilldownReportId: 'I-001'
    },
    {
      id: 'kpi_cash_out', label: 'Cash Out', labelUr: 'کیش خرچ', unit: 'PKR',
      displayType: 'simple', domains: ['CASH_LEDGER'],
      calculate: (data) => (data['CASH_LEDGER'] || []).filter((e: any) => e.type === 'OUT' || e.type === 'debit').reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0),
      statusRule: () => 'NEUTRAL',
      drilldownReportId: 'I-001'
    },
    {
      id: 'kpi_cash_net', label: 'Net Cash Position', labelUr: 'خالص نقدی', unit: 'PKR',
      displayType: 'simple', domains: ['CASH_LEDGER'],
      calculate: (data) => {
        const entries = data['CASH_LEDGER'] || [];
        const inflow = entries.filter((e: any) => e.type === 'IN' || e.type === 'credit').reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        const outflow = entries.filter((e: any) => e.type === 'OUT' || e.type === 'debit').reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        return inflow - outflow;
      },
      statusRule: (v) => v >= 0 ? 'SUCCESS' : 'DANGER'
    }
  ],

  // ──────────────────────────────────────────────
  // PROFIT & LOSS — True Profit waterfall (P1 / P-001)
  // Gross Sales − Purchase Cost − Test Liter Loss − Credit Aging − Operating Expenses
  // ──────────────────────────────────────────────
  ProfitReport: [
    {
      id: 'kpi_gross_sales', label: 'Gross Sales', labelUr: 'کل سیلز', unit: 'PKR',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL',
      drilldownReportId: 'B-001'
    },
    {
      id: 'kpi_purchase_cost', label: 'Purchase Cost', labelUr: 'خریداری لاگت', unit: 'PKR',
      displayType: 'simple', domains: ['FUEL_PURCHASES'],
      calculate: (data) => (data['FUEL_PURCHASES'] || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || Number(p.totalAmount) || 0), 0),
      statusRule: () => 'NEUTRAL',
      drilldownReportId: 'D-001'
    },
    {
      id: 'kpi_operating_expenses', label: 'Operating Expenses', labelUr: 'آپریٹنگ خرچے', unit: 'PKR',
      displayType: 'simple', domains: ['EXPENSES'],
      calculate: (data) => (data['EXPENSES'] || []).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0),
      statusRule: () => 'NEUTRAL',
      drilldownReportId: 'O-001'
    },
    {
      id: 'kpi_test_liter_loss', label: 'Test Liter Loss', labelUr: 'ٹیسٹ لٹر نقصان', unit: 'PKR',
      displayType: 'simple', domains: ['SHIFT_READINGS'],
      calculate: (data) => {
        const readings = data['SHIFT_READINGS'] || [];
        return readings.reduce((sum: number, r: any) => sum + (Number(r.testLiterCost) || (Number(r.testLiters) * (Number(r.rate) || 0)) || 0), 0);
      },
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_true_profit', label: 'True Profit', labelUr: 'اصل منافع', unit: 'PKR',
      displayType: 'simple', domains: ['SALES', 'FUEL_PURCHASES', 'EXPENSES', 'SHIFT_READINGS', 'CUSTOMERS'],
      calculate: (data) => {
        // Mirrors FORMULA_TRUE_PROFIT: Gross Sales − Purchase Cost − Test
        // Liter Loss − Credit Aging Cost − Operating Expenses.
        const sales = (data['SALES'] || []).reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0);
        const purchases = (data['FUEL_PURCHASES'] || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || Number(p.totalAmount) || 0), 0);
        const expenses = (data['EXPENSES'] || []).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
        const testLiterLoss = (data['SHIFT_READINGS'] || []).reduce((sum: number, r: any) => sum + (Number(r.testLiterCost) || (Number(r.testLiters) * (Number(r.rate) || 0)) || 0), 0);
        const creditAgingCost = (data['CUSTOMERS'] || []).reduce((sum: number, c: any) => {
          const balance = Number(c.balance) || 0;
          const daysOverdue = Number(c.daysOverdue) || 0;
          return sum + (daysOverdue > 60 ? balance * 0.02 : 0);
        }, 0);
        return Math.round((sales - purchases - testLiterLoss - creditAgingCost - expenses) * 100) / 100;
      },
      statusRule: (v) => v > 0 ? 'SUCCESS' : v === 0 ? 'NEUTRAL' : 'DANGER'
    },
    {
      id: 'kpi_profit_margin', label: 'Profit Margin', labelUr: 'منافع مارجن', unit: '%',
      displayType: 'simple', domains: ['SALES', 'FUEL_PURCHASES', 'EXPENSES', 'SHIFT_READINGS', 'CUSTOMERS'],
      calculate: (data) => {
        const sales = (data['SALES'] || []).reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0);
        if (sales <= 0) return 0;
        const purchases = (data['FUEL_PURCHASES'] || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || Number(p.totalAmount) || 0), 0);
        const expenses = (data['EXPENSES'] || []).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
        const testLiterLoss = (data['SHIFT_READINGS'] || []).reduce((sum: number, r: any) => sum + (Number(r.testLiterCost) || (Number(r.testLiters) * (Number(r.rate) || 0)) || 0), 0);
        const creditAgingCost = (data['CUSTOMERS'] || []).reduce((sum: number, c: any) => {
          const balance = Number(c.balance) || 0;
          const daysOverdue = Number(c.daysOverdue) || 0;
          return sum + (daysOverdue > 60 ? balance * 0.02 : 0);
        }, 0);
        return Math.round(((sales - purchases - testLiterLoss - creditAgingCost - expenses) / sales) * 1000) / 10;
      },
      statusRule: (v) => v >= 15 ? 'SUCCESS' : v >= 5 ? 'WARNING' : 'DANGER'
    }
  ],

  ShiftSummary: [
    {
      id: 'kpi_shift_count', label: 'Shifts Today', labelUr: 'آج کی شفٹس', unit: '',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).length,
      statusRule: () => 'NEUTRAL',
      drilldownReportId: 'H-001'
    },
    {
      id: 'kpi_shift_cash', label: 'Shift Cash Collected', labelUr: 'شفٹ کیش وصولی', unit: 'PKR',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).reduce((s: number, sh: any) => s + (Number(sh.totalCashCollected) || Number(sh.cashCollected) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL'
    },
    {
      id: 'kpi_shift_bank', label: 'Shift Bank Collected', labelUr: 'شفٹ بینک وصولی', unit: 'PKR',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).reduce((s: number, sh: any) => s + (Number(sh.totalBankCollected) || Number(sh.bankCollected) || 0), 0),
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_shift_digital', label: 'Shift Digital Collected', labelUr: 'شفٹ ڈیجیٹل وصولی', unit: 'PKR',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).reduce((s: number, sh: any) => s + (Number(sh.totalDigitalCollected) || Number(sh.digitalCollected) || 0), 0),
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_shift_variance', label: 'Shift Variance', labelUr: 'شفٹ فرق', unit: 'PKR',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).reduce((s: number, sh: any) => s + (Number(sh.varianceAmount) || 0), 0),
      statusRule: (v) => v === 0 ? 'SUCCESS' : v > -200 && v < 200 ? 'WARNING' : 'DANGER',
      drilldownReportId: 'I-002'
    },
    {
      id: 'kpi_shift_flagged', label: 'Flagged Shifts', labelUr: 'فلیگ شدہ شفٹس', unit: '',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).filter((sh: any) => sh.status === 'needs_review' || sh.status === 'flagged' || sh.status === 'FLAGGED').length,
      statusRule: (v) => v > 0 ? 'DANGER' : 'NEUTRAL'
    }
  ],

  ExpenseRegister: [
    {
      id: 'kpi_total_expense', label: 'Total Expenses', labelUr: 'کل اخراجات', unit: 'PKR',
      displayType: 'simple', domains: ['EXPENSES'],
      calculate: (data) => (data['EXPENSES'] || []).reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  CustomerLedger: [
    {
      id: 'kpi_total_receivable', label: 'Total Receivable', labelUr: 'کل وصولی', unit: 'PKR',
      displayType: 'simple', domains: ['CUSTOMERS'],
      calculate: (data) => (data['CUSTOMERS'] || []).reduce((s: number, c: any) => s + (Number(c.balance) || Number(c.outstanding) || 0), 0),
      statusRule: (v) => v > 500000 ? 'DANGER' : v > 100000 ? 'WARNING' : 'SUCCESS'
    }
  ],

  SupplierLedger: [
    {
      id: 'kpi_total_payable', label: 'Total Payable', labelUr: 'کل ادائیگی', unit: 'PKR',
      displayType: 'simple', domains: ['SUPPLIERS'],
      calculate: (data) => (data['SUPPLIERS'] || []).reduce((s: number, su: any) => s + (Number(su.balance) || Number(su.outstanding) || 0), 0),
      statusRule: (v) => v > 1000000 ? 'DANGER' : v > 500000 ? 'WARNING' : 'SUCCESS'
    }
  ],

  BankPosition: [
    {
      id: 'kpi_bank_balance', label: 'Bank Balance', labelUr: 'بینک بیلنس', unit: 'PKR',
      displayType: 'simple', domains: ['BANK_ACCOUNTS'],
      calculate: (data) => (data['BANK_ACCOUNTS'] || []).reduce((s: number, b: any) => s + (Number(b.balance) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'DANGER'
    }
  ],

  DigitalPayments: [
    {
      id: 'kpi_wallet_balance', label: 'Wallet Balance', labelUr: 'والیٹ بیلنس', unit: 'PKR',
      displayType: 'simple', domains: ['WALLETS'],
      calculate: (data) => (data['WALLETS'] || []).reduce((s: number, w: any) => s + (Number(w.balance) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  // ──────────────────────────────────────────────
  // CASH VARIANCE (C2 / I-002) — per-shift expected vs submitted cash
  // ──────────────────────────────────────────────
  Variance: [
    {
      id: 'kpi_total_variance', label: 'Total Variance', labelUr: 'کل فرق', unit: 'PKR',
      displayType: 'variance', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).reduce((sum: number, sh: any) => sum + (Number(sh.varianceAmount) || 0), 0),
      statusRule: (v) => v === 0 ? 'SUCCESS' : v > -500 && v < 500 ? 'WARNING' : 'DANGER',
      drilldownReportId: 'I-002'
    },
    {
      id: 'kpi_variance_shifts', label: 'Shifts With Variance', labelUr: 'فرق والی شفٹس', unit: '',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).filter((sh: any) => Math.abs(Number(sh.varianceAmount) || 0) > 0).length,
      statusRule: (v) => v > 0 ? 'WARNING' : 'SUCCESS',
      drilldownReportId: 'I-002'
    },
    {
      id: 'kpi_variance_flag', label: 'High-Variance Flags', labelUr: 'بڑے فرق کے الرٹس', unit: '',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).filter((sh: any) => Math.abs(Number(sh.varianceAmount) || 0) >= 500).length,
      statusRule: (v) => v > 0 ? 'DANGER' : 'SUCCESS',
      drilldownReportId: 'I-002'
    },
    {
      id: 'kpi_variance_shifts', label: 'Shifts With Variance', labelUr: 'فرق والی شفٹس', unit: '',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).filter((sh: any) => Math.abs(Number(sh.varianceAmount) || 0) > 0).length,
      statusRule: (v) => v > 0 ? 'WARNING' : 'SUCCESS',
      drilldownReportId: 'I-002'
    },
    {
      id: 'kpi_variance_flag', label: 'High-Variance Flags', labelUr: 'بڑے فرق کے الرٹس', unit: '',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).filter((sh: any) => Math.abs(Number(sh.varianceAmount) || 0) >= 500).length,
      statusRule: (v) => v > 0 ? 'DANGER' : 'SUCCESS',
      drilldownReportId: 'I-002'
    },
    {
      id: 'kpi_variance_expected', label: 'Expected Cash', labelUr: 'متوقع کیش', unit: 'PKR',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).reduce((sum: number, sh: any) => sum + (Number(sh.expectedCash) || Number(sh.totalSalesValue) || 0), 0),
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_variance_actual', label: 'Actual Cash', labelUr: 'اصل کیش', unit: 'PKR',
      displayType: 'simple', domains: ['SHIFTS'],
      calculate: (data) => (data['SHIFTS'] || []).reduce((sum: number, sh: any) => sum + (Number(sh.actualCash) || Number(sh.totalCashCollected) || Number(sh.cashCollected) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  PurchaseRegister: [
    {
      id: 'kpi_purchase_volume', label: 'Purchased Litres', labelUr: 'خریداری لیٹر', unit: 'L',
      displayType: 'simple', domains: ['FUEL_PURCHASES'],
      calculate: (data) => (data['FUEL_PURCHASES'] || []).reduce((s: number, p: any) => s + (Number(p.quantity) || Number(p.litres) || 0), 0),
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_purchase_value', label: 'Purchase Value', labelUr: 'خریداری قیمت', unit: 'PKR',
      displayType: 'simple', domains: ['FUEL_PURCHASES'],
      calculate: (data) => (data['FUEL_PURCHASES'] || []).reduce((s: number, p: any) => s + (Number(p.amount) || Number(p.totalAmount) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  PriceHistory: [
    {
      id: 'kpi_current_rate', label: 'Latest Rate', labelUr: 'موجودہ ریٹ', unit: 'PKR',
      displayType: 'simple', domains: ['FUEL_PRICES'],
      calculate: (data) => {
        const prices = data['FUEL_PRICES'] || [];
        if (prices.length === 0) return 0;
        const sorted = [...prices].sort((a, b) => (new Date(b.date || b.createdAt || 0).getTime()) - (new Date(a.date || a.createdAt || 0).getTime()));
        return Number(sorted[0].rate ?? sorted[0].price ?? 0);
      },
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL'
    },
    {
      id: 'kpi_price_changes', label: 'Price Changes', labelUr: 'قیمت تبدیلیاں', unit: '',
      displayType: 'simple', domains: ['FUEL_PRICES'],
      calculate: (data) => (data['FUEL_PRICES'] || []).length,
      statusRule: () => 'NEUTRAL'
    }
  ],

  TankDipReport: [
    {
      id: 'kpi_total_dips', label: 'Total Dip Readings', labelUr: 'کل ڈپ ریڈنگز', unit: '',
      displayType: 'simple', domains: ['DIP_READINGS'],
      calculate: (data) => (data['DIP_READINGS'] || []).length,
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_avg_water', label: 'Avg Water Bottom', labelUr: 'اوسط واٹر', unit: 'cm',
      displayType: 'simple', domains: ['DIP_READINGS'],
      calculate: (data) => {
        const dips = data['DIP_READINGS'] || [];
        if (dips.length === 0) return 0;
        return Math.round(dips.reduce((s: number, d: any) => s + (Number(d.waterLevel) || Number(d.water) || 0), 0) / dips.length * 100) / 100;
      },
      statusRule: () => 'NEUTRAL'
    }
  ],

  PumpNozzleReport: [
    {
      id: 'kpi_nozzle_count', label: 'Active Nozzles', labelUr: 'نوزلز', unit: '',
      displayType: 'simple', domains: ['NOZZLE_READINGS'],
      calculate: (data) => (data['NOZZLE_READINGS'] || []).length,
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_total_dispensed', label: 'Litres Dispensed', labelUr: 'کل ڈسپینس', unit: 'L',
      displayType: 'simple', domains: ['NOZZLE_READINGS'],
      calculate: (data) => (data['NOZZLE_READINGS'] || []).reduce((s: number, n: any) => s + (Number(n.closingReading) - Number(n.openingReading) || Number(n.litres) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  LedgerView: [
    {
      id: 'kpi_ledger_debit', label: 'Total Debits', labelUr: 'کل ڈیبٹ', unit: 'PKR',
      displayType: 'simple', domains: ['GENERAL_LEDGER'],
      calculate: (data) => (data['GENERAL_LEDGER'] || []).filter((e: any) => e.type === 'debit' || e.direction === 'debit').reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0),
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_ledger_credit', label: 'Total Credits', labelUr: 'کل کریڈٹ', unit: 'PKR',
      displayType: 'simple', domains: ['GENERAL_LEDGER'],
      calculate: (data) => (data['GENERAL_LEDGER'] || []).filter((e: any) => e.type === 'credit' || e.direction === 'credit').reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  StaffRegister: [
    {
      id: 'kpi_staff_count', label: 'Total Staff', labelUr: 'کل عملہ', unit: '',
      displayType: 'simple', domains: ['EMPLOYEES'],
      calculate: (data) => (data['EMPLOYEES'] || []).length,
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_attendance_rate', label: 'Attendance Records', labelUr: 'حاضری ریکارڈ', unit: '',
      displayType: 'simple', domains: ['ATTENDANCE'],
      calculate: (data) => (data['ATTENDANCE'] || []).length,
      statusRule: () => 'NEUTRAL'
    }
  ],

  TreasuryDashboard: [
    {
      id: 'kpi_cash_position', label: 'Cash in Safe', labelUr: 'کیش سیف', unit: 'PKR',
      displayType: 'simple', domains: ['CASH_LEDGER'],
      calculate: (data) => (data['CASH_LEDGER'] || []).reduce((s: number, e: any) => s + (Number(e.balance) || 0), 0),
      statusRule: (v) => v > 0 ? 'SUCCESS' : 'NEUTRAL'
    },
    {
      id: 'kpi_bank_total', label: 'Bank Balance', labelUr: 'بینک بیلنس', unit: 'PKR',
      displayType: 'simple', domains: ['BANK_ACCOUNTS'],
      calculate: (data) => (data['BANK_ACCOUNTS'] || []).reduce((s: number, b: any) => s + (Number(b.balance) || 0), 0),
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_wallet_total', label: 'Wallet Balance', labelUr: 'والیٹ بیلنس', unit: 'PKR',
      displayType: 'simple', domains: ['WALLETS'],
      calculate: (data) => (data['WALLETS'] || []).reduce((s: number, w: any) => s + (Number(w.balance) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  TaxReport: [
    {
      id: 'kpi_taxable_sales', label: 'Taxable Sales', labelUr: 'ٹیکس ایبل سیلز', unit: 'PKR',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).reduce((s: number, x: any) => s + (Number(x.totalAmount) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  AuditLog: [
    {
      id: 'kpi_audit_count', label: 'Audit Events', labelUr: 'آڈٹ ایونٹس', unit: '',
      displayType: 'simple', domains: ['AUDIT_LOGS'],
      calculate: (data) => (data['AUDIT_LOGS'] || []).length,
      statusRule: () => 'NEUTRAL'
    },
    {
      id: 'kpi_critical_events', label: 'Critical Events', labelUr: 'کریٹیکل ایونٹس', unit: '',
      displayType: 'simple', domains: ['AUDIT_LOGS'],
      calculate: (data) => (data['AUDIT_LOGS'] || []).filter((e: any) => e.severity === 'critical' || e.severity === 'CRITICAL').length,
      statusRule: (v) => v > 0 ? 'DANGER' : 'NEUTRAL'
    }
  ],

  AssetRegister: [
    {
      id: 'kpi_asset_count', label: 'Total Assets', labelUr: 'کل اثاثے', unit: '',
      displayType: 'simple', domains: ['ASSETS'],
      calculate: (data) => (data['ASSETS'] || []).length,
      statusRule: () => 'NEUTRAL'
    }
  ],

  AnalyticsDashboard: [
    {
      id: 'kpi_analytics_revenue', label: 'Revenue Analyzed', labelUr: 'آمدنی', unit: 'PKR',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).reduce((s: number, x: any) => s + (Number(x.totalAmount) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  FleetReport: [
    {
      id: 'kpi_fleet_customers', label: 'Fleet Customers', labelUr: 'فلیٹ کسٹمرز', unit: '',
      displayType: 'simple', domains: ['CUSTOMERS'],
      calculate: (data) => (data['CUSTOMERS'] || []).length,
      statusRule: () => 'NEUTRAL'
    }
  ],

  ComplianceReport: [
    {
      id: 'kpi_compliance_events', label: 'Compliance Events', labelUr: 'کمپلائنس ایونٹس', unit: '',
      displayType: 'simple', domains: ['AUDIT_LOGS'],
      calculate: (data) => (data['AUDIT_LOGS'] || []).length,
      statusRule: () => 'NEUTRAL'
    }
  ],

  BranchComparison: [
    {
      id: 'kpi_branch_sales', label: 'Branch Sales', labelUr: 'برانچ سیلز', unit: 'PKR',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).reduce((s: number, x: any) => s + (Number(x.totalAmount) || 0), 0),
      statusRule: () => 'NEUTRAL'
    }
  ],

  AIIntelligence: [
    {
      id: 'kpi_ai_records', label: 'Records Analyzed', labelUr: 'ریکارڈز تجزیہ', unit: '',
      displayType: 'simple', domains: ['SALES'],
      calculate: (data) => (data['SALES'] || []).length,
      statusRule: () => 'NEUTRAL'
    }
  ]
};

// ──────────────────────────────────────────────
// KPI ENGINE
// ──────────────────────────────────────────────

export class KPIEngine {
  private static instance: KPIEngine;
  private queryEngine: QueryEngine;

  private constructor() {
    this.queryEngine = QueryEngine.getInstance();
  }

  static getInstance(): KPIEngine {
    if (!KPIEngine.instance) {
      KPIEngine.instance = new KPIEngine();
    }
    return KPIEngine.instance;
  }

  async resolveKPIs(engineType: string, context: QueryContext, useArchive = false): Promise<KPIResult[]> {
    const definitions = ENGINE_KPI_MAP[engineType];
    if (!definitions || definitions.length === 0) {
      return [];
    }

    // Collect all unique domains needed
    const allDomains = Array.from(new Set(definitions.flatMap(d => d.domains)));

    // Batch query all domains in parallel (archive mode for historical replays)
    const rawData = await this.queryEngine.queryMultiple(allDomains, context, useArchive);

    // Convert RawDataResult to plain arrays for calculation
    const dataArrays: Record<string, any[]> = {};
    Object.entries(rawData).forEach(([domain, result]) => {
      dataArrays[domain] = result.documents;
    });

    // Calculate each KPI
    return definitions.map(def => {
      const value = def.calculate(dataArrays);
      return {
        id: def.id,
        label: def.label,
        labelUr: def.labelUr,
        value: value,
        unit: def.unit,
        status: def.statusRule(typeof value === 'number' ? value : 0),
        displayType: def.displayType,
        drilldownReportId: def.drilldownReportId,
        explainText: `Calculated from ${def.domains.join(', ')} domain data.`
      };
    });
  }
}
