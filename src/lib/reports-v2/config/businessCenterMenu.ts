/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0 — Business Center Menu
 *
 * ENTERPRISE RULE #130 — Business-Process-Oriented Navigation.
 *
 * The Business Center is NOT a flat list of reports. It is an operational
 * control room where every business process is discoverable through grouped,
 * expandable navigation. The Dashboard is only the entry point; the real power
 * lies in Business Reports & Registers.
 *
 * This is the SINGLE SOURCE OF TRUTH for the Business Center sidebar structure.
 * Each item's `reportId` maps to a registered ReportConfig (ReportConfigRegistry).
 * Items whose report does not yet exist fall back gracefully (marked comingSoon).
 */

export interface BusinessMenuItem {
  /** Report id — maps to a ReportConfig in ReportConfigRegistry */
  reportId: string;
  label: string;
  labelUr: string;
  /** When the underlying ReportConfig is not yet registered */
  comingSoon?: boolean;
}

export interface BusinessMenuGroup {
  id: string;
  label: string;
  labelUr: string;
  /** Emoji used in the sidebar group header */
  emoji: string;
  /** lucide-react icon name (resolved by the navigation component) */
  iconName: string;
  /** Dedicated Domain Workspace Home Report ID */
  homeReportId: string;
  items: BusinessMenuItem[];
}

/**
 * The Business Center grouped navigation.
 * Order matters — groups render top-to-bottom.
 */
