/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Register Engine — Universal data register for any report
 *
 * Every register auto-provides: Search, Filters, Group, Sort,
 * Export, Infinite Scroll, Column Chooser, Freeze Columns,
 * Audit, Explain, Raw JSON, Timeline.
 * No report ever reimplements these.
 */

import { QueryContext, RegisterResult, RegisterColumnDef, QueryPlan } from './types';
import { QueryEngine } from './QueryEngine';
import { QueryPlanResolver } from './QueryPlanResolver';

interface RegisterDefinition {
  title: string;
  titleUr: string;
  domain: string;
  columns: RegisterColumnDef[];
  defaultSortColumn?: string;
  defaultSortDirection?: 'asc' | 'desc';
  summaryFields?: string[];     // columns to sum in footer
}

const ENGINE_REGISTER_MAP: Record<string, RegisterDefinition> = {
  BusinessDashboard: {
    title: "Today's Transactions", titleUr: 'آج کے لین دین',
    domain: 'SALES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true, filterable: true },
      { id: 'invoiceNo', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true, filterable: true },
      { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'productName', sortable: true, filterable: true },
      { id: 'qty', header: 'Qty (L)', headerUr: 'مقدار', accessor: 'quantity', isNumeric: true, sortable: true },
      { id: 'rate', header: 'Rate', headerUr: 'ریٹ', accessor: 'rate', isCurrency: true, sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
      { id: 'payment', header: 'Payment', headerUr: 'ادائیگی', accessor: 'paymentMethod', sortable: true, filterable: true },
    ]
  },

  SalesRegister: {
    title: 'Sales Register', titleUr: 'سیلز رجسٹر',
    domain: 'SALES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['totalAmount', 'quantity'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true, filterable: true },
      { id: 'invoiceNo', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true },
      { id: 'customer', header: 'Customer', headerUr: 'کسٹمر', accessor: 'customerName', sortable: true, filterable: true },
      { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'productName', sortable: true, filterable: true },
      { id: 'qty', header: 'Qty (L)', headerUr: 'مقدار', accessor: 'quantity', isNumeric: true, sortable: true },
      { id: 'rate', header: 'Rate', headerUr: 'ریٹ', accessor: 'rate', isCurrency: true, sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
      { id: 'payment', header: 'Payment', headerUr: 'ادائیگی', accessor: 'paymentMethod', sortable: true, filterable: true },
      { id: 'operator', header: 'Operator', headerUr: 'آپریٹر', accessor: 'operatorName', sortable: true, filterable: true },
    ]
  },

  StockDashboard: {
    title: 'Tank Stock Register', titleUr: 'ٹینک اسٹاک رجسٹر',
    domain: 'TANKS',
    columns: [
      { id: 'name', header: 'Tank', headerUr: 'ٹینک', accessor: 'name', sortable: true },
      { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product', sortable: true, filterable: true },
      { id: 'capacity', header: 'Capacity', headerUr: 'گنجائش', accessor: 'capacity', isNumeric: true },
      { id: 'current', header: 'Current', headerUr: 'موجودہ', accessor: 'currentStock', isNumeric: true, sortable: true },
      { id: 'status', header: 'Status', headerUr: 'حالت', accessor: 'status', isStatus: true },
    ]
  },

  CashSummary: {
    title: 'Cash Ledger', titleUr: 'کیش لیجر',
    domain: 'CASH_LEDGER', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['amount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'type', header: 'Type', headerUr: 'قسم', accessor: 'type', sortable: true, filterable: true },
      { id: 'desc', header: 'Description', headerUr: 'تفصیل', accessor: 'description' },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'amount', isCurrency: true, sortable: true },
      { id: 'balance', header: 'Balance', headerUr: 'بیلنس', accessor: 'runningBalance', isCurrency: true },
    ]
  },

  ShiftSummary: {
    title: 'Shift Register', titleUr: 'شفٹ رجسٹر',
    domain: 'SHIFTS',
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'shift', header: 'Shift', headerUr: 'شفٹ', accessor: 'shiftName', sortable: true },
      { id: 'operator', header: 'Operator', headerUr: 'آپریٹر', accessor: 'operatorName', sortable: true },
      { id: 'sales', header: 'Sales', headerUr: 'سیلز', accessor: 'totalSales', isCurrency: true, sortable: true },
      { id: 'cash', header: 'Cash', headerUr: 'کیش', accessor: 'cashCollected', isCurrency: true },
      { id: 'bank', header: 'Bank', headerUr: 'بینک', accessor: 'bankCollected', isCurrency: true },
      { id: 'digital', header: 'Digital', headerUr: 'ڈیجیٹل', accessor: 'digitalCollected', isCurrency: true },
      { id: 'variance', header: 'Variance', headerUr: 'فرق', accessor: 'varianceAmount', isCurrency: true, sortable: true },
      { id: 'status', header: 'Status', headerUr: 'حالت', accessor: 'status', isStatus: true },
    ]
  },

  // ──────────────────────────────────────────────
  // PROFIT & LOSS — True Profit waterfall register
  // ──────────────────────────────────────────────
  ProfitReport: {
    title: 'Profit & Loss Register', titleUr: 'منافع و نقصان رجسٹر',
    domain: 'SALES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true, filterable: true },
      { id: 'invoiceNo', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true },
      { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'productName', sortable: true, filterable: true },
      { id: 'qty', header: 'Qty (L)', headerUr: 'مقدار', accessor: 'quantity', isNumeric: true, sortable: true },
      { id: 'rate', header: 'Rate', headerUr: 'ریٹ', accessor: 'rate', isCurrency: true, sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
      { id: 'payment', header: 'Payment', headerUr: 'ادائیگی', accessor: 'paymentMethod', sortable: true, filterable: true },
    ]
  },

  // ──────────────────────────────────────────────
  // CASH VARIANCE — per-shift expected vs submitted cash
  // ──────────────────────────────────────────────
  Variance: {
    title: 'Cash Variance Register', titleUr: 'نقدی فرق رجسٹر',
    domain: 'SHIFTS', defaultSortColumn: 'varianceAmount', defaultSortDirection: 'desc',
    summaryFields: ['varianceAmount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true, filterable: true },
      { id: 'shift', header: 'Shift', headerUr: 'شفٹ', accessor: 'shiftName', sortable: true },
      { id: 'operator', header: 'Operator', headerUr: 'آپریٹر', accessor: 'operatorName', sortable: true, filterable: true },
      { id: 'expected', header: 'Expected', headerUr: 'متوقع', accessor: 'expectedCash', isCurrency: true, sortable: true },
      { id: 'actual', header: 'Actual', headerUr: 'اصل', accessor: 'actualCash', isCurrency: true, sortable: true },
      { id: 'variance', header: 'Variance', headerUr: 'فرق', accessor: 'varianceAmount', isCurrency: true, sortable: true },
      { id: 'reason', header: 'Reason', headerUr: 'وجہ', accessor: 'varianceReason' },
      { id: 'status', header: 'Status', headerUr: 'حالت', accessor: 'status', isStatus: true },
    ]
  },

  ExpenseRegister: {
    title: 'Expense Register', titleUr: 'اخراجات رجسٹر',
    domain: 'EXPENSES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['amount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'category', header: 'Category', headerUr: 'قسم', accessor: 'category', sortable: true, filterable: true },
      { id: 'desc', header: 'Description', headerUr: 'تفصیل', accessor: 'description' },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'amount', isCurrency: true, sortable: true },
      { id: 'paidBy', header: 'Paid By', headerUr: 'ادا کنندہ', accessor: 'paidBy', sortable: true },
    ]
  },

  CustomerLedger: {
    title: 'Customer Directory', titleUr: 'کسٹمر ڈائریکٹری',
    domain: 'CUSTOMERS', defaultSortColumn: 'name',
    summaryFields: ['balance'],
    columns: [
      { id: 'name', header: 'Customer', headerUr: 'کسٹمر', accessor: 'name', sortable: true, filterable: true },
      { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
      { id: 'balance', header: 'Outstanding', headerUr: 'بقایا', accessor: 'balance', isCurrency: true, sortable: true },
      { id: 'creditLimit', header: 'Credit Limit', headerUr: 'حد اعتبار', accessor: 'creditLimit', isCurrency: true },
      { id: 'lastPayment', header: 'Last Payment', headerUr: 'آخری ادائیگی', accessor: 'lastPaymentDate', isDate: true },
    ]
  },

  SupplierLedger: {
    title: 'Supplier Directory', titleUr: 'سپلائر ڈائریکٹری',
    domain: 'SUPPLIERS',
    summaryFields: ['balance'],
    columns: [
      { id: 'name', header: 'Supplier', headerUr: 'سپلائر', accessor: 'name', sortable: true, filterable: true },
      { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
      { id: 'balance', header: 'Payable', headerUr: 'واجب الادا', accessor: 'balance', isCurrency: true, sortable: true },
      { id: 'lastInvoice', header: 'Last Invoice', headerUr: 'آخری انوائس', accessor: 'lastInvoiceDate', isDate: true },
    ]
  },

  BankPosition: {
    title: 'Bank Accounts', titleUr: 'بینک اکاؤنٹس',
    domain: 'BANK_ACCOUNTS',
    summaryFields: ['balance'],
    columns: [
      { id: 'bank', header: 'Bank', headerUr: 'بینک', accessor: 'bankName', sortable: true },
      { id: 'account', header: 'Account #', headerUr: 'اکاؤنٹ نمبر', accessor: 'accountNumber' },
      { id: 'type', header: 'Type', headerUr: 'قسم', accessor: 'accountType', filterable: true },
      { id: 'balance', header: 'Balance', headerUr: 'بیلنس', accessor: 'balance', isCurrency: true, sortable: true },
    ]
  },

  DigitalPayments: {
    title: 'Digital Wallets', titleUr: 'ڈیجیٹل والیٹس',
    domain: 'WALLETS',
    summaryFields: ['balance'],
    columns: [
      { id: 'name', header: 'Wallet', headerUr: 'والیٹ', accessor: 'name', sortable: true },
      { id: 'provider', header: 'Provider', headerUr: 'فراہم کنندہ', accessor: 'provider', filterable: true },
      { id: 'balance', header: 'Balance', headerUr: 'بیلنس', accessor: 'balance', isCurrency: true, sortable: true },
    ]
  },

  PurchaseRegister: {
    title: 'Purchase Register', titleUr: 'خریداری رجسٹر',
    domain: 'FUEL_PURCHASES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['amount', 'quantity'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'supplier', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplierName', sortable: true, filterable: true },
      { id: 'chalan', header: 'Chalan #', headerUr: 'چالان نمبر', accessor: 'chalanNo', sortable: true },
      { id: 'qty', header: 'Qty (L)', headerUr: 'مقدار', accessor: 'quantity', isNumeric: true, sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'amount', isCurrency: true, sortable: true },
    ]
  },

  PriceHistory: {
    title: 'Price History Register', titleUr: 'قیمت ہسٹری رجسٹر',
    domain: 'FUEL_PRICES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'productName', sortable: true, filterable: true },
      { id: 'oldRate', header: 'Old Rate', headerUr: 'پرانا ریٹ', accessor: 'oldRate', isCurrency: true },
      { id: 'rate', header: 'New Rate', headerUr: 'نیا ریٹ', accessor: 'rate', isCurrency: true, sortable: true },
      { id: 'reason', header: 'Reason', headerUr: 'وجہ', accessor: 'reason' },
    ]
  },

  TankDipReport: {
    title: 'Tank Dip Register', titleUr: 'ڈپ رجسٹر',
    domain: 'DIP_READINGS', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'tank', header: 'Tank', headerUr: 'ٹینک', accessor: 'tankName', sortable: true, filterable: true },
      { id: 'dip', header: 'Dip (cm)', headerUr: 'ڈپ', accessor: 'dipLevel', isNumeric: true },
      { id: 'volume', header: 'Volume (L)', headerUr: 'حجم', accessor: 'volume', isNumeric: true, sortable: true },
      { id: 'water', header: 'Water (cm)', headerUr: 'واٹر', accessor: 'waterLevel', isNumeric: true },
    ]
  },

  PumpNozzleReport: {
    title: 'Nozzle Meter Register', titleUr: 'نوزل میٹر رجسٹر',
    domain: 'NOZZLE_READINGS', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'nozzle', header: 'Nozzle', headerUr: 'نوزل', accessor: 'nozzleName', sortable: true, filterable: true },
      { id: 'opening', header: 'Opening', headerUr: 'ابتدائی', accessor: 'openingReading', isNumeric: true },
      { id: 'closing', header: 'Closing', headerUr: 'آخری', accessor: 'closingReading', isNumeric: true },
      { id: 'dispensed', header: 'Dispensed (L)', headerUr: 'ڈسپینس', accessor: 'litres', isNumeric: true, sortable: true },
    ]
  },

  LedgerView: {
    title: 'General Ledger', titleUr: 'جنرل لیجر',
    domain: 'GENERAL_LEDGER', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['amount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'account', header: 'Account', headerUr: 'اکاؤنٹ', accessor: 'account', sortable: true, filterable: true },
      { id: 'type', header: 'Type', headerUr: 'قسم', accessor: 'type', sortable: true, filterable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'amount', isCurrency: true, sortable: true },
      { id: 'ref', header: 'Reference', headerUr: 'حوالہ', accessor: 'reference' },
    ]
  },

  StaffRegister: {
    title: 'Staff Register', titleUr: 'عملہ رجسٹر',
    domain: 'EMPLOYEES', defaultSortColumn: 'name',
    columns: [
      { id: 'name', header: 'Staff', headerUr: 'نام', accessor: 'name', sortable: true, filterable: true },
      { id: 'role', header: 'Role', headerUr: 'کردار', accessor: 'role', sortable: true, filterable: true },
      { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
      { id: 'status', header: 'Status', headerUr: 'حالت', accessor: 'status', isStatus: true },
    ]
  },

  TreasuryDashboard: {
    title: 'Treasury Position', titleUr: 'ٹریژری پوزیشن',
    domain: 'BANK_ACCOUNTS',
    summaryFields: ['balance'],
    columns: [
      { id: 'bank', header: 'Bank', headerUr: 'بینک', accessor: 'bankName', sortable: true },
      { id: 'account', header: 'Account #', headerUr: 'اکاؤنٹ نمبر', accessor: 'accountNumber' },
      { id: 'balance', header: 'Balance', headerUr: 'بیلنس', accessor: 'balance', isCurrency: true, sortable: true },
    ]
  },

  TaxReport: {
    title: 'Tax Register', titleUr: 'ٹیکس رجسٹر',
    domain: 'SALES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'invoice', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true },
      { id: 'amount', header: 'Taxable Amount', headerUr: 'ٹیکس ایبل رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
      { id: 'tax', header: 'Tax', headerUr: 'ٹیکس', accessor: 'taxAmount', isCurrency: true },
    ]
  },

  AuditLog: {
    title: 'Audit Log', titleUr: 'آڈٹ لاگ',
    domain: 'AUDIT_LOGS', defaultSortColumn: 'timestamp', defaultSortDirection: 'desc',
    columns: [
      { id: 'timestamp', header: 'Time', headerUr: 'وقت', accessor: 'timestamp', isDate: true, sortable: true },
      { id: 'user', header: 'User', headerUr: 'صارف', accessor: 'userName', sortable: true, filterable: true },
      { id: 'action', header: 'Action', headerUr: 'عمل', accessor: 'action', sortable: true, filterable: true },
      { id: 'severity', header: 'Severity', headerUr: 'شدت', accessor: 'severity', isStatus: true },
      { id: 'details', header: 'Details', headerUr: 'تفصیل', accessor: 'details' },
    ]
  },

  AssetRegister: {
    title: 'Asset Register', titleUr: 'اثاثہ رجسٹر',
    domain: 'ASSETS', defaultSortColumn: 'name',
    columns: [
      { id: 'name', header: 'Asset', headerUr: 'اثاثہ', accessor: 'name', sortable: true },
      { id: 'type', header: 'Type', headerUr: 'قسم', accessor: 'type', filterable: true },
      { id: 'status', header: 'Status', headerUr: 'حالت', accessor: 'status', isStatus: true },
      { id: 'value', header: 'Value', headerUr: 'قیمت', accessor: 'value', isCurrency: true, sortable: true },
    ]
  },

  AnalyticsDashboard: {
    title: 'Sales Register', titleUr: 'سیلز رجسٹر',
    domain: 'SALES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'invoice', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
    ]
  },

  FleetReport: {
    title: 'Fleet Customers', titleUr: 'فلیٹ کسٹمرز',
    domain: 'CUSTOMERS', defaultSortColumn: 'name',
    summaryFields: ['balance'],
    columns: [
      { id: 'name', header: 'Customer', headerUr: 'کسٹمر', accessor: 'name', sortable: true },
      { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
      { id: 'balance', header: 'Balance', headerUr: 'بیلنس', accessor: 'balance', isCurrency: true, sortable: true },
    ]
  },

  ComplianceReport: {
    title: 'Compliance Register', titleUr: 'کمپلائنس رجسٹر',
    domain: 'AUDIT_LOGS', defaultSortColumn: 'timestamp', defaultSortDirection: 'desc',
    columns: [
      { id: 'timestamp', header: 'Time', headerUr: 'وقت', accessor: 'timestamp', isDate: true, sortable: true },
      { id: 'action', header: 'Action', headerUr: 'عمل', accessor: 'action', sortable: true },
      { id: 'severity', header: 'Severity', headerUr: 'شدت', accessor: 'severity', isStatus: true },
    ]
  },

  BranchComparison: {
    title: 'Branch Sales', titleUr: 'برانچ سیلز',
    domain: 'SALES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'branch', header: 'Branch', headerUr: 'برانچ', accessor: 'branchName', sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
    ]
  },

  AIIntelligence: {
    title: 'Analyzed Sales', titleUr: 'تجزیہ شدہ سیلز',
    domain: 'SALES', defaultSortColumn: 'date', defaultSortDirection: 'desc',
    summaryFields: ['totalAmount'],
    columns: [
      { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
      { id: 'invoice', header: 'Invoice', headerUr: 'انوائس', accessor: 'invoiceNo', sortable: true },
      { id: 'amount', header: 'Amount', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
    ]
  }
};

/**
 * Returns the primary data domain for an engine type (used by the Chart
 * Engine to derive a real daily-activity fallback chart).
 */
export function getPrimaryDomainForEngine(engineType: string): string | null {
  return ENGINE_REGISTER_MAP[engineType]?.domain || null;
}

export class RegisterEngine {
  private static instance: RegisterEngine;
  private queryEngine: QueryEngine;
  private queryPlanResolver: QueryPlanResolver;

  private constructor() {
    this.queryEngine = QueryEngine.getInstance();
    this.queryPlanResolver = QueryPlanResolver.getInstance();
  }

  static getInstance(): RegisterEngine {
    if (!RegisterEngine.instance) {
      RegisterEngine.instance = new RegisterEngine();
    }
    return RegisterEngine.instance;
  }

  async resolveRegister(engineType: string, context: QueryContext, useArchive = false): Promise<RegisterResult | null> {
    const definition = ENGINE_REGISTER_MAP[engineType];
    if (!definition) return null;

    const rawData = await this.queryEngine.query(definition.domain, context, useArchive);

    // Calculate summary row if summaryFields are defined
    let summaryRow: Record<string, any> | undefined;
    if (definition.summaryFields && rawData.documents.length > 0) {
      summaryRow = {};
      definition.summaryFields.forEach(field => {
        const col = definition.columns.find(c => c.accessor === field);
        if (col) {
          summaryRow![field] = rawData.documents.reduce((sum, doc) => sum + (Number(doc[field]) || 0), 0);
        }
      });
    }

    return {
      title: definition.title,
      titleUr: definition.titleUr,
      columns: definition.columns,
      rows: rawData.documents,
      totalCount: rawData.count,
      summaryRow,
      defaultSortColumn: definition.defaultSortColumn,
      defaultSortDirection: definition.defaultSortDirection
    };
  }

  /**
   * v2.1 Patch A.1 — Resolves a register from a declarative queryPlan.
   *
   * This is the config-driven path: reports provide a queryPlan + columns,
   * and this method calls QueryPlanResolver to fetch + join data, then
   * wraps it in a RegisterResult with the provided column definitions.
   *
   * RegisterEngine never sees a collection name — it only receives mergedRows
   * from QueryPlanResolver.
   *
   * @param plan - Declarative query plan (base + joins)
   * @param columns - Column definitions from report config
   * @param context - Tenant context
   * @param title - Register title (English)
   * @param titleUr - Register title (Urdu)
   * @param options - Sort, summary fields, useArchive
   * @returns RegisterResult with merged rows
   */
  async resolveRegisterFromPlan(
    plan: QueryPlan,
    columns: RegisterColumnDef[],
    context: QueryContext,
    title: string,
    titleUr: string,
    options?: {
      defaultSortColumn?: string;
      defaultSortDirection?: 'asc' | 'desc';
      summaryFields?: string[];
      useArchive?: boolean;
    }
  ): Promise<RegisterResult> {
    const useArchive = options?.useArchive === true;

    // Resolve the queryPlan via QueryPlanResolver (base + joins + merge)
    const resolved = await this.queryPlanResolver.resolve(plan, context, useArchive);

    // Calculate summary row if summaryFields are defined
    let summaryRow: Record<string, any> | undefined;
    if (options?.summaryFields && resolved.mergedRows.length > 0) {
      summaryRow = {};
      options.summaryFields.forEach(field => {
        const col = columns.find(c => c.accessor === field);
        if (col) {
          summaryRow![field] = resolved.mergedRows.reduce(
            (sum, doc) => sum + (Number(doc[field]) || 0), 0
          );
        }
      });
    }

    return {
      title,
      titleUr,
      columns,
      rows: resolved.mergedRows,
      totalCount: resolved.mergedRows.length,
      summaryRow,
      defaultSortColumn: options?.defaultSortColumn,
      defaultSortDirection: options?.defaultSortDirection,
    };
  }

  /**
   * v2.1 Patch A.1 — Resolves a register from a ReportConfig's register section.
   *
   * Convenience method that extracts queryPlan + columns from a ReportConfig
   * and delegates to resolveRegisterFromPlan.
   *
   * @param config - Report configuration (must have register + queryPlan)
   * @param context - Tenant context
   * @param useArchive - Read from archive cache
   * @returns RegisterResult or null if no register config
   */
  async resolveRegisterFromConfig(
    config: {
      queryPlan: QueryPlan;
      register?: {
        columns: RegisterColumnDef[];
        defaultSortColumn?: string;
        defaultSortDirection?: 'asc' | 'desc';
        summaryFields?: string[];
      };
      title: string;
      titleUr: string;
    },
    context: QueryContext,
    useArchive = false
  ): Promise<RegisterResult | null> {
    if (!config.register) return null;

    return this.resolveRegisterFromPlan(
      config.queryPlan,
      config.register.columns,
      context,
      config.title,
      config.titleUr,
      {
        defaultSortColumn: config.register.defaultSortColumn,
        defaultSortDirection: config.register.defaultSortDirection,
        summaryFields: config.register.summaryFields,
        useArchive,
      }
    );
  }
}
