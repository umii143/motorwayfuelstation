/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FuelPro Enterprise Reports Platform v2.1 — Master Report Manifest Specifications
 * Rule #125: Every Report must be generated from the Enterprise Report Manifest.
 */

export type ReportCategoryDomain =
  | 'R-000' // Executive & Core Reports (R-001 - R-099)
  | 'R-100' // Financial Intelligence (R-100 - R-199)
  | 'R-200' // Fuel Operations Intelligence (R-200 - R-299)
  | 'R-300' // Inventory Intelligence (R-300 - R-399)
  | 'R-400' // Customer & CRM Intelligence (R-400 - R-499)
  | 'R-500' // Supplier & Procurement Intelligence (R-500 - R-599)
  | 'R-600' // Treasury & Banking Intelligence (R-600 - R-699)
  | 'R-700' // HR & Workforce Intelligence (R-700 - R-799)
  | 'R-800' // Compliance & Audit Intelligence (R-800 - R-899)
  | 'R-900'; // AI & Predictive Intelligence (R-900 - R-999)

export type LifecycleState =
  | 'LOADING'
  | 'REALTIME_SYNC'
  | 'NO_DATA'
  | 'PARTIAL_DATA'
  | 'VERIFIED'
  | 'OUTDATED'
  | 'OFFLINE'
  | 'PERMISSION_DENIED';

export interface KPIConfig {
  id: string;
  labelEn: string;
  labelUr: string;
  metricKey: string;
  formulaRuleId: string;
  sourceCollections: string[];
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'area' | 'pie' | 'radar';
  dataKeyX: string;
  dataKeyY: string;
}

export interface RegisterColumnConfig {
  key: string;
  labelEn: string;
  labelUr: string;
  isNumeric?: boolean;
  isCurrency?: boolean;
}

export interface ReportManifest {
  id: string; // e.g. "R-01"
  domain: ReportCategoryDomain;
  simpleNameEn: string;
  simpleNameUr: string;
  enterpriseNameEn: string;
  enterpriseNameUr: string;
  descriptionEn: string;
  descriptionUr: string;

  collections: string[];
  formulaRules: string[];
  requiredPermissions: string[];

  kpis: KPIConfig[];
  charts: ChartConfig[];
  registerColumns: RegisterColumnConfig[];
  exports: ('pdf' | 'csv' | 'excel' | 'whatsapp' | 'email' | 'print' | 'json')[];
  drilldownPath: string[];
  aiCapabilities: string[];

  isRealtime: boolean;
  version: string;
  certificationStatus: 'CERTIFIED' | 'PRODUCTION' | 'BETA';
  readinessScore: number; // 0 to 100
}

