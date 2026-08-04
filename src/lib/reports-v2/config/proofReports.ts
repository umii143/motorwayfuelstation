/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Phase 9 — 5 Proof Reports
 *
 * These 5 reports prove the engine architecture works end-to-end.
 * Together they exercise every engine, every renderer type, and both cache tiers.
 *
 * Each report is a ReportConfig document — zero new TypeScript/React code.
 * A new report can be added by writing a document like these.
 *
 * Chosen because together they exercise:
 * - Every engine (Query, Register, Formula, Rule, Drilldown, Permission, Workflow)
 * - Every renderer type (KPI grid, Waterfall, RegisterList, Gauge, Ledger)
 * - Both cache tiers (realtime + cached/snapshot)
 * - Query joins (Customer Ledger joins customers with ledgerEntries)
 */

import { ReportConfig } from '../engines/types';
import { ReportConfigRegistry } from '../engines/ReportConfigLoader';

// ──────────────────────────────────────────────
// REPORT A — TODAY'S DASHBOARD
// BusinessDashboard / Executive, realtime
// Tests: Event Bus + Rule Engine + KPI grid
// ──────────────────────────────────────────────

const reportA: ReportConfig = {
  reportId: 'A',
  engineType: 'BusinessDashboard',
  rendererProfile: 'Executive',
  title: "Today's Dashboard",
  titleUr: 'آج کا خلاصہ',
  queryPlan: {
    base: 'SALES',
    joins: [
      { collection: 'SHIFTS', on: '_id' },
      { collection: 'EXPENSES', on: '_id' },
    ],
  },
  cacheTier: 'realtime',
  visibleTo: ['Owner', 'Manager', 'Accountant'],
  performanceBudgetMs: 2000,
  kpis: [
    { id: 'totalLiters', label: 'Total Liters', labelUr: 'کل لیٹر', formulaId: 'FORMULA_TOTAL_LITERS_SOLD', displayType: 'simple', unit: 'L', drilldownReportId: 'M' },
    { id: 'totalSales', label: 'Total Sales', labelUr: 'کل سیلز', formulaId: 'FORMULA_GROSS_REVENUE', displayType: 'simple', unit: '₨', drilldownReportId: 'F' },
    { id: 'cashPosition', label: 'Cash Position', labelUr: 'نقدی حالت', formulaId: 'FORMULA_CASH_BALANCE', displayType: 'simple', unit: '₨', drilldownReportId: 'B' },
    { id: 'activeShifts', label: 'Active Shifts', labelUr: 'فعال شفٹس', formulaId: 'FORMULA_SHIFT_COUNT', displayType: 'simple', unit: '', drilldownReportId: 'SHIFT' },
    { id: 'expenses', label: "Today's Expenses", labelUr: 'آج کے خرچے', formulaId: 'FORMULA_OPERATING_EXPENSES', displayType: 'simple', unit: '₨', drilldownReportId: 'C1' },
  ],
  rules: [
    { ruleId: 'RULE_FLAGGED_SHIFTS', appliesTo: 'activeShifts' },
  ],
  register: {
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true, filterable: true },
      { id: 'invoiceNo', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true, filterable: true },
      { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'productName', sortable: true, filterable: true },
      { id: 'qty', header: 'Qty (L)', headerUr: 'مقدار', accessor: 'quantity', isNumeric: true, sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
      { id: 'payment', header: 'Payment', headerUr: 'ادائیگی', accessor: 'paymentMethod', sortable: true, filterable: true },
    ],
    defaultSortColumn: 'date',
    defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
  },
  dependencies: ['F', 'C1', 'C2', 'E', 'S2'],
  exports: ['pdf', 'excel', 'csv', 'print'],
  // ── Enterprise Rule #129 — Context-Aware Business Center ──
  searchConfig: {
    placeholder: '🔍 Search Shift #, Invoice, Voucher, Customer, Supplier, Nozzle, Staff...',
    placeholderUr: '🔍 شفٹ #، انوائس، واؤچر، کسٹمر، سپلائر، نوزل، اسٹاف تلاش کریں...',
    searchFields: ['invoiceNo', 'productName', 'paymentMethod', 'customerName', 'voucherNo'],
  },
  filterGroups: [
    {
      id: 'product',
      label: 'Product',
      labelUr: 'پروڈکٹ',
      type: 'pills',
      source: 'dynamic',
      dynamicColumn: 'productName',
      options: [
        { value: 'Petrol', label: 'Petrol', labelUr: 'پٹرول', icon: '🟢' },
        { value: 'Diesel', label: 'Diesel', labelUr: 'ڈیزل', icon: '🟤' },
        { value: 'CNG', label: 'CNG', labelUr: 'سی این جی', icon: '🔵' },
      ],
    },
    {
      id: 'paymentMethod',
      label: 'Payment',
      labelUr: 'ادائیگی',
      type: 'pills',
      source: 'static',
      options: [
        { value: 'Cash', label: 'Cash', labelUr: 'نقد', icon: '💵' },
        { value: 'Bank', label: 'Bank', labelUr: 'بینک', icon: '🏦' },
        { value: 'Credit', label: 'Credit', labelUr: 'ادھار', icon: '📋' },
        { value: 'Digital', label: 'Digital', labelUr: 'ڈیجیٹل', icon: '📱' },
      ],
    },
    {
      id: 'shift',
      label: 'Shift',
      labelUr: 'شفٹ',
      type: 'pills',
      source: 'dynamic',
      dynamicColumn: 'shiftId',
      options: [],
    },
  ],
  quickActions: [
    { id: 'newShift', label: '+ New Shift', labelUr: '+ نئی شفٹ', icon: '⏱️', targetReportId: 'SHIFT', color: 'emerald' },
    { id: 'expense', label: '+ Expense', labelUr: '+ اخراجات', icon: '💸', targetReportId: 'C1', color: 'orange' },
    { id: 'purchase', label: '+ Purchase', labelUr: '+ خریداری', icon: '⛽', targetReportId: 'F', color: 'blue' },
    { id: 'customer', label: '+ Customer Payment', labelUr: '+ کسٹمر ریکوری', icon: '👥', targetReportId: 'L1', color: 'purple' },
    { id: 'tankDip', label: '+ Tank Dip', labelUr: '+ ٹینک ڈیپ', icon: '📏', targetReportId: 'M', color: 'teal' },
  ],
  defaultSavedViews: [
    { id: 'owner-default', label: 'Owner Default', labelUr: 'مالک ڈیفالٹ', icon: '👑', filters: {}, datePreset: 'today', isDefault: true },
    { id: 'fuel-only', label: 'Fuel Only', labelUr: 'صرف فیول', icon: '⛽', filters: { product: 'Petrol' }, datePreset: 'today' },
    { id: 'monthly', label: 'Monthly', labelUr: 'ماہانہ', icon: '📅', filters: {}, datePreset: 'thisMonth' },
    { id: 'cash-only', label: 'Cash Only', labelUr: 'صرف نقد', icon: '💵', filters: { paymentMethod: 'Cash' }, datePreset: 'today' },
  ],
};

