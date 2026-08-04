/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP — Engine → Deep Analytics Metric Map
 *
 * Maps every report engine type to a curated set of EBIP metrics used by the
 * generic EBIP Deep Analytics Panel. Every metricId here is registered in the
 * Semantic Layer and backed by a deterministic Formula Registry formula that
 * reads verified operational collections only (no fabricated values).
 *
 * `dateAware` — the metric's collections carry timestamps, so a true
 * period-over-period comparison (current window vs previous window) is valid.
 * Point-in-time metrics (tank stock, wallet balances, staff headcount…) are
 * snapshots; the panel labels their comparison honestly as N/A.
 */

import { ReportEngineType } from '../../engines/types';

export interface EBIPMetricRef {
  metricId: string;
  label: string;
  labelUr: string;
  unit: 'PKR' | 'L' | 'COUNT' | 'PERCENT';
  dateAware: boolean;
  /** True when a higher value is financially better (revenue, balances). */
  higherIsBetter: boolean;
}

const ENGINE_EBIP_METRICS: Record<string, EBIPMetricRef[]> = {
  BusinessDashboard: [
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Gross Revenue', labelUr: 'کل آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_NET_PROFIT', label: 'Net Profit', labelUr: 'خالص منافع', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_BUSINESS_HEALTH', label: 'Health Score', labelUr: 'ہیلتھ اسکور', unit: 'PERCENT', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_SALES_TRANSACTIONS', label: 'Transactions', labelUr: 'ٹرانزیکشنز', unit: 'COUNT', dateAware: true, higherIsBetter: false }
  ],
  SalesRegister: [
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Total Sales', labelUr: 'کل سیلز', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_SALES_TRANSACTIONS', label: 'Transactions', labelUr: 'ٹرانزیکشنز', unit: 'COUNT', dateAware: true, higherIsBetter: false },
    { metricId: 'METRIC_AVG_SALE_VALUE', label: 'Average Sale', labelUr: 'اوسط سیل', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_TOTAL_LITERS', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L', dateAware: true, higherIsBetter: true }
  ],
  StockDashboard: [
    { metricId: 'METRIC_CURRENT_STOCK', label: 'Total Stock', labelUr: 'کل اسٹاک', unit: 'L', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Sales on Stock', labelUr: 'اسٹاک پر سیلز', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_TOTAL_LITERS', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L', dateAware: true, higherIsBetter: true }
  ],
  ShiftSummary: [
    { metricId: 'METRIC_SHIFT_COUNT', label: 'Shifts', labelUr: 'شفٹس', unit: 'COUNT', dateAware: true, higherIsBetter: false },
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Shift Revenue', labelUr: 'شفٹ آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_SALES_TRANSACTIONS', label: 'Transactions', labelUr: 'ٹرانزیکشنز', unit: 'COUNT', dateAware: true, higherIsBetter: false }
  ],
  CashSummary: [
    { metricId: 'METRIC_CASH_BALANCE', label: 'Net Cash Movement', labelUr: 'خالص کیش', unit: 'PKR', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_CASH_IN_HAND', label: 'Cash in Safe', labelUr: 'کیش سیف', unit: 'PKR', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Revenue', labelUr: 'آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true }
  ],
  ExpenseRegister: [
    { metricId: 'METRIC_OPERATING_EXPENSES', label: 'Operating Expenses', labelUr: 'آپریٹنگ اخراجات', unit: 'PKR', dateAware: true, higherIsBetter: false },
    { metricId: 'METRIC_NET_PROFIT', label: 'Net Profit', labelUr: 'خالص منافع', unit: 'PKR', dateAware: true, higherIsBetter: true }
  ],
  CustomerLedger: [
    { metricId: 'METRIC_CUSTOMER_RECEIVABLE', label: 'Customer Receivable', labelUr: 'کسٹمر وصولی', unit: 'PKR', dateAware: false, higherIsBetter: false },
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Revenue', labelUr: 'آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true }
  ],
  SupplierLedger: [
    { metricId: 'METRIC_SUPPLIER_PAYABLE', label: 'Supplier Payable', labelUr: 'سپلائر ادائیگی', unit: 'PKR', dateAware: false, higherIsBetter: false },
    { metricId: 'METRIC_PURCHASE_VALUE', label: 'Purchase Value', labelUr: 'خریداری قیمت', unit: 'PKR', dateAware: true, higherIsBetter: false }
  ],
  BankPosition: [
    { metricId: 'METRIC_BANK_BALANCE', label: 'Bank Balance', labelUr: 'بینک بیلنس', unit: 'PKR', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_CASH_IN_HAND', label: 'Cash in Safe', labelUr: 'کیش سیف', unit: 'PKR', dateAware: false, higherIsBetter: true }
  ],
  DigitalPayments: [
    { metricId: 'METRIC_WALLET_BALANCE', label: 'Wallet Balance', labelUr: 'والیٹ بیلنس', unit: 'PKR', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_BANK_BALANCE', label: 'Bank Balance', labelUr: 'بینک بیلنس', unit: 'PKR', dateAware: false, higherIsBetter: true }
  ],
  PurchaseRegister: [
    { metricId: 'METRIC_PURCHASE_VALUE', label: 'Purchase Value', labelUr: 'خریداری قیمت', unit: 'PKR', dateAware: true, higherIsBetter: false },
    { metricId: 'METRIC_TOTAL_LITERS', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L', dateAware: true, higherIsBetter: true }
  ],
  PriceHistory: [
    { metricId: 'METRIC_PRICE_CHANGES', label: 'Price Revisions', labelUr: 'قیمت تبدیلیاں', unit: 'COUNT', dateAware: false, higherIsBetter: false },
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Revenue', labelUr: 'آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true }
  ],
  TankDipReport: [
    { metricId: 'METRIC_CURRENT_STOCK', label: 'Total Stock', labelUr: 'کل اسٹاک', unit: 'L', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_DIP_COUNT', label: 'Dip Readings', labelUr: 'ڈپ ریڈنگز', unit: 'COUNT', dateAware: true, higherIsBetter: false },
    { metricId: 'METRIC_TOTAL_LITERS', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L', dateAware: true, higherIsBetter: true }
  ],
  PumpNozzleReport: [
    { metricId: 'METRIC_NOZZLE_DISPENSED', label: 'Litres Dispensed', labelUr: 'کل ڈسپینس', unit: 'L', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_TOTAL_LITERS', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L', dateAware: true, higherIsBetter: true }
  ],
  LedgerView: [
    { metricId: 'METRIC_LEDGER_TURNOVER', label: 'Ledger Turnover', labelUr: 'لیجر ٹرن اوور', unit: 'PKR', dateAware: false, higherIsBetter: false },
    { metricId: 'METRIC_NET_PROFIT', label: 'Net Profit', labelUr: 'خالص منافع', unit: 'PKR', dateAware: true, higherIsBetter: true }
  ],
  StaffRegister: [
    { metricId: 'METRIC_STAFF_COUNT', label: 'Total Staff', labelUr: 'کل عملہ', unit: 'COUNT', dateAware: false, higherIsBetter: false },
    { metricId: 'METRIC_SHIFT_COUNT', label: 'Shifts', labelUr: 'شفٹس', unit: 'COUNT', dateAware: true, higherIsBetter: false }
  ],
  TreasuryDashboard: [
    { metricId: 'METRIC_CASH_BALANCE', label: 'Net Cash Movement', labelUr: 'خالص کیش', unit: 'PKR', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_BANK_BALANCE', label: 'Bank Balance', labelUr: 'بینک بیلنس', unit: 'PKR', dateAware: false, higherIsBetter: true },
    { metricId: 'METRIC_WALLET_BALANCE', label: 'Wallet Balance', labelUr: 'والیٹ بیلنس', unit: 'PKR', dateAware: false, higherIsBetter: true }
  ],
  TaxReport: [
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Taxable Sales', labelUr: 'ٹیکس ایبل سیلز', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_OPERATING_EXPENSES', label: 'Expenses', labelUr: 'اخراجات', unit: 'PKR', dateAware: true, higherIsBetter: false }
  ],
  AuditLog: [
    { metricId: 'METRIC_AUDIT_EVENTS', label: 'Audit Events', labelUr: 'آڈٹ ایونٹس', unit: 'COUNT', dateAware: true, higherIsBetter: false },
    { metricId: 'METRIC_AUDIT_CRITICAL_EVENTS', label: 'Critical Events', labelUr: 'کریٹیکل ایونٹس', unit: 'COUNT', dateAware: true, higherIsBetter: false }
  ],
  AssetRegister: [
    { metricId: 'METRIC_ASSET_COUNT', label: 'Total Assets', labelUr: 'کل اثاثے', unit: 'COUNT', dateAware: false, higherIsBetter: false },
    { metricId: 'METRIC_ASSET_VALUE', label: 'Asset Value', labelUr: 'اثاثہ قیمت', unit: 'PKR', dateAware: false, higherIsBetter: true }
  ],
  AnalyticsDashboard: [
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Revenue Analyzed', labelUr: 'آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_TOTAL_LITERS', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_NET_PROFIT', label: 'Net Profit', labelUr: 'خالص منافع', unit: 'PKR', dateAware: true, higherIsBetter: true }
  ],
  FleetReport: [
    { metricId: 'METRIC_CUSTOMER_RECEIVABLE', label: 'Fleet Receivable', labelUr: 'فلیٹ وصولی', unit: 'PKR', dateAware: false, higherIsBetter: false },
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Revenue', labelUr: 'آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true }
  ],
  ComplianceReport: [
    { metricId: 'METRIC_AUDIT_EVENTS', label: 'Compliance Events', labelUr: 'کمپلائنس ایونٹس', unit: 'COUNT', dateAware: true, higherIsBetter: false },
    { metricId: 'METRIC_AUDIT_CRITICAL_EVENTS', label: 'Critical Events', labelUr: 'کریٹیکل ایونٹس', unit: 'COUNT', dateAware: true, higherIsBetter: false }
  ],
  BranchComparison: [
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Branch Revenue', labelUr: 'برانچ آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_SHIFT_COUNT', label: 'Shifts', labelUr: 'شفٹس', unit: 'COUNT', dateAware: true, higherIsBetter: false }
  ],
  AIIntelligence: [
    { metricId: 'METRIC_GROSS_REVENUE', label: 'Revenue', labelUr: 'آمدنی', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_NET_PROFIT', label: 'Net Profit', labelUr: 'خالص منافع', unit: 'PKR', dateAware: true, higherIsBetter: true },
    { metricId: 'METRIC_TOTAL_LITERS', label: 'Liters Sold', labelUr: 'لیٹر فروخت', unit: 'L', dateAware: true, higherIsBetter: true }
  ]
};

/** Returns the curated EBIP metric set for an engine type (safe fallback: executive set). */
export function getEBIPMetricsForEngine(engineType: string): EBIPMetricRef[] {
  return ENGINE_EBIP_METRICS[engineType] || ENGINE_EBIP_METRICS.BusinessDashboard;
}

/** Format helper: renders a metric value per its unit. */
export function formatEBIPValue(value: number, unit: EBIPMetricRef['unit']): string {
  if (unit === 'COUNT') return Math.round(value).toLocaleString();
  if (unit === 'PERCENT') return `${Math.round(value)}%`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