export const MASTER_REPORT_MANIFESTS: Record<string, ReportManifest> = {
  'R-01': {
    id: 'R-01',
    domain: 'R-000',
    simpleNameEn: 'Business Overview Scorecard',
    simpleNameUr: 'کاروباری عمومی رپورٹ',
    enterpriseNameEn: 'Enterprise Business Score Dashboard',
    enterpriseNameUr: 'انٹرپرائز بزنس اسکور ڈیش بورڈ',
    descriptionEn: 'Overall enterprise health score combining revenue, margins, compliance, and operational KPIs.',
    descriptionUr: 'ریونیو، مارجنز، تعمیل اور آپریشنل KPIs کا جائزہ۔',
    collections: ['shifts', 'sales', 'inventory', 'expenses', 'banks', 'ledger'],
    formulaRules: ['Rule #01', 'Rule #03', 'Rule #04', 'Rule #84'],
    requiredPermissions: ['view_reports_executive'],
    kpis: [
      { id: 'kpi-1', labelEn: 'Sales Revenue', labelUr: 'کل فروخت', metricKey: 'totalAmount', formulaRuleId: 'Rule #01', sourceCollections: ['sales', 'shifts'], isCurrency: true },
      { id: 'kpi-2', labelEn: 'Average Sale', labelUr: 'اوسط فروخت', metricKey: 'avgValue', formulaRuleId: 'Rule #06', sourceCollections: ['sales'], isCurrency: true },
      { id: 'kpi-3', labelEn: 'Audited Rows', labelUr: 'آڈٹ شدہ انٹریز', metricKey: 'recordCount', formulaRuleId: 'Rule #84', sourceCollections: ['ledger'], suffix: ' Rows' },
      { id: 'kpi-4', labelEn: 'Gross Margin', labelUr: 'گراس منافع', metricKey: 'grossProfit', formulaRuleId: 'Rule #03', sourceCollections: ['sales', 'inventory'], isCurrency: true }
    ],
    charts: [
      { id: 'c1', title: 'Daily Revenue Trend', type: 'area', dataKeyX: 'date', dataKeyY: 'amount' }
    ],
    registerColumns: [
      { key: 'date', labelEn: 'Date', labelUr: 'تاریخ' },
      { key: 'sourceRef', labelEn: 'Ref Voucher', labelUr: 'حوالہ' },
      { key: 'staffName', labelEn: 'Operator', labelUr: 'اسٹاف' },
      { key: 'productCategory', labelEn: 'Category', labelUr: 'زمرہ' },
      { key: 'amount', labelEn: 'Amount (PKR)', labelUr: 'رقم', isNumeric: true, isCurrency: true },
      { key: 'approvalStatus', labelEn: 'Audit Status', labelUr: 'اسٹیٹس' }
    ],
    exports: ['pdf', 'csv', 'excel', 'whatsapp', 'print'],
    drilldownPath: ['Card', 'Analytics', 'Register', 'Voucher', 'Journal', 'Firebase Doc', 'Audit'],
    aiCapabilities: ['root_cause_analysis', 'sales_forecast', 'variance_explainer'],
    isRealtime: true,
    version: '2.1.0',
    certificationStatus: 'CERTIFIED',
    readinessScore: 100
  },
  'R-11': {
    id: 'R-11',
    domain: 'R-100',
    simpleNameEn: 'Daily Revenue Summary',
    simpleNameUr: 'روزانہ آمدنی کی تفصیل',
    enterpriseNameEn: 'Daily Operational Revenue Summary',
    enterpriseNameUr: 'روزانہ آپریشنل ریونیو کا خلاصہ',
    descriptionEn: 'Total revenue breakdown across fuel types, shop sales, and services.',
    descriptionUr: 'پیٹرول، ڈیزل، لیوبز اور دیگر مصنوعات کی فروخت کا تفصیلی جائزئہ۔',
    collections: ['shifts', 'meterReadings', 'lubePosSales'],
    formulaRules: ['Rule #01', 'Rule #02'],
    requiredPermissions: ['view_reports_financial'],
    kpis: [
      { id: 'kpi-11-1', labelEn: 'Gross Sales', labelUr: 'مجموعی فروخت', metricKey: 'totalAmount', formulaRuleId: 'Rule #01', sourceCollections: ['shifts'], isCurrency: true },
      { id: 'kpi-11-2', labelEn: 'Nozzle Sales Vol', labelUr: 'نازل والیوم', metricKey: 'totalVolume', formulaRuleId: 'Rule #02', sourceCollections: ['meterReadings'], suffix: ' Ltr' }
    ],
    charts: [
      { id: 'c11-1', title: 'Fuel Category Sales', type: 'bar', dataKeyX: 'productCategory', dataKeyY: 'amount' }
    ],
    registerColumns: [
      { key: 'date', labelEn: 'Date', labelUr: 'تاریخ' },
      { key: 'time', labelEn: 'Shift', labelUr: 'شفٹ' },
      { key: 'productCategory', labelEn: 'Product', labelUr: 'پروڈکٹ' },
      { key: 'quantity', labelEn: 'Liters / Qty', labelUr: 'مقدار', isNumeric: true },
      { key: 'rate', labelEn: 'OGRA Rate', labelUr: 'نرخ', isNumeric: true, isCurrency: true },
      { key: 'amount', labelEn: 'Total (PKR)', labelUr: 'کل رقم', isNumeric: true, isCurrency: true }
    ],
    exports: ['pdf', 'csv', 'excel', 'print'],
    drilldownPath: ['Shift', 'Meter Readings', 'Voucher', 'Firebase Doc'],
    aiCapabilities: ['shift_efficiency_explainer', 'dispenser_calibration_check'],
    isRealtime: true,
    version: '2.1.0',
    certificationStatus: 'CERTIFIED',
    readinessScore: 100
  },
  'R-22': {
    id: 'R-22',
    domain: 'R-200',
    simpleNameEn: 'Tank Hydrostatic Inventory',
    simpleNameUr: 'ٹینک اسٹاک کی صورتحال',
    enterpriseNameEn: 'Hydrostatic Tank Dip & Reconciliation Report',
    enterpriseNameUr: 'ہائیڈروسٹیٹک ٹینک ڈپ اور مفاہمت کی رپورٹ',
    descriptionEn: 'Realtime tank storage volumes, ATG dip telemetry, dead stock, and pumpable volume.',
    descriptionUr: 'ٹینک لیول، اے ٹی جی ڈپ ڈیٹا، اور کل پمپ ایبل اسٹاک کا تجزیہ۔',
    collections: ['tanks', 'stockTransactions'],
    formulaRules: ['Rule #05'],
    requiredPermissions: ['view_reports_inventory'],
    kpis: [
      { id: 'kpi-22-1', labelEn: 'Physical Stock', labelUr: 'جسمانی اسٹاک', metricKey: 'totalVolume', formulaRuleId: 'Rule #05', sourceCollections: ['tanks'], suffix: ' Ltr' }
    ],
    charts: [
      { id: 'c22-1', title: 'Tank Storage Dips', type: 'bar', dataKeyX: 'productCategory', dataKeyY: 'quantity' }
    ],
    registerColumns: [
      { key: 'date', labelEn: 'Timestamp', labelUr: 'وقت' },
      { key: 'productCategory', labelEn: 'Tank ID / Fuel', labelUr: 'ٹینک' },
      { key: 'quantity', labelEn: 'Current Dip (Ltr)', labelUr: 'موجودہ ڈپ', isNumeric: true },
      { key: 'amount', labelEn: 'Asset Value (PKR)', labelUr: 'اثاثہ مالیت', isNumeric: true, isCurrency: true }
    ],
    exports: ['pdf', 'excel', 'print'],
    drilldownPath: ['Tank', 'Dip Chart', 'Purchase Invoices', 'ATG Logs'],
    aiCapabilities: ['water_contamination_alert', 'leakage_variance_detection'],
    isRealtime: true,
    version: '2.1.0',
    certificationStatus: 'CERTIFIED',
    readinessScore: 100
  }
};