// ──────────────────────────────────────────────
// REPORT P1 — TRUE PROFIT
// BusinessDashboard / Financial, cached/snapshot
// Tests: Formula Engine's most complex formula + Waterfall renderer
// ──────────────────────────────────────────────

const reportP1: ReportConfig = {
  reportId: 'P1',
  engineType: 'BusinessDashboard',
  rendererProfile: 'Financial',
  title: 'True Profit',
  titleUr: 'اصل منافع',
  queryPlan: {
    base: 'SALES',
    joins: [
      { collection: 'FUEL_PURCHASES', on: '_id' },
      { collection: 'EXPENSES', on: '_id' },
      { collection: 'CUSTOMERS', on: '_id' },
    ],
  },
  cacheTier: 'cached',
  visibleTo: ['Owner'],  // P1 is deliberately the single most restricted report — Owner-only, no exceptions
  performanceBudgetMs: 5000,
  kpis: [
    { id: 'trueProfit', label: 'True Profit', labelUr: 'اصل منافع', formulaId: 'FORMULA_TRUE_PROFIT', displayType: 'simple', unit: '₨' },
    { id: 'grossSales', label: 'Gross Sales', labelUr: 'کل سیلز', formulaId: 'FORMULA_GROSS_REVENUE', displayType: 'simple', unit: '₨' },
    { id: 'purchaseCost', label: 'Purchase Cost', labelUr: 'خریداری لاگت', formulaId: 'FORMULA_PURCHASE_VALUE', displayType: 'simple', unit: '₨' },
    { id: 'operatingExpenses', label: 'Operating Expenses', labelUr: 'آپریٹنگ خرچے', formulaId: 'FORMULA_OPERATING_EXPENSES', displayType: 'simple', unit: '₨' },
    { id: 'netProfit', label: 'Net Profit (Simple)', labelUr: 'خالص منافع', formulaId: 'FORMULA_NET_PROFIT', displayType: 'simple', unit: '₨' },
  ],
  rules: [
    { ruleId: 'RULE_PROFIT_MARGIN_HEALTH', appliesTo: 'trueProfit' },
  ],
  register: {
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'invoice', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
    ],
    defaultSortColumn: 'date',
    defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
  },
  dependencies: ['H', 'E', 'M'],
  exports: ['pdf', 'excel', 'csv', 'print'],
};

