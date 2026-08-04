/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * WorkspaceRegistry — Central Process Route & Sub-Workspace Registry
 *
 * Implements Enterprise Rules #130, #131, #135, #162, #163 & #165
 */

export interface WorkspaceRouteDefinition {
  reportId: string;
  workspaceId: string;
  tabId: string;
  label: string;
  labelUr: string;
  description?: string;
  descriptionUr?: string;
}

export const WORKSPACE_REGISTRY: Record<string, WorkspaceRouteDefinition> = {
  // ── 1. LEDGERS DOMAIN ──
  DOMAIN_LEDGER_HOME: {
    reportId: 'DOMAIN_LEDGER_HOME',
    workspaceId: 'ledgers',
    tabId: 'overview',
    label: 'General Accounting Ledgers',
    labelUr: 'جنرل اکاؤنٹنگ لیجرز',
  },
  LEDGER_OVERVIEW: {
    reportId: 'LEDGER_OVERVIEW',
    workspaceId: 'ledgers',
    tabId: 'overview',
    label: 'Ledgers Overview',
    labelUr: 'لیجرز خلاصہ',
  },
  LEDGER_COA: {
    reportId: 'LEDGER_COA',
    workspaceId: 'ledgers',
    tabId: 'coa',
    label: 'Chart of Accounts',
    labelUr: 'چارٹ آف اکاؤنٹس',
  },
  COA: {
    reportId: 'COA',
    workspaceId: 'ledgers',
    tabId: 'coa',
    label: 'Chart of Accounts',
    labelUr: 'چارٹ آف اکاؤنٹس',
  },
  CHART_OF_ACCOUNTS: {
    reportId: 'CHART_OF_ACCOUNTS',
    workspaceId: 'ledgers',
    tabId: 'coa',
    label: 'Chart of Accounts',
    labelUr: 'چارٹ آف اکاؤنٹس',
  },
  LEDGER_GL: {
    reportId: 'LEDGER_GL',
    workspaceId: 'ledgers',
    tabId: 'general',
    label: 'General Ledger',
    labelUr: 'جنرل لیجر',
  },
  GL: {
    reportId: 'GL',
    workspaceId: 'ledgers',
    tabId: 'general',
    label: 'General Ledger',
    labelUr: 'جنرل لیجر',
  },
  GENERAL_LEDGER: {
    reportId: 'GENERAL_LEDGER',
    workspaceId: 'ledgers',
    tabId: 'general',
    label: 'General Ledger',
    labelUr: 'جنرل لیجر',
  },
  LEDGER_CUSTOMER: {
    reportId: 'LEDGER_CUSTOMER',
    workspaceId: 'ledgers',
    tabId: 'customers',
    label: 'Customer Ledgers',
    labelUr: 'کسٹمر لیجرز',
  },
  L1: {
    reportId: 'L1',
    workspaceId: 'ledgers',
    tabId: 'customers',
    label: 'Customer Ledger',
    labelUr: 'کسٹمر لیجر',
  },
  CUSTOMER_LEDGER: {
    reportId: 'CUSTOMER_LEDGER',
    workspaceId: 'ledgers',
    tabId: 'customers',
    label: 'Customer Ledgers',
    labelUr: 'کسٹمر لیجرز',
  },
  RECEIVABLES: {
    reportId: 'RECEIVABLES',
    workspaceId: 'ledgers',
    tabId: 'customers',
    label: 'Debtors Ledger',
    labelUr: 'واجب الوصول لیجر',
  },
  LEDGER_SUPPLIER: {
    reportId: 'LEDGER_SUPPLIER',
    workspaceId: 'ledgers',
    tabId: 'suppliers',
    label: 'Supplier Ledgers',
    labelUr: 'سپلائر لیجرز',
  },
  LED_SUPPLIER: {
    reportId: 'LED_SUPPLIER',
    workspaceId: 'ledgers',
    tabId: 'suppliers',
    label: 'Supplier Ledger',
    labelUr: 'سپلائر لیجر',
  },
  SUPPLIER_LEDGER: {
    reportId: 'SUPPLIER_LEDGER',
    workspaceId: 'ledgers',
    tabId: 'suppliers',
    label: 'Supplier Ledgers',
    labelUr: 'سپلائر لیجرز',
  },
  PAYABLES: {
    reportId: 'PAYABLES',
    workspaceId: 'ledgers',
    tabId: 'suppliers',
    label: 'Creditors Ledger',
    labelUr: 'واجب الادا لیجر',
  },
  LEDGER_CASH: {
    reportId: 'LEDGER_CASH',
    workspaceId: 'ledgers',
    tabId: 'cash',
    label: 'Cash Book Ledger',
    labelUr: 'کیش بک لیجر',
  },
  CASH_BOOK: {
    reportId: 'CASH_BOOK',
    workspaceId: 'ledgers',
    tabId: 'cash',
    label: 'Cash Book',
    labelUr: 'کیش بک',
  },
  LEDGER_BANK: {
    reportId: 'LEDGER_BANK',
    workspaceId: 'ledgers',
    tabId: 'bank',
    label: 'Bank Ledgers',
    labelUr: 'بینک لیجرز',
  },
  LED_BANK: {
    reportId: 'LED_BANK',
    workspaceId: 'ledgers',
    tabId: 'bank',
    label: 'Bank Ledger',
    labelUr: 'بینک لیجر',
  },
  BANK_LEDGER: {
    reportId: 'BANK_LEDGER',
    workspaceId: 'ledgers',
    tabId: 'bank',
    label: 'Bank Ledgers',
    labelUr: 'بینک لیجرز',
  },
  LEDGER_EXPENSE: {
    reportId: 'LEDGER_EXPENSE',
    workspaceId: 'ledgers',
    tabId: 'expenses',
    label: 'Expense Ledgers',
    labelUr: 'اخراجات لیجرز',
  },
  EXPENSE_LEDGER: {
    reportId: 'EXPENSE_LEDGER',
    workspaceId: 'ledgers',
    tabId: 'expenses',
    label: 'Expense Ledgers',
    labelUr: 'اخراجات لیجرز',
  },
  LEDGER_JOURNAL: {
    reportId: 'LEDGER_JOURNAL',
    workspaceId: 'ledgers',
    tabId: 'journals',
    label: 'Journal Entries',
    labelUr: 'جرنل اینٹریز',
  },
  JOURNAL_ENTRIES: {
    reportId: 'JOURNAL_ENTRIES',
    workspaceId: 'ledgers',
    tabId: 'journals',
    label: 'Journal Entries',
    labelUr: 'جرنل اینٹریز',
  },
  LEDGER_TRIAL: {
    reportId: 'LEDGER_TRIAL',
    workspaceId: 'ledgers',
    tabId: 'trial_balance',
    label: 'Trial Balance',
    labelUr: 'ٹرائل بیلنس',
  },
  TRIAL_BALANCE: {
    reportId: 'TRIAL_BALANCE',
    workspaceId: 'ledgers',
    tabId: 'trial_balance',
    label: 'Trial Balance',
    labelUr: 'ٹرائل بیلنس',
  },
  LED_STAFF: {
    reportId: 'LED_STAFF',
    workspaceId: 'ledgers',
    tabId: 'general',
    label: 'Staff Ledger',
    labelUr: 'اسٹاف لیجر',
  },
  LED_WALLET: {
    reportId: 'LED_WALLET',
    workspaceId: 'ledgers',
    tabId: 'general',
    label: 'Digital Wallet Ledger',
    labelUr: 'ڈیجیٹل والیٹ لیجر',
  },

  // ── 2. FUEL OPERATIONS DOMAIN ──
  DOMAIN_FUEL_HOME: {
    reportId: 'DOMAIN_FUEL_HOME',
    workspaceId: 'fuel_operations',
    tabId: 'overview',
    label: 'Fuel Operations',
    labelUr: 'فیول آپریشنز',
  },
  A: {
    reportId: 'A',
    workspaceId: 'fuel_operations',
    tabId: 'sales',
    label: "Today's Fuel Sales",
    labelUr: 'آج کی فیول سیلز',
  },
  FS_REGISTER: {
    reportId: 'FS_REGISTER',
    workspaceId: 'fuel_operations',
    tabId: 'sales',
    label: 'Fuel Sales Register',
    labelUr: 'فیول سیلز رجسٹر',
  },
  FS_PRODUCT: {
    reportId: 'FS_PRODUCT',
    workspaceId: 'fuel_operations',
    tabId: 'products',
    label: 'Product Wise Sales',
    labelUr: 'پروڈکٹ وائز سیلز',
  },
  FS_NOZZLE: {
    reportId: 'FS_NOZZLE',
    workspaceId: 'fuel_operations',
    tabId: 'nozzles',
    label: 'Nozzle Wise Sales',
    labelUr: 'نوزل وائز سیلز',
  },
  FS_TANK: {
    reportId: 'FS_TANK',
    workspaceId: 'fuel_operations',
    tabId: 'overview',
    label: 'Tank Wise Sales',
    labelUr: 'ٹینک وائز سیلز',
  },
  C2: {
    reportId: 'C2',
    workspaceId: 'fuel_operations',
    tabId: 'shifts',
    label: 'Shift Wise Sales',
    labelUr: 'شفٹ وائز سیلز',
  },
  FS_COMPARE: {
    reportId: 'FS_COMPARE',
    workspaceId: 'fuel_operations',
    tabId: 'variance',
    label: 'Sales Comparison',
    labelUr: 'سیلز موازنہ',
  },
  FS_TRENDS: {
    reportId: 'FS_TRENDS',
    workspaceId: 'fuel_operations',
    tabId: 'overview',
    label: 'Sales Trends',
    labelUr: 'سیلز رجحانات',
  },

  // ── 3. INVENTORY DOMAIN ──
  DOMAIN_INV_HOME: {
    reportId: 'DOMAIN_INV_HOME',
    workspaceId: 'inventory',
    tabId: 'overview',
    label: 'Inventory Workspace',
    labelUr: 'انوینٹری ورک اسپیس',
  },
  I: {
    reportId: 'I',
    workspaceId: 'inventory',
    tabId: 'tanks',
    label: 'Current Fuel Stock',
    labelUr: 'موجودہ فیول اسٹاک',
  },
  INV_TANK_REG: {
    reportId: 'INV_TANK_REG',
    workspaceId: 'inventory',
    tabId: 'tanks',
    label: 'Tank Stock Register',
    labelUr: 'ٹینک اسٹاک رجسٹر',
  },
  INV_DIP: {
    reportId: 'INV_DIP',
    workspaceId: 'inventory',
    tabId: 'dip',
    label: 'Dip Readings',
    labelUr: 'ڈیپ ریڈنگز',
  },
  INV_MOVEMENT: {
    reportId: 'INV_MOVEMENT',
    workspaceId: 'inventory',
    tabId: 'movement',
    label: 'Fuel Stock Movement',
    labelUr: 'اسٹاک موومنٹ',
  },
  INV_OPENING: {
    reportId: 'INV_OPENING',
    workspaceId: 'inventory',
    tabId: 'movement',
    label: 'Opening Stock',
    labelUr: 'اوپننگ اسٹاک',
  },
  INV_ADJUST: {
    reportId: 'INV_ADJUST',
    workspaceId: 'inventory',
    tabId: 'reconciliation',
    label: 'Stock Adjustments',
    labelUr: 'اسٹاک ایڈجسٹمنٹ',
  },
  INV_RECON: {
    reportId: 'INV_RECON',
    workspaceId: 'inventory',
    tabId: 'reconciliation',
    label: 'Stock Reconciliation',
    labelUr: 'اسٹاک ری کنسیلیشن',
  },
  INV_LOSS: {
    reportId: 'INV_LOSS',
    workspaceId: 'inventory',
    tabId: 'reconciliation',
    label: 'Stock Loss / Gain',
    labelUr: 'اسٹاک نقصان / منافع',
  },

  // ── 4. PURCHASES DOMAIN ──
  DOMAIN_PUR_HOME: {
    reportId: 'DOMAIN_PUR_HOME',
    workspaceId: 'purchases',
    tabId: 'overview',
    label: 'Purchases & Procurement Workspace',
    labelUr: 'خریداری و پروکیورمنٹ ورک اسپیس',
  },
  PUR_HISTORY: {
    reportId: 'PUR_HISTORY',
    workspaceId: 'purchases',
    tabId: 'register',
    label: 'Purchase History',
    labelUr: 'خریداری کی تاریخ',
  },
  PUR_REGISTER: {
    reportId: 'PUR_REGISTER',
    workspaceId: 'purchases',
    tabId: 'register',
    label: 'Purchase Register',
    labelUr: 'خریداری رجسٹر',
  },
  PUR_DELIVERIES: {
    reportId: 'PUR_DELIVERIES',
    workspaceId: 'purchases',
    tabId: 'bowser',
    label: 'Supplier Deliveries',
    labelUr: 'سپلائر ڈیلیوریز',
  },
  PUR_PENDING: {
    reportId: 'PUR_PENDING',
    workspaceId: 'purchases',
    tabId: 'bowser',
    label: 'Pending Deliveries',
    labelUr: 'زیر التوا ڈیلیوریز',
  },
  PUR_RETURNS: {
    reportId: 'PUR_RETURNS',
    workspaceId: 'purchases',
    tabId: 'register',
    label: 'Purchase Returns',
    labelUr: 'خریداری واپسی',
  },
  PUR_COMPARE: {
    reportId: 'PUR_COMPARE',
    workspaceId: 'purchases',
    tabId: 'overview',
    label: 'Purchase Comparison',
    labelUr: 'خریداری موازنہ',
  },

  // ── 5. FINANCE DOMAIN ──
  DOMAIN_FIN_HOME: {
    reportId: 'DOMAIN_FIN_HOME',
    workspaceId: 'finance',
    tabId: 'overview',
    label: 'Finance Workspace',
    labelUr: 'فائنانس ورک اسپیس',
  },
  FIN_CASHBOOK: {
    reportId: 'FIN_CASHBOOK',
    workspaceId: 'finance',
    tabId: 'cash',
    label: 'Cash Book',
    labelUr: 'کیش بک',
  },
  FIN_BANK: {
    reportId: 'FIN_BANK',
    workspaceId: 'finance',
    tabId: 'bank',
    label: 'Bank Ledger',
    labelUr: 'بینک لیجر',
  },
  FIN_DIGITAL: {
    reportId: 'FIN_DIGITAL',
    workspaceId: 'finance',
    tabId: 'digital',
    label: 'Digital Cash',
    labelUr: 'ڈیجیٹل کیش',
  },
  FIN_POSITION: {
    reportId: 'FIN_POSITION',
    workspaceId: 'finance',
    tabId: 'cash',
    label: 'Cash Position',
    labelUr: 'کیش پوزیشن',
  },
  FIN_PL: {
    reportId: 'FIN_PL',
    workspaceId: 'finance',
    tabId: 'pl',
    label: 'Profit & Loss',
    labelUr: 'نفع و نقصان',
  },
  P1: {
    reportId: 'P1',
    workspaceId: 'finance',
    tabId: 'pl',
    label: 'True Profit',
    labelUr: 'اصل منافع',
  },
  FIN_CLOSING: {
    reportId: 'FIN_CLOSING',
    workspaceId: 'finance',
    tabId: 'closing',
    label: 'Daily Closing',
    labelUr: 'روزانہ بندش',
  },
  FIN_EXPENSE: {
    reportId: 'FIN_EXPENSE',
    workspaceId: 'finance',
    tabId: 'expenses',
    label: 'Expense Register',
    labelUr: 'اخراجات رجسٹر',
  },

  // ── 6. CUSTOMERS DOMAIN ──
  DOMAIN_CUS_HOME: {
    reportId: 'DOMAIN_CUS_HOME',
    workspaceId: 'customers',
    tabId: 'overview',
    label: 'Customers Workspace',
    labelUr: 'گاہک ورک اسپیس',
  },
  CUS_OVERVIEW: {
    reportId: 'CUS_OVERVIEW',
    workspaceId: 'customers',
    tabId: 'overview',
    label: 'Customer AR Overview',
    labelUr: 'گاہک اے آر خلاصہ',
  },
  CUS_REGISTER: {
    reportId: 'CUS_REGISTER',
    workspaceId: 'customers',
    tabId: 'register',
    label: 'Customer Register',
    labelUr: 'گاہک رجسٹر',
  },
  CUS_LEDGER: {
    reportId: 'CUS_LEDGER',
    workspaceId: 'customers',
    tabId: 'ledger',
    label: 'Customer Ledger',
    labelUr: 'کسٹمر لیجر',
  },
  CUS_OUTSTANDING: {
    reportId: 'CUS_OUTSTANDING',
    workspaceId: 'customers',
    tabId: 'outstanding',
    label: 'Outstanding Receivables',
    labelUr: 'واجب الوصول بقایا',
  },
  CUS_RECOVERY: {
    reportId: 'CUS_RECOVERY',
    workspaceId: 'customers',
    tabId: 'recovery',
    label: 'Recovery Center 💰',
    labelUr: 'ریکوری سینٹر 💰',
  },
  CUS_AGING: {
    reportId: 'CUS_AGING',
    workspaceId: 'customers',
    tabId: 'aging',
    label: 'Aging Analysis',
    labelUr: 'ایجنگ تجزیہ',
  },
  CUS_CREDIT_LIMITS: {
    reportId: 'CUS_CREDIT_LIMITS',
    workspaceId: 'customers',
    tabId: 'credit_limits',
    label: 'Credit Limits & Risk Control',
    labelUr: 'کریڈٹ لمٹس و رسک کنٹرول',
  },
  CUS_STATEMENTS: {
    reportId: 'CUS_STATEMENTS',
    workspaceId: 'customers',
    tabId: 'statements',
    label: 'Customer Account Statements',
    labelUr: 'کسٹمر اکاؤنٹ سٹیٹمنٹس',
  },
  CUS_ANALYTICS: {
    reportId: 'CUS_ANALYTICS',
    workspaceId: 'customers',
    tabId: 'analytics',
    label: 'Customer Sales Analytics',
    labelUr: 'کسٹمر سیلز تجزیات',
  },
  CUS_AUDIT: {
    reportId: 'CUS_AUDIT',
    workspaceId: 'customers',
    tabId: 'audit',
    label: 'Customer Audit Trail',
    labelUr: 'کسٹمر آڈٹ ٹریل',
  },

  // ── 7. SUPPLIERS DOMAIN ──
  DOMAIN_SUP_HOME: {
    reportId: 'DOMAIN_SUP_HOME',
    workspaceId: 'suppliers',
    tabId: 'overview',
    label: 'Suppliers Workspace',
    labelUr: 'سپلائرز ورک اسپیس',
  },
  SUP_REGISTER: {
    reportId: 'SUP_REGISTER',
    workspaceId: 'suppliers',
    tabId: 'overview',
    label: 'Supplier Register',
    labelUr: 'سپلائر رجسٹر',
  },
  SUP_OUTSTANDING: {
    reportId: 'SUP_OUTSTANDING',
    workspaceId: 'suppliers',
    tabId: 'overview',
    label: 'Outstanding Payables',
    labelUr: 'واجب الادا بقایا',
  },
  SUP_PAYMENTS: {
    reportId: 'SUP_PAYMENTS',
    workspaceId: 'suppliers',
    tabId: 'overview',
    label: 'Supplier Payment Center',
    labelUr: 'سپلائر ادائیگی سینٹر',
  },
  SUP_HISTORY: {
    reportId: 'SUP_HISTORY',
    workspaceId: 'suppliers',
    tabId: 'overview',
    label: 'Purchase History',
    labelUr: 'خریداری کی تاریخ',
  },

  // ── 8. STAFF DOMAIN ──
  DOMAIN_STF_HOME: {
    reportId: 'DOMAIN_STF_HOME',
    workspaceId: 'staff',
    tabId: 'overview',
    label: 'Staff Workspace',
    labelUr: 'اسٹاف ورک اسپیس',
  },
  STF_PERFORMANCE: {
    reportId: 'STF_PERFORMANCE',
    workspaceId: 'staff',
    tabId: 'overview',
    label: 'Staff Performance',
    labelUr: 'اسٹاف کارکردگی',
  },
  STF_ATTENDANCE: {
    reportId: 'STF_ATTENDANCE',
    workspaceId: 'staff',
    tabId: 'overview',
    label: 'Attendance',
    labelUr: 'حاضری',
  },
  STF_SALARY: {
    reportId: 'STF_SALARY',
    workspaceId: 'staff',
    tabId: 'overview',
    label: 'Salary',
    labelUr: 'تنخواہ',
  },
  STF_SHIFTS: {
    reportId: 'STF_SHIFTS',
    workspaceId: 'staff',
    tabId: 'overview',
    label: 'Shift History',
    labelUr: 'شفٹ کی تاریخ',
  },

  // ── 9. PRICING DOMAIN ──
  DOMAIN_PRC_HOME: {
    reportId: 'DOMAIN_PRC_HOME',
    workspaceId: 'pricing',
    tabId: 'overview',
    label: 'Pricing Workspace',
    labelUr: 'پرائسنگ ورک اسپیس',
  },
  PRC_HISTORY: {
    reportId: 'PRC_HISTORY',
    workspaceId: 'pricing',
    tabId: 'overview',
    label: 'Price Change History',
    labelUr: 'قیمت تبدیلی کی تاریخ',
  },
  PRC_RATES: {
    reportId: 'PRC_RATES',
    workspaceId: 'pricing',
    tabId: 'overview',
    label: 'Product Rates',
    labelUr: 'پروڈکٹ ریٹس',
  },
  PRC_MARGIN: {
    reportId: 'PRC_MARGIN',
    workspaceId: 'pricing',
    tabId: 'overview',
    label: 'Margin Analysis',
    labelUr: 'مارجن تجزیہ',
  },

  // ── 10. ANALYTICS DOMAIN ──
  DOMAIN_ANL_HOME: {
    reportId: 'DOMAIN_ANL_HOME',
    workspaceId: 'analytics',
    tabId: 'overview',
    label: 'Analytics Workspace',
    labelUr: 'اینالیٹکس ورک اسپیس',
  },
  ANL_EXEC: {
    reportId: 'ANL_EXEC',
    workspaceId: 'analytics',
    tabId: 'overview',
    label: 'Executive Dashboard',
    labelUr: 'ایگزیکٹو ڈیش بورڈ',
  },
  ANL_AI: {
    reportId: 'ANL_AI',
    workspaceId: 'analytics',
    tabId: 'overview',
    label: 'AI Insights',
    labelUr: 'اے آئی بصیرت',
  },
  ANL_TRENDS: {
    reportId: 'ANL_TRENDS',
    workspaceId: 'analytics',
    tabId: 'overview',
    label: 'Trends',
    labelUr: 'رجحانات',
  },
  ANL_FORECAST: {
    reportId: 'ANL_FORECAST',
    workspaceId: 'analytics',
    tabId: 'overview',
    label: 'Forecast',
    labelUr: 'پیشنگوئی',
  },
};

/**
 * Resolves a report or process ID into its target domain workspace and tab mapping.
 */
export function resolveWorkspaceRoute(reportId: string): WorkspaceRouteDefinition | undefined {
  if (!reportId) return undefined;
  const key = reportId.trim();

  // Direct match
  if (WORKSPACE_REGISTRY[key]) {
    return WORKSPACE_REGISTRY[key];
  }

  // Upper-case match
  const upperKey = key.toUpperCase();
  if (WORKSPACE_REGISTRY[upperKey]) {
    return WORKSPACE_REGISTRY[upperKey];
  }

  // Soft fallback matching by reportId
  for (const route of Object.values(WORKSPACE_REGISTRY)) {
    if (route.reportId.toUpperCase() === upperKey) {
      return route;
    }
  }

  return undefined;
}