export const BUSINESS_CENTER_MENU: readonly BusinessMenuGroup[] = [
  {
    id: 'fuel_operations',
    label: 'Fuel Operations',
    labelUr: 'فیول آپریشنز',
    emoji: '⛽',
    iconName: 'Fuel',
    homeReportId: 'DOMAIN_FUEL_HOME',
    items: [
      { reportId: 'A', label: "Today's Fuel Sales", labelUr: 'آج کی فیول سیلز' },
      { reportId: 'FS_REGISTER', label: 'Fuel Sales Register', labelUr: 'فیول سیلز رجسٹر' },
      { reportId: 'FS_PRODUCT', label: 'Product Wise Sales', labelUr: 'پروڈکٹ وائز سیلز' },
      { reportId: 'FS_NOZZLE', label: 'Nozzle Wise Sales', labelUr: 'نوزل وائز سیلز' },
      { reportId: 'FS_TANK', label: 'Tank Wise Sales', labelUr: 'ٹینک وائز سیلز' },
      { reportId: 'C2', label: 'Shift Wise Sales', labelUr: 'شفٹ وائز سیلز' },
      { reportId: 'FS_COMPARE', label: 'Sales Comparison', labelUr: 'سیلز موازنہ' },
      { reportId: 'FS_TRENDS', label: 'Sales Trends', labelUr: 'سیلز رجحانات' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    labelUr: 'انوینٹری',
    emoji: '📦',
    iconName: 'Package',
    homeReportId: 'DOMAIN_INV_HOME',
    items: [
      { reportId: 'I', label: 'Current Fuel Stock', labelUr: 'موجودہ فیول اسٹاک' },
      { reportId: 'INV_TANK_REG', label: 'Tank Stock Register', labelUr: 'ٹینک اسٹاک رجسٹر' },
      { reportId: 'INV_DIP', label: 'Dip Readings', labelUr: 'ڈیپ ریڈنگز' },
      { reportId: 'INV_MOVEMENT', label: 'Fuel Stock Movement', labelUr: 'اسٹاک موومنٹ' },
      { reportId: 'INV_OPENING', label: 'Opening Stock', labelUr: 'اوپننگ اسٹاک' },
      { reportId: 'INV_ADJUST', label: 'Stock Adjustments', labelUr: 'اسٹاک ایڈجسٹمنٹ' },
      { reportId: 'INV_RECON', label: 'Stock Reconciliation', labelUr: 'اسٹاک ری کنسیلیشن' },
      { reportId: 'INV_LOSS', label: 'Stock Loss / Gain', labelUr: 'اسٹاک نقصان / منافع' },
    ],
  },
  {
    id: 'purchases',
    label: 'Purchases',
    labelUr: 'خریداری',
    emoji: '🛒',
    iconName: 'ShoppingCart',
    homeReportId: 'DOMAIN_PUR_HOME',
    items: [
      { reportId: 'PUR_HISTORY', label: 'Purchase History', labelUr: 'خریداری کی تاریخ' },
      { reportId: 'PUR_REGISTER', label: 'Purchase Register', labelUr: 'خریداری رجسٹر' },
      { reportId: 'PUR_DELIVERIES', label: 'Supplier Deliveries', labelUr: 'سپلائر ڈیلیوریز' },
      { reportId: 'PUR_PENDING', label: 'Pending Deliveries', labelUr: 'زیر التوا ڈیلیوریز' },
      { reportId: 'PUR_RETURNS', label: 'Purchase Returns', labelUr: 'خریداری واپسی' },
      { reportId: 'PUR_COMPARE', label: 'Purchase Comparison', labelUr: 'خریداری موازنہ' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    labelUr: 'مالیات',
    emoji: '💰',
    iconName: 'DollarSign',
    homeReportId: 'DOMAIN_FIN_HOME',
    items: [
      { reportId: 'FIN_CASHBOOK', label: 'Cash Book', labelUr: 'کیش بک' },
      { reportId: 'FIN_BANK', label: 'Bank Ledger', labelUr: 'بینک لیجر' },
      { reportId: 'FIN_DIGITAL', label: 'Digital Cash', labelUr: 'ڈیجیٹل کیش' },
      { reportId: 'FIN_POSITION', label: 'Cash Position', labelUr: 'کیش پوزیشن' },
      { reportId: 'FIN_PL', label: 'Profit & Loss', labelUr: 'نفع و نقصان' },
      { reportId: 'P1', label: 'True Profit', labelUr: 'اصل منافع' },
      { reportId: 'FIN_CLOSING', label: 'Daily Closing', labelUr: 'روزانہ بندش' },
      { reportId: 'FIN_EXPENSE', label: 'Expense Register', labelUr: 'اخراجات رجسٹر' },
    ],
  },
  {
    id: 'ledgers',
    label: 'Ledgers',
    labelUr: 'کھاتے',
    emoji: '📒',
    iconName: 'BookOpen',
    homeReportId: 'DOMAIN_LEDGER_HOME',
    items: [
      { reportId: 'L1', label: 'Customer Ledger', labelUr: 'کسٹمر لیجر' },
      { reportId: 'LED_SUPPLIER', label: 'Supplier Ledger', labelUr: 'سپلائر لیجر' },
      { reportId: 'LED_STAFF', label: 'Staff Ledger', labelUr: 'اسٹاف لیجر' },
      { reportId: 'LED_BANK', label: 'Bank Ledger', labelUr: 'بینک لیجر' },
      { reportId: 'LED_WALLET', label: 'Digital Wallet Ledger', labelUr: 'ڈیجیٹل والیٹ لیجر' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    labelUr: 'گاہک',
    emoji: '👥',
    iconName: 'Users',
    homeReportId: 'DOMAIN_CUS_HOME',
    items: [
      { reportId: 'CUS_REGISTER', label: 'Customer Register', labelUr: 'گاہک رجسٹر' },
      { reportId: 'CUS_OUTSTANDING', label: 'Outstanding', labelUr: 'بقایا' },
      { reportId: 'CUS_RECOVERY', label: 'Recovery', labelUr: 'وصولی' },
      { reportId: 'CUS_AGING', label: 'Aging Report', labelUr: 'ایجنگ رپورٹ' },
    ],
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    labelUr: 'سپلائرز',
    emoji: '🚛',
    iconName: 'Truck',
    homeReportId: 'DOMAIN_SUP_HOME',
    items: [
      { reportId: 'SUP_REGISTER', label: 'Supplier Register', labelUr: 'سپلائر رجسٹر' },
      { reportId: 'SUP_OUTSTANDING', label: 'Outstanding', labelUr: 'بقایا' },
      { reportId: 'SUP_PAYMENTS', label: 'Payments', labelUr: 'ادائیگیاں' },
      { reportId: 'SUP_HISTORY', label: 'Purchase History', labelUr: 'خریداری کی تاریخ' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    labelUr: 'عملہ',
    emoji: '👨‍💼',
    iconName: 'UserCog',
    homeReportId: 'DOMAIN_STF_HOME',
    items: [
      { reportId: 'STF_PERFORMANCE', label: 'Staff Performance', labelUr: 'اسٹاف کارکردگی' },
      { reportId: 'STF_ATTENDANCE', label: 'Attendance', labelUr: 'حاضری' },
      { reportId: 'STF_SALARY', label: 'Salary', labelUr: 'تنخواہ' },
      { reportId: 'STF_SHIFTS', label: 'Shift History', labelUr: 'شفٹ کی تاریخ' },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    labelUr: 'قیمتیں',
    emoji: '⚙️',
    iconName: 'Tag',
    homeReportId: 'DOMAIN_PRC_HOME',
    items: [
      { reportId: 'PRC_HISTORY', label: 'Price Change History', labelUr: 'قیمت تبدیلی کی تاریخ' },
      { reportId: 'PRC_RATES', label: 'Product Rates', labelUr: 'پروڈکٹ ریٹس' },
      { reportId: 'PRC_MARGIN', label: 'Margin Analysis', labelUr: 'مارجن تجزیہ' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    labelUr: 'تجزیات',
    emoji: '📈',
    iconName: 'TrendingUp',
    homeReportId: 'DOMAIN_ANL_HOME',
    items: [
      { reportId: 'ANL_EXEC', label: 'Executive Dashboard', labelUr: 'ایگزیکٹو ڈیش بورڈ' },
      { reportId: 'ANL_AI', label: 'AI Insights', labelUr: 'اے آئی بصیرت' },
      { reportId: 'ANL_TRENDS', label: 'Trends', labelUr: 'رجحانات' },
      { reportId: 'ANL_FORECAST', label: 'Forecast', labelUr: 'پیشنگوئی' },
    ],
  },
] as const;

/** Flat lookup: reportId -> { label, labelUr, groupId } for breadcrumbs/recents. */
export function findMenuItem(reportId: string): (BusinessMenuItem & { groupId: string; groupLabel: string; groupLabelUr: string }) | null {
  for (const group of BUSINESS_CENTER_MENU) {
    const item = group.items.find((i) => i.reportId === reportId);
    if (item) {
      return { ...item, groupId: group.id, groupLabel: group.label, groupLabelUr: group.labelUr };
    }
  }
  return null;
}

/** All report ids that are actually available (not comingSoon). */
export function getAvailableReportIds(): string[] {
  const ids: string[] = [];
  for (const group of BUSINESS_CENTER_MENU) {
    for (const item of group.items) {
      if (!item.comingSoon) ids.push(item.reportId);
    }
  }
  return ids;
}