// ──────────────────────────────────────────────
// REPORT C2 — CASH VARIANCE
// Variance / Operational, realtime
// Tests: Rule Engine ranking + RegisterList renderer
// ──────────────────────────────────────────────

const reportC2: ReportConfig = {
  reportId: 'C2',
  engineType: 'Variance',
  rendererProfile: 'Operational',
  title: 'Cash Variance',
  titleUr: 'نقدی فرق',
  queryPlan: {
    base: 'SHIFTS',
    joins: [
      { collection: 'EMPLOYEES', on: 'operatorStaffId' },
    ],
  },
  cacheTier: 'realtime',
  visibleTo: ['Owner', 'Manager'],
  performanceBudgetMs: 2000,
  kpis: [
    { id: 'totalVariance', label: 'Total Variance', labelUr: 'کل فرق', formulaId: 'FORMULA_CASH_VARIANCE', displayType: 'variance', unit: '₨' },
    { id: 'shiftCount', label: 'Shift Count', labelUr: 'شفٹس', formulaId: 'FORMULA_SHIFT_COUNT', displayType: 'simple', unit: '' },
  ],
  rules: [
    { ruleId: 'RULE_CASH_VARIANCE_THRESHOLD', appliesTo: 'totalVariance' },
  ],
  register: {
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true, filterable: true },
      { id: 'operator', header: 'Operator', headerUr: 'آپریٹر', accessor: 'operatorName', sortable: true, filterable: true },
      { id: 'variance', header: 'Variance', headerUr: 'فرق', accessor: 'varianceAmount', isCurrency: true, sortable: true },
      { id: 'reason', header: 'Reason', headerUr: 'وجہ', accessor: 'varianceReason' },
      { id: 'status', header: 'Status', headerUr: 'حالت', accessor: 'status', isStatus: true },
    ],
    defaultSortColumn: 'varianceAmount',
    defaultSortDirection: 'desc',
    summaryFields: ['varianceAmount'],
  },
  dependencies: ['S1', 'S2'],
  exports: ['pdf', 'excel', 'csv', 'print'],
  // ── Enterprise Rule #129 ──
  searchConfig: {
    placeholder: '🔍 Search Shift #, Operator Name, Variance Reason...',
    placeholderUr: '🔍 شفٹ #، آپریٹر، فرق کی وجہ تلاش کریں...',
    searchFields: ['operatorName', 'varianceReason', 'status'],
  },
  filterGroups: [
    {
      id: 'status',
      label: 'Status',
      labelUr: 'حالت',
      type: 'pills',
      source: 'static',
      options: [
        { value: 'Submitted', label: 'Submitted', labelUr: 'جمع شدہ' },
        { value: 'Flagged', label: 'Flagged', labelUr: 'نشان زد' },
        { value: 'Pending', label: 'Pending', labelUr: 'زیر التوا' },
      ],
    },
    {
      id: 'operator',
      label: 'Operator',
      labelUr: 'آپریٹر',
      type: 'pills',
      source: 'dynamic',
      dynamicColumn: 'operatorName',
      options: [],
    },
  ],
  quickActions: [
    { id: 'newShift', label: '+ New Shift', labelUr: '+ نئی شفٹ', icon: '⏱️', targetReportId: 'SHIFT', color: 'emerald' },
    { id: 'viewShifts', label: 'All Shifts', labelUr: 'تمام شفٹس', icon: '📋', targetReportId: 'S1', color: 'slate' },
  ],
  defaultSavedViews: [
    { id: 'flagged', label: 'Flagged Only', labelUr: 'صرف نشان زد', icon: '🚩', filters: { status: 'Flagged' }, datePreset: 'today', isDefault: false },
    { id: 'today-all', label: "Today's Shifts", labelUr: 'آج کی شفٹس', icon: '📅', filters: {}, datePreset: 'today', isDefault: true },
  ],
};

// ──────────────────────────────────────────────
// REPORT I — INVENTORY & STOCK
// Audit / Inventory, realtime
// Tests: Gauge renderer + Rule Engine stock thresholds
// ──────────────────────────────────────────────

const reportI: ReportConfig = {
  reportId: 'I',
  engineType: 'StockDashboard',
  rendererProfile: 'Inventory',
  title: 'Inventory & Stock',
  titleUr: 'انوینٹری و اسٹاک',
  queryPlan: {
    base: 'TANKS',
    joins: [],
  },
  cacheTier: 'realtime',
  visibleTo: ['Owner', 'Manager'],
  performanceBudgetMs: 2000,
  kpis: [
    { id: 'tankFill', label: 'Avg Tank Fill', labelUr: 'اوسط ٹینک بھرائی', formulaId: 'FORMULA_TANK_FILL_PERCENT', displayType: 'gauge', unit: '%' },
    { id: 'currentStock', label: 'Current Stock', labelUr: 'موجودہ اسٹاک', formulaId: 'FORMULA_CURRENT_STOCK', displayType: 'simple', unit: 'L' },
    { id: 'tankCount', label: 'Tanks', labelUr: 'ٹینکس', displayType: 'simple', unit: '' },
  ],
  rules: [
    { ruleId: 'RULE_TANK_REORDER_LEVEL', appliesTo: 'tankFill' },
  ],
  register: {
    columns: [
      { id: 'name', header: 'Tank', headerUr: 'ٹینک', accessor: 'name', sortable: true },
      { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product', sortable: true, filterable: true },
      { id: 'capacity', header: 'Capacity', headerUr: 'گنجائش', accessor: 'capacity', isNumeric: true },
      { id: 'current', header: 'Current', headerUr: 'موجودہ', accessor: 'currentStock', isNumeric: true, sortable: true },
      { id: 'status', header: 'Status', headerUr: 'حالت', accessor: 'status', isStatus: true },
    ],
    defaultSortColumn: 'name',
    defaultSortDirection: 'asc',
  },
  dependencies: ['T2', 'H'],
  exports: ['pdf', 'excel', 'csv', 'print'],
  // ── Enterprise Rule #129 ──
  searchConfig: {
    placeholder: '🔍 Search Tank Name, Product, Status...',
    placeholderUr: '🔍 ٹینک، پروڈکٹ، حالت تلاش کریں...',
    searchFields: ['name', 'product', 'status'],
  },
  filterGroups: [
    {
      id: 'product',
      label: 'Product',
      labelUr: 'پروڈکٹ',
      type: 'pills',
      source: 'dynamic',
      dynamicColumn: 'product',
      options: [
        { value: 'Petrol', label: 'Petrol', labelUr: 'پٹرول', icon: '🟢' },
        { value: 'Diesel', label: 'Diesel', labelUr: 'ڈیزل', icon: '🟤' },
        { value: 'CNG', label: 'CNG', labelUr: 'سی این جی', icon: '🔵' },
      ],
    },
    {
      id: 'status',
      label: 'Stock Level',
      labelUr: 'اسٹاک کی سطح',
      type: 'pills',
      source: 'static',
      options: [
        { value: 'Low', label: 'Low Stock', labelUr: 'کم اسٹاک', icon: '🔴' },
        { value: 'OK', label: 'Normal', labelUr: 'معمول', icon: '🟢' },
      ],
    },
  ],
  quickActions: [
    { id: 'stockIn', label: '+ Stock In', labelUr: '+ اسٹاک اندراج', icon: '⛽', targetReportId: 'F', color: 'blue' },
    { id: 'tankDip', label: '+ Tank Dip', labelUr: '+ ٹینک ڈیپ', icon: '📏', targetReportId: 'M', color: 'teal' },
  ],
  defaultSavedViews: [
    { id: 'low-stock', label: 'Low Stock Alert', labelUr: 'کم اسٹاک الرٹ', icon: '⚠️', filters: { status: 'Low' }, datePreset: 'today', isDefault: false },
    { id: 'all-tanks', label: 'All Tanks', labelUr: 'تمام ٹینکس', icon: '🛢️', filters: {}, datePreset: 'today', isDefault: true },
  ],
};

// ──────────────────────────────────────────────
// REPORT L1 — CUSTOMER LEDGER
// Ledger / Financial, cached
// Tests: Drilldown Engine's 3-level navigation + Query Engine's join logic
// ──────────────────────────────────────────────

const reportL1: ReportConfig = {
  reportId: 'L1',
  engineType: 'CustomerLedger',
  rendererProfile: 'Financial',
  title: 'Customer Ledger',
  titleUr: 'کسٹمر لیجر',
  queryPlan: {
    base: 'CUSTOMERS',
    joins: [],
  },
  cacheTier: 'cached',
  visibleTo: ['Owner', 'Manager', 'Accountant'],
  performanceBudgetMs: 3000,
  kpis: [
    { id: 'totalOutstanding', label: 'Total Outstanding', labelUr: 'کل بقایا', formulaId: 'FORMULA_CUSTOMER_RECEIVABLE', displayType: 'simple', unit: '₨' },
    { id: 'customerCount', label: 'Customers', labelUr: 'کسٹمرز', displayType: 'simple', unit: '' },
  ],
  rules: [
    { ruleId: 'RULE_CUSTOMER_OVERDUE', appliesTo: 'totalOutstanding' },
  ],
  register: {
    columns: [
      { id: 'name', header: 'Customer', headerUr: 'کسٹمر', accessor: 'name', sortable: true, filterable: true },
      { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
      { id: 'balance', header: 'Outstanding', headerUr: 'بقایا', accessor: 'balance', isCurrency: true, sortable: true },
      { id: 'creditLimit', header: 'Credit Limit', headerUr: 'حد اعتبار', accessor: 'creditLimit', isCurrency: true },
      { id: 'lastPayment', header: 'Last Payment', headerUr: 'آخری ادائیگی', accessor: 'lastPaymentDate', isDate: true },
    ],
    defaultSortColumn: 'balance',
    defaultSortDirection: 'desc',
    summaryFields: ['balance'],
  },
  dependencies: ['O'],
  exports: ['pdf', 'excel', 'csv', 'print'],
};

import { registerAllBusinessReports } from './allBusinessReports';

// ──────────────────────────────────────────────
// REGISTER ALL 54 BUSINESS CENTER REPORTS
// ──────────────────────────────────────────────

export function registerProofReports(): void {
  ReportConfigRegistry.register(reportA);
  ReportConfigRegistry.register(reportP1);
  ReportConfigRegistry.register(reportC2);
  ReportConfigRegistry.register(reportI);
  ReportConfigRegistry.register(reportL1);
  registerAllBusinessReports();
}

// Auto-register on import
registerProofReports();