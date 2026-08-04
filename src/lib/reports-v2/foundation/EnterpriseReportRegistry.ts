/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 2.2 — Master Enterprise Reports Catalog (A–Z)
 *
 * Defines the 26 Master Intelligence Domains and the Strict Report Manifest.
 */

export type DomainCategory = 
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' 
  | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' 
  | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export interface IntelligenceDomain {
  id: DomainCategory;
  nameEn: string;
  nameUr: string;
  emoji: string;
}

export const DOMAINS: IntelligenceDomain[] = [
  { id: 'A', nameEn: 'Executive Dashboard', nameUr: 'ایگزیکٹو ڈیش بورڈ', emoji: '👑' },
  { id: 'B', nameEn: 'Sales Reports', nameUr: 'سیلز رپورٹس', emoji: '📈' },
  { id: 'C', nameEn: 'Fuel Stock Reports', nameUr: 'فیول اسٹاک', emoji: '🛢️' },
  { id: 'D', nameEn: 'Fuel Purchase Reports', nameUr: 'خریداری', emoji: '🚛' },
  { id: 'E', nameEn: 'Fuel Price Reports', nameUr: 'قیمتیں', emoji: '💲' },
  { id: 'F', nameEn: 'Tank & Dip Reports', nameUr: 'ٹینک اور ڈپ', emoji: '📏' },
  { id: 'G', nameEn: 'Pump & Nozzle Reports', nameUr: 'پمپ اور نوزل', emoji: '⛽' },
  { id: 'H', nameEn: 'Shift Reports', nameUr: 'شفٹ رپورٹس', emoji: '🔄' },
  { id: 'I', nameEn: 'Cash Reports', nameUr: 'کیش رپورٹس', emoji: '💵' },
  { id: 'J', nameEn: 'Bank Reports', nameUr: 'بینک رپورٹس', emoji: '🏦' },
  { id: 'K', nameEn: 'Digital Payment Reports', nameUr: 'ڈیجیٹل پیمنٹ', emoji: '📱' },
  { id: 'L', nameEn: 'Ledger Reports', nameUr: 'لیجر رپورٹس', emoji: '📚' },
  { id: 'M', nameEn: 'Customer Reports', nameUr: 'کسٹمرز', emoji: '👥' },
  { id: 'N', nameEn: 'Supplier Reports', nameUr: 'سپلائرز', emoji: '🤝' },
  { id: 'O', nameEn: 'Expense Reports', nameUr: 'اخراجات', emoji: '💸' },
  { id: 'P', nameEn: 'Profit & Staff Reports', nameUr: 'منافع اور عملہ', emoji: '📊' },
  { id: 'Q', nameEn: 'Fleet & Vehicle Reports', nameUr: 'فلیٹ', emoji: '🚚' },
  { id: 'R', nameEn: 'Compliance Reports', nameUr: 'کمپلائنس', emoji: '📑' },
  { id: 'S', nameEn: 'AI Intelligence Reports', nameUr: 'اے آئی رپورٹس', emoji: '🤖' },
  { id: 'T', nameEn: 'Treasury Reports', nameUr: 'ٹریژری', emoji: '🏛️' },
  { id: 'U', nameEn: 'Inventory Reports', nameUr: 'انوینٹری', emoji: '📦' },
  { id: 'V', nameEn: 'Tax & Regulatory', nameUr: 'ٹیکس اور ریگولیشن', emoji: '⚖️' },
  { id: 'W', nameEn: 'Multi-Branch Reports', nameUr: 'برانچز', emoji: '🏢' },
  { id: 'X', nameEn: 'Enterprise Asset', nameUr: 'ایسٹس', emoji: '🏢' },
  { id: 'Y', nameEn: 'Analytics & Forecast', nameUr: 'تجزیہ و پیشین گوئی', emoji: '📊' },
  { id: 'Z', nameEn: 'System Administration', nameUr: 'سسٹم ایڈمن', emoji: '⚙️' }
];

export type CertificationStatus = 'DRAFT' | 'UNDER_DEVELOPMENT' | 'READY' | 'CERTIFIED' | 'DEPRECATED';

export interface ReportManifest {
  reportId: string; // e.g. A-001
  category: DomainCategory;
  module: string;
  subModule: string;
  
  // Naming
  reportName: string; // Enterprise Name
  simpleName: string; // Operator Name
  description: string;

  // Multi-Mode Navigation Metadata
  dailyCategory?: string; // Grouping for Daily Operations Mode (e.g. '⛽ Fuel Sales')
  businessProcess?: string; // Workflow for Business Process Mode (e.g. 'Shift Closing Workflow')

  // Data & Rules
  firebaseCollections: string[];
  formulaDependencies: string[];
  
  // Output UI
  registerId: string;
  registerType: string;

  // Boolean Flags (Capabilities)
  supportsRealtime: boolean;
  supportsOffline: boolean;
  supportsExport: boolean;
  supportsPrint: boolean;
  supportsWhatsApp: boolean;
  supportsEmail: boolean;
  supportsAI: boolean;
  supportsTimeline: boolean;
  supportsExplainability: boolean;
  supportsAudit: boolean;
  supportsRawJSON: boolean;
  supportsDrilldown: boolean;

  // Security
  permission: string[];
  certificationStatus: CertificationStatus;
}

export class EnterpriseReportRegistry {
  private static instance: EnterpriseReportRegistry;
  private reports: Map<string, ReportManifest> = new Map();

  private constructor() {
    this.seedCatalog();
  }

  public static getInstance(): EnterpriseReportRegistry {
    if (!EnterpriseReportRegistry.instance) {
      EnterpriseReportRegistry.instance = new EnterpriseReportRegistry();
    }
    return EnterpriseReportRegistry.instance;
  }

  private register(report: ReportManifest): void {
    this.reports.set(report.reportId, report);
  }

  public getReport(id: string): ReportManifest | undefined {
    return this.reports.get(id);
  }

  public getAllReports(): ReportManifest[] {
    return Array.from(this.reports.values()).sort((a, b) => a.reportId.localeCompare(b.reportId));
  }

  public getReportsByDomain(categoryId: DomainCategory): ReportManifest[] {
    return this.getAllReports().filter(r => r.category === categoryId);
  }

  /**
   * Resolves the report engine type for a manifest. Reports are pure
   * configuration; the engine does all the work (Rule #110).
   */
  public getEngineTypeForReport(reportId: string): string {
    return REPORT_ENGINE_TYPES[reportId] || 'BusinessDashboard';
  }

  private seedCatalog() {
    // ----------------------------------------------------
    // A. Executive Dashboard (10 Reports)
    // ----------------------------------------------------
    this.register({
      reportId: 'A-001', category: 'A',
      module: 'Executive Dashboard', subModule: 'Top Level',
      reportName: 'Executive Business Score', simpleName: 'آج کا سکور',
      description: 'The ultimate top-level view of the entire Fuel Station business health, liquidity, and operational status.',
      firebaseCollections: ['sales', 'inventory', 'expenses', 'shifts', 'tankTelemetry'],
      formulaDependencies: ['FORMULA_CALC_REVENUE', 'FORMULA_CALC_PROFIT', 'FORMULA_CALC_STOCK_HEALTH'],
      dailyCategory: '🏠 Today\'s Dashboard', businessProcess: 'Management Overview',
      registerId: 'REG_EXEC_SUMMARY', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'AUDITOR'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'A-002', category: 'A',
      module: 'Executive Dashboard', subModule: 'Financials',
      reportName: 'Revenue Summary', simpleName: 'کل آمدنی',
      description: 'High-level revenue tracking across all streams.',
      firebaseCollections: ['sales', 'payments'],
      formulaDependencies: ['FORMULA_CALC_REVENUE'],
      dailyCategory: '💰 Cash', businessProcess: 'Revenue Calculation',
      registerId: 'REG_EXEC_REV', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: false, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    this.register({
      reportId: 'A-003', category: 'A',
      module: 'Executive Dashboard', subModule: 'Health',
      reportName: 'Operational Alerts', simpleName: 'بزنس الرٹس',
      description: 'Critical operational warnings and exceptions.',
      firebaseCollections: ['system_logs', 'tankTelemetry'],
      formulaDependencies: [],
      dailyCategory: '⚠ Alerts', businessProcess: 'Audit & Compliance',
      registerId: 'REG_EXEC_ALERTS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: false, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // B. Sales Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'B-001', category: 'B',
      module: 'Sales Reports', subModule: 'Daily',
      reportName: 'Daily Sales Performance', simpleName: 'آج کی سیل',
      description: 'Complete breakdown of all sales executed today.',
      firebaseCollections: ['sales', 'salesItems', 'payments', 'customers', 'products'],
      formulaDependencies: ['FORMULA_DAILY_SALES_AGG'],
      dailyCategory: '⛽ Fuel Sales', businessProcess: 'Fuel Sales Lifecycle',
      registerId: 'REG_SALES_DAILY', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: false, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'OPERATOR'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'B-002', category: 'B',
      module: 'Sales Reports', subModule: 'Product',
      reportName: 'Product-wise Sales Analysis', simpleName: 'پروڈکٹ وائز سیل',
      description: 'Sales volumes and revenue grouped by product (Petrol, Diesel, Lubes).',
      firebaseCollections: ['salesItems', 'products'],
      formulaDependencies: ['FORMULA_PRODUCT_SALES_AGG'],
      dailyCategory: '⛽ Fuel Sales', businessProcess: 'Fuel Sales Lifecycle',
      registerId: 'REG_SALES_PRODUCT', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: false, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // C. Fuel Stock Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'C-001', category: 'C',
      module: 'Fuel Stock', subModule: 'Current',
      reportName: 'Enterprise Stock Position', simpleName: 'ٹینک کی حالت',
      description: 'Real-time overview of current wet stock across all tanks.',
      firebaseCollections: ['tanks', 'tankReadings', 'dipReadings'],
      formulaDependencies: ['FORMULA_TANK_VOLUME'],
      dailyCategory: '🛢 Fuel Stock', businessProcess: 'Dip Verification & Stock',
      registerId: 'REG_STOCK_CURR', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: false, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: false, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'OPERATOR'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    // ----------------------------------------------------
    // H. Shift Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'H-001', category: 'H',
      module: 'Shift Reports', subModule: 'Shift Closing',
      reportName: 'Daily Shift Closing Report', simpleName: 'آج کی شفٹ',
      description: 'Final reconciliation of pump readings, cash, and variations per shift.',
      firebaseCollections: ['shifts', 'shiftReadings', 'cashLedger', 'sales'],
      formulaDependencies: ['FORMULA_SHIFT_VARIANCE'],
      dailyCategory: '🏠 Today\'s Dashboard', businessProcess: 'Shift Closing Workflow',
      registerId: 'REG_SHIFT_CLOSE', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'OPERATOR', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    // ----------------------------------------------------
    // P. Profit & Staff Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'P-001', category: 'P',
      module: 'Profit & Loss', subModule: 'True Profit',
      reportName: 'True Profit & Loss Statement', simpleName: 'منافع / نقصان',
      description: 'Gross Sales minus Purchase Cost, Test Liter Loss, Credit Aging Cost and Operating Expenses — the single number every owner opens the app for, shown as a transparent waterfall.',
      firebaseCollections: ['sales', 'fuelPurchases', 'expenses', 'shiftReadings', 'customers'],
      formulaDependencies: ['FORMULA_TRUE_PROFIT', 'FORMULA_CALC_REVENUE'],
      dailyCategory: '💰 Cash', businessProcess: 'Revenue Calculation',
      registerId: 'REG_PROFIT_LOSS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'P-005', category: 'P',
      module: 'Staff Intelligence', subModule: 'Attendance',
      reportName: 'Enterprise Staff Attendance', simpleName: 'سٹاف حاضری',
      description: 'Daily tracking of staff presence, absentees, and late arrivals.',
      firebaseCollections: ['attendance', 'employees'],
      formulaDependencies: ['FORMULA_ATTENDANCE_SCORE'],
      dailyCategory: '👨‍💼 Staff', businessProcess: 'HR & Payroll',
      registerId: 'REG_HR_ATTEND', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: false, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // T. Treasury Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'T-003', category: 'T',
      module: 'Treasury Intelligence', subModule: 'Liquidity',
      reportName: 'Treasury Cash Position', simpleName: 'ٹوٹل کیش / بینک',
      description: 'Consolidated view of physical safe cash, bank accounts, and digital wallets.',
      firebaseCollections: ['cashLedger', 'bankAccounts', 'wallets'],
      formulaDependencies: ['FORMULA_TREASURY_LIQUIDITY'],
      dailyCategory: '🏦 Banks', businessProcess: 'Management Overview',
      registerId: 'REG_TREASURY_POS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: false, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    // ----------------------------------------------------
    // X. Enterprise Asset & Infrastructure
    // ----------------------------------------------------
    this.register({
      reportId: 'X-001', category: 'X',
      module: 'Asset Intelligence', subModule: 'Pumps',
      reportName: 'Asset Maintenance History', simpleName: 'پمپ کی مرمت',
      description: 'Detailed log of all repair and maintenance activities.',
      firebaseCollections: ['assets', 'maintenanceLogs'],
      formulaDependencies: ['FORMULA_ASSET_DEPRECIATION'],
      dailyCategory: '📋 Expenses', businessProcess: 'Maintenance & Audits',
      registerId: 'REG_ASSET_MAIN', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: false, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'TECHNICIAN', 'MANAGER'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // Z. System Administration
    // ----------------------------------------------------
    this.register({
      reportId: 'Z-001', category: 'Z',
      module: 'Security', subModule: 'Audit',
      reportName: 'RBAC Security Audit', simpleName: 'سیکیورٹی لاگز',
      description: 'Immutable ledger of all critical system actions, permission changes, and overrides.',
      firebaseCollections: ['auditLogs', 'users'],
      formulaDependencies: [],
      dailyCategory: '⚠ Alerts', businessProcess: 'Audit & Compliance',
      registerId: 'REG_SEC_AUDIT', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: false, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'AUDITOR'], certificationStatus: 'CERTIFIED'
    });

    // ----------------------------------------------------
    // D. Fuel Purchase Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'D-001', category: 'D',
      module: 'Fuel Purchase', subModule: 'Daily',
      reportName: 'Fuel Purchase Summary', simpleName: 'خریداری کا خلاصہ',
      description: 'All fuel purchases received, supplier-wise totals, and litres delivered per delivery chalan.',
      firebaseCollections: ['fuelPurchases', 'suppliers', 'inventoryMovements'],
      formulaDependencies: ['FORMULA_PURCHASE_TOTALS'],
      dailyCategory: '🛢 Fuel Stock', businessProcess: 'Procurement & Receiving',
      registerId: 'REG_PURCHASE_SUMMARY', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'D-002', category: 'D',
      module: 'Fuel Purchase', subModule: 'Chalans',
      reportName: 'Delivery Chalan Register', simpleName: 'چالان رجسٹر',
      description: 'Immutable register of every fuel delivery chalan with vehicle, bowser, and meter readings.',
      firebaseCollections: ['fuelPurchases', 'inventoryMovements'],
      formulaDependencies: ['FORMULA_DELIVERY_RECON'],
      dailyCategory: '🛢 Fuel Stock', businessProcess: 'Dip Verification & Stock',
      registerId: 'REG_CHALAN_REG', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: false, supportsAI: false, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'OPERATOR'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    // ----------------------------------------------------
    // E. Fuel Price Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'E-001', category: 'E',
      module: 'Fuel Price', subModule: 'History',
      reportName: 'Price History & Revisions', simpleName: 'قیمت کی تبدیلیاں',
      description: 'Complete audit of every pump price change with reason, approver, and effective date.',
      firebaseCollections: ['fuelPrices', 'rateHistory', 'products'],
      formulaDependencies: ['FORMULA_PRICE_DELTA'],
      dailyCategory: '💲 Pricing', businessProcess: 'Price Revision Workflow',
      registerId: 'REG_PRICE_HISTORY', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'E-002', category: 'E',
      module: 'Fuel Price', subModule: 'Compliance',
      reportName: 'OGRA Price Compliance', simpleName: 'اوگرا قیمت تعمیل',
      description: 'Compares pump prices against the latest OGRA notified rates to flag compliance gaps.',
      firebaseCollections: ['fuelPrices', 'products'],
      formulaDependencies: ['FORMULA_OGRA_COMPLIANCE'],
      dailyCategory: '💲 Pricing', businessProcess: 'Price Revision Workflow',
      registerId: 'REG_OGRA_COMP', registerType: 'EnterpriseDataGrid',
      supportsRealtime: false, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: true, supportsAI: true, supportsTimeline: false,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: false,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // F. Tank & Dip Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'F-001', category: 'F',
      module: 'Tank & Dip', subModule: 'Readings',
      reportName: 'Tank Dip Register', simpleName: 'ڈپ رجسٹر',
      description: 'Chronological dip readings, water bottoms, temperature, and corrected volumes per tank.',
      firebaseCollections: ['tankReadings', 'dipReadings', 'tanks'],
      formulaDependencies: ['FORMULA_TANK_VOLUME', 'FORMULA_ATC_CORRECTION'],
      dailyCategory: '🛢 Fuel Stock', businessProcess: 'Dip Verification & Stock',
      registerId: 'REG_DIP_REGISTER', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: false, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'OPERATOR', 'TECHNICIAN'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'F-002', category: 'F',
      module: 'Tank & Dip', subModule: 'Calibration',
      reportName: 'Tank Calibration & Capacity', simpleName: 'ٹینک صلاحیت',
      description: 'Calibration tables, dip charts, ullage, and safe working capacity per tank.',
      firebaseCollections: ['tanks', 'dipReadings'],
      formulaDependencies: ['FORMULA_CALIBRATION'],
      dailyCategory: '🛢 Fuel Stock', businessProcess: 'Maintenance & Audits',
      registerId: 'REG_TANK_CALIB', registerType: 'EnterpriseDataGrid',
      supportsRealtime: false, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: false, supportsAI: false, supportsTimeline: false,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'TECHNICIAN'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // G. Pump & Nozzle Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'G-001', category: 'G',
      module: 'Pump & Nozzle', subModule: 'Performance',
      reportName: 'Pump Sales Performance', simpleName: 'پمپ سیل پرفارمنس',
      description: 'Sales volume and revenue per pump and nozzle, with efficiency and utilization metrics.',
      firebaseCollections: ['pumpReadings', 'nozzleReadings', 'salesItems'],
      formulaDependencies: ['FORMULA_PUMP_PERFORMANCE'],
      dailyCategory: '⛽ Fuel Sales', businessProcess: 'Fuel Sales Lifecycle',
      registerId: 'REG_PUMP_PERF', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'OPERATOR'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'G-002', category: 'G',
      module: 'Pump & Nozzle', subModule: 'Meters',
      reportName: 'Nozzle Meter Readings', simpleName: 'میٹر ریڈنگز',
      description: 'Raw and closing meter readings per nozzle with computed dispensed litres per shift.',
      firebaseCollections: ['pumpReadings', 'nozzleReadings', 'shiftReadings'],
      formulaDependencies: ['FORMULA_METER_DELTA'],
      dailyCategory: '⛽ Fuel Sales', businessProcess: 'Shift Closing Workflow',
      registerId: 'REG_NOZZLE_METERS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: false, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'OPERATOR', 'TECHNICIAN'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    // ----------------------------------------------------
    // I. Cash Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'I-001', category: 'I',
      module: 'Cash', subModule: 'Collections',
      reportName: 'Cash Collection Register', simpleName: 'کیش کلیکشن',
      description: 'Every cash collection, safe deposit, and withdrawal with responsible staff and shift.',
      firebaseCollections: ['cashLedger', 'shifts', 'staff'],
      formulaDependencies: ['FORMULA_CASH_TOTALS'],
      dailyCategory: '💰 Cash', businessProcess: 'Shift Closing Workflow',
      registerId: 'REG_CASH_REG', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'I-002', category: 'I',
      module: 'Cash', subModule: 'Variance',
      reportName: 'Cash Variance Analysis', simpleName: 'کیش فرق تجزیہ',
      description: 'Expected vs submitted cash variance per shift and per operator with exception flags.',
      firebaseCollections: ['cashLedger', 'shifts', 'staff'],
      formulaDependencies: ['FORMULA_SHIFT_VARIANCE'],
      dailyCategory: '💰 Cash', businessProcess: 'Shift Closing Workflow',
      registerId: 'REG_CASH_VAR', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'AUDITOR'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    // ----------------------------------------------------
    // J. Bank Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'J-001', category: 'J',
      module: 'Bank', subModule: 'Reconciliation',
      reportName: 'Bank Reconciliation', simpleName: 'بینک مفاہمت',
      description: 'Statement-level reconciliation of bank balances against ledger deposits and withdrawals.',
      firebaseCollections: ['bankAccounts', 'bankTransactions', 'cashLedger'],
      formulaDependencies: ['FORMULA_BANK_RECON'],
      dailyCategory: '🏦 Banks', businessProcess: 'Banking & Settlement',
      registerId: 'REG_BANK_RECON', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'J-002', category: 'J',
      module: 'Bank', subModule: 'Deposits',
      reportName: 'Bank Deposits Register', simpleName: 'بینک ڈپازٹس',
      description: 'Register of every cash and cheque deposit into bank accounts.',
      firebaseCollections: ['bankTransactions', 'bankAccounts'],
      formulaDependencies: ['FORMULA_BANK_TOTALS'],
      dailyCategory: '🏦 Banks', businessProcess: 'Banking & Settlement',
      registerId: 'REG_BANK_DEPOSITS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    // ----------------------------------------------------
    // K. Digital Payment Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'K-001', category: 'K',
      module: 'Digital Payment', subModule: 'Wallets',
      reportName: 'Digital Wallet Transactions', simpleName: 'والیٹ ٹرانزیکشنز',
      description: 'JazzCash, Easypaisa, and other wallet inflows and outflows with settlement status.',
      firebaseCollections: ['wallets', 'walletTransactions', 'digitalAccounts'],
      formulaDependencies: ['FORMULA_WALLET_TOTALS'],
      dailyCategory: '📱 Digital Payments', businessProcess: 'Banking & Settlement',
      registerId: 'REG_WALLET_TXN', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'K-002', category: 'K',
      module: 'Digital Payment', subModule: 'Settlement',
      reportName: 'Payment Gateway Settlement', simpleName: 'گیٹ وے سیٹلمنٹ',
      description: 'Settlement reconciliation for card and gateway payments with fee and lag analysis.',
      firebaseCollections: ['walletTransactions', 'payments'],
      formulaDependencies: ['FORMULA_SETTLEMENT_RECON'],
      dailyCategory: '📱 Digital Payments', businessProcess: 'Banking & Settlement',
      registerId: 'REG_GATEWAY_SETTLE', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // L. Ledger Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'L-001', category: 'L',
      module: 'Ledger', subModule: 'General Ledger',
      reportName: 'General Ledger', simpleName: 'جنرل لیجر',
      description: 'Complete double-entry ledger with all journal entries, accounts, and balances.',
      firebaseCollections: ['generalLedger', 'journalEntries'],
      formulaDependencies: ['FORMULA_LEDGER_BALANCE'],
      dailyCategory: '📚 Ledger', businessProcess: 'Revenue Calculation',
      registerId: 'REG_GL', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT', 'AUDITOR'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'L-002', category: 'L',
      module: 'Ledger', subModule: 'Journal',
      reportName: 'Journal Entries Register', simpleName: 'جرنل انٹریز',
      description: 'Immutable journal register verifying Debit = Credit for every posted entry.',
      firebaseCollections: ['journalEntries', 'generalLedger'],
      formulaDependencies: ['FORMULA_JOURNAL_BALANCE'],
      dailyCategory: '📚 Ledger', businessProcess: 'Audit & Compliance',
      registerId: 'REG_JOURNAL', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT', 'AUDITOR'], certificationStatus: 'CERTIFIED'
    });

    // ----------------------------------------------------
    // M. Customer Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'M-001', category: 'M',
      module: 'Customer', subModule: 'Ledger',
      reportName: 'Customer Ledger', simpleName: 'گاہک لیجر',
      description: 'Per-customer credit, recoveries, and outstanding balance ledger.',
      firebaseCollections: ['customers', 'sales', 'ledger'],
      formulaDependencies: ['FORMULA_CUSTOMER_BALANCE'],
      dailyCategory: '👥 Customers', businessProcess: 'Credit Management',
      registerId: 'REG_CUST_LEDGER', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'M-002', category: 'M',
      module: 'Customer', subModule: 'Aging',
      reportName: 'Customer Credit Aging', simpleName: 'ادھار ایجنگ',
      description: 'Receivables aged by 0-30, 31-60, 61-90, and 90+ day buckets.',
      firebaseCollections: ['customers', 'ledger'],
      formulaDependencies: ['FORMULA_AGING_BUCKETS'],
      dailyCategory: '👥 Customers', businessProcess: 'Credit Management',
      registerId: 'REG_CUST_AGING', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    // ----------------------------------------------------
    // N. Supplier Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'N-001', category: 'N',
      module: 'Supplier', subModule: 'Ledger',
      reportName: 'Supplier Ledger', simpleName: 'سپلائر لیجر',
      description: 'Per-supplier purchases, payments, and outstanding payable balance.',
      firebaseCollections: ['suppliers', 'fuelPurchases', 'ledger'],
      formulaDependencies: ['FORMULA_SUPPLIER_BALANCE'],
      dailyCategory: '🤝 Suppliers', businessProcess: 'Procurement & Receiving',
      registerId: 'REG_SUPP_LEDGER', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'N-002', category: 'N',
      module: 'Supplier', subModule: 'Payments',
      reportName: 'Supplier Payments Register', simpleName: 'سپلائر ادائیگیاں',
      description: 'Register of every supplier payment from cash, bank, or wallet with settlement refs.',
      firebaseCollections: ['suppliers', 'bankTransactions', 'cashLedger'],
      formulaDependencies: ['FORMULA_SUPPLIER_PAYMENTS'],
      dailyCategory: '🤝 Suppliers', businessProcess: 'Procurement & Receiving',
      registerId: 'REG_SUPP_PAY', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    // ----------------------------------------------------
    // O. Expense Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'O-001', category: 'O',
      module: 'Expense', subModule: 'Register',
      reportName: 'Expense Register', simpleName: 'اخراجات رجسٹر',
      description: 'Complete register of all operational expenses with approval status and payment mode.',
      firebaseCollections: ['expenses', 'staff'],
      formulaDependencies: ['FORMULA_EXPENSE_TOTALS'],
      dailyCategory: '📋 Expenses', businessProcess: 'Expense Approval Workflow',
      registerId: 'REG_EXP_REG', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER', 'ACCOUNTANT'], certificationStatus: 'READY'
    });

    this.register({
      reportId: 'O-002', category: 'O',
      module: 'Expense', subModule: 'Analysis',
      reportName: 'Expense Category Analysis', simpleName: 'اخراجات تجزیہ',
      description: 'Expenses grouped by category with month-over-month trend and anomaly flags.',
      firebaseCollections: ['expenses'],
      formulaDependencies: ['FORMULA_EXPENSE_CATEGORIES'],
      dailyCategory: '📋 Expenses', businessProcess: 'Expense Approval Workflow',
      registerId: 'REG_EXP_ANALYSIS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    // ----------------------------------------------------
    // Q. Fleet & Vehicle Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'Q-001', category: 'Q',
      module: 'Fleet', subModule: 'Consumption',
      reportName: 'Fleet Fuel Consumption', simpleName: 'فلیٹ فیول',
      description: 'Fuel consumption per fleet vehicle with litre efficiency and cost per kilometre.',
      firebaseCollections: ['fleetAccounts', 'sales', 'customers'],
      formulaDependencies: ['FORMULA_FLEET_CONSUMPTION'],
      dailyCategory: '🚚 Fleet', businessProcess: 'Fleet & Corporate Sales',
      registerId: 'REG_FLEET_CONS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'DRAFT'
    });

    this.register({
      reportId: 'Q-002', category: 'Q',
      module: 'Fleet', subModule: 'Corporate',
      reportName: 'Corporate Card Transactions', simpleName: 'کارپوریٹ کارڈز',
      description: 'All corporate vehicle card transactions with limits, balances, and fuel type mix.',
      firebaseCollections: ['customers', 'sales'],
      formulaDependencies: ['FORMULA_CORPORATE_TXN'],
      dailyCategory: '🚚 Fleet', businessProcess: 'Fleet & Corporate Sales',
      registerId: 'REG_CORP_CARDS', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // R. Compliance Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'R-101', category: 'R',
      module: 'Compliance', subModule: 'Checklist',
      reportName: 'Enterprise Compliance Checklist', simpleName: 'تعمیل چیک لسٹ',
      description: 'Operational readiness against petroleum, safety, and financial compliance items.',
      firebaseCollections: ['auditLogs', 'system_logs', 'assets'],
      formulaDependencies: [],
      dailyCategory: '⚠ Alerts', businessProcess: 'Audit & Compliance',
      registerId: 'REG_COMPLIANCE', registerType: 'EnterpriseDataGrid',
      supportsRealtime: false, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: true, supportsAI: true, supportsTimeline: false,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: false,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'DRAFT'
    });

    this.register({
      reportId: 'R-102', category: 'R',
      module: 'Compliance', subModule: 'Licenses',
      reportName: 'License & Certification Expiry', simpleName: 'لائسنس ایکسپائری',
      description: 'All operational licenses and certifications with expiry dates and renewal reminders.',
      firebaseCollections: ['assets', 'system_logs'],
      formulaDependencies: [],
      dailyCategory: '⚠ Alerts', businessProcess: 'Audit & Compliance',
      registerId: 'REG_LICENSES', registerType: 'EnterpriseDataGrid',
      supportsRealtime: false, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: true, supportsAI: false, supportsTimeline: false,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: false,
      permission: ['OWNER'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // S. AI Intelligence Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'S-001', category: 'S',
      module: 'AI Intelligence', subModule: 'Diagnostics',
      reportName: 'AI Business Diagnostics', simpleName: 'اے آئی تشخیص',
      description: 'AI-generated root cause analysis and anomaly detection over verified operational records.',
      firebaseCollections: ['sales', 'tankTelemetry', 'shifts'],
      formulaDependencies: ['FORMULA_BUSINESS_HEALTH'],
      dailyCategory: '🤖 AI Insights', businessProcess: 'Management Overview',
      registerId: 'REG_AI_DIAG', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: false, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    this.register({
      reportId: 'S-002', category: 'S',
      module: 'AI Intelligence', subModule: 'Confidence',
      reportName: 'AI Recommendation Confidence', simpleName: 'اے آئی کنفڈنس',
      description: 'Traceability report for every AI recommendation linking back to source records and rules.',
      firebaseCollections: ['sales', 'expenses'],
      formulaDependencies: ['FORMULA_BUSINESS_HEALTH'],
      dailyCategory: '🤖 AI Insights', businessProcess: 'Management Overview',
      registerId: 'REG_AI_CONF', registerType: 'EnterpriseDataGrid',
      supportsRealtime: false, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: false, supportsEmail: true, supportsAI: true, supportsTimeline: false,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'AUDITOR'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // U. Inventory Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'U-001', category: 'U',
      module: 'Inventory', subModule: 'Valuation',
      reportName: 'Inventory Valuation', simpleName: 'انوینٹری ویلیو',
      description: 'FIFO and weighted-average valuation of all fuel and lube stock at cost.',
      firebaseCollections: ['inventory', 'inventoryMovements', 'products'],
      formulaDependencies: ['FORMULA_FIFO_VALUATION'],
      dailyCategory: '📦 Inventory', businessProcess: 'Dip Verification & Stock',
      registerId: 'REG_INV_VALUATION', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT', 'AUDITOR'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    this.register({
      reportId: 'U-002', category: 'U',
      module: 'Inventory', subModule: 'Aging',
      reportName: 'Stock Aging Analysis', simpleName: 'اسٹاک ایجنگ',
      description: 'Stock ageing by receipt date highlighting slow-moving and stale inventory.',
      firebaseCollections: ['inventory', 'inventoryMovements'],
      formulaDependencies: ['FORMULA_STOCK_AGING'],
      dailyCategory: '📦 Inventory', businessProcess: 'Maintenance & Audits',
      registerId: 'REG_STOCK_AGING', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // V. Tax & Regulatory Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'V-001', category: 'V',
      module: 'Tax & Regulatory', subModule: 'Sales Tax',
      reportName: 'Sales Tax (FBR) Summary', simpleName: 'سیلز ٹیکس',
      description: 'FBR-compliant sales tax summary with taxable supplies and output tax.',
      firebaseCollections: ['sales', 'ledger', 'journalEntries'],
      formulaDependencies: ['FORMULA_SALES_TAX'],
      dailyCategory: '⚖️ Tax', businessProcess: 'Tax & Regulatory',
      registerId: 'REG_TAX_SUMMARY', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    this.register({
      reportId: 'V-002', category: 'V',
      module: 'Tax & Regulatory', subModule: 'Withholding',
      reportName: 'Withholding Tax Register', simpleName: 'ڈبلیو ٹی رجسٹر',
      description: 'Withholding tax deductions on suppliers and contractors with challan status.',
      firebaseCollections: ['ledger', 'journalEntries', 'suppliers'],
      formulaDependencies: ['FORMULA_WHT'],
      dailyCategory: '⚖️ Tax', businessProcess: 'Tax & Regulatory',
      registerId: 'REG_WHT', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'ACCOUNTANT'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // W. Multi-Branch Consolidated Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'W-001', category: 'W',
      module: 'Multi-Branch', subModule: 'Consolidation',
      reportName: 'Multi-Branch Consolidated Sales', simpleName: 'ملٹی برانچ سیل',
      description: 'Sales, revenue, and margins consolidated across all branches of the organization.',
      firebaseCollections: ['sales', 'shifts'],
      formulaDependencies: ['FORMULA_CONSOLIDATED'],
      dailyCategory: '🏢 Branches', businessProcess: 'Management Overview',
      registerId: 'REG_CONSOLIDATED', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    this.register({
      reportId: 'W-002', category: 'W',
      module: 'Multi-Branch', subModule: 'Comparison',
      reportName: 'Branch Performance Comparison', simpleName: 'برانچ موازنہ',
      description: 'Side-by-side branch comparison of KPIs with variance and ranking.',
      firebaseCollections: ['sales', 'shifts'],
      formulaDependencies: ['FORMULA_BRANCH_COMPARE'],
      dailyCategory: '🏢 Branches', businessProcess: 'Management Overview',
      registerId: 'REG_BRANCH_COMPARE', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER'], certificationStatus: 'DRAFT'
    });

    // ----------------------------------------------------
    // Y. Analytics & Forecast Reports
    // ----------------------------------------------------
    this.register({
      reportId: 'Y-001', category: 'Y',
      module: 'Analytics & Forecast', subModule: 'Forecast',
      reportName: 'Sales Forecast', simpleName: 'سیل پیشین گوئی',
      description: 'Deterministic demand forecast per product derived from verified historical sales.',
      firebaseCollections: ['sales', 'salesItems'],
      formulaDependencies: ['FORMULA_FORECAST'],
      dailyCategory: '📈 Forecast', businessProcess: 'Management Overview',
      registerId: 'REG_FORECAST', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'UNDER_DEVELOPMENT'
    });

    this.register({
      reportId: 'Y-002', category: 'Y',
      module: 'Analytics & Forecast', subModule: 'Trends',
      reportName: 'Trend & Seasonality Analysis', simpleName: 'ٹرینڈ تجزیہ',
      description: 'Daily, weekly, and monthly sales trends with seasonality detection and variance.',
      firebaseCollections: ['sales', 'shifts'],
      formulaDependencies: ['FORMULA_TREND'],
      dailyCategory: '📈 Forecast', businessProcess: 'Management Overview',
      registerId: 'REG_TREND', registerType: 'EnterpriseDataGrid',
      supportsRealtime: true, supportsOffline: true, supportsExport: true, supportsPrint: true,
      supportsWhatsApp: true, supportsEmail: true, supportsAI: true, supportsTimeline: true,
      supportsExplainability: true, supportsAudit: true, supportsRawJSON: true, supportsDrilldown: true,
      permission: ['OWNER', 'MANAGER'], certificationStatus: 'DRAFT'
    });

  }
}

// ────────────────────────────────────────────────────────────────────────────
// REPORT → ENGINE TYPE MAPPING
// Reports are pure configuration. The KPI/Chart/Register/Report engines do
// all the work (Rule #110). Unknown manifests safely fall back to the
// generic BusinessDashboard engine.
// ────────────────────────────────────────────────────────────────────────────

export const REPORT_ENGINE_TYPES: Record<string, string> = {
  // A. Executive
  'A-001': 'BusinessDashboard',
  'A-002': 'BusinessDashboard',
  'A-003': 'BusinessDashboard',
  // B. Sales
  'B-001': 'SalesRegister',
  'B-002': 'SalesRegister',
  // C. Fuel Stock
  'C-001': 'StockDashboard',
  // D. Fuel Purchase
  'D-001': 'PurchaseRegister',
  'D-002': 'PurchaseRegister',
  // E. Fuel Price
  'E-001': 'PriceHistory',
  'E-002': 'PriceHistory',
  // F. Tank & Dip
  'F-001': 'TankDipReport',
  'F-002': 'TankDipReport',
  // G. Pump & Nozzle
  'G-001': 'PumpNozzleReport',
  'G-002': 'PumpNozzleReport',
  // H. Shift
  'H-001': 'ShiftSummary',
  // I. Cash
  'I-001': 'CashSummary',
  'I-002': 'Variance',
  // J. Bank
  'J-001': 'BankPosition',
  'J-002': 'BankPosition',
  // K. Digital Payment
  'K-001': 'DigitalPayments',
  'K-002': 'DigitalPayments',
  // L. Ledger
  'L-001': 'LedgerView',
  'L-002': 'LedgerView',
  // M. Customer
  'M-001': 'CustomerLedger',
  'M-002': 'CustomerLedger',
  // N. Supplier
  'N-001': 'SupplierLedger',
  'N-002': 'SupplierLedger',
  // O. Expense
  'O-001': 'ExpenseRegister',
  'O-002': 'ExpenseRegister',
  // P. Profit & Staff
  'P-001': 'ProfitReport',
  'P-005': 'StaffRegister',
  // Q. Fleet
  'Q-001': 'FleetReport',
  'Q-002': 'FleetReport',
  // R. Compliance
  'R-101': 'ComplianceReport',
  'R-102': 'ComplianceReport',
  // S. AI Intelligence
  'S-001': 'AIIntelligence',
  'S-002': 'AIIntelligence',
  // T. Treasury
  'T-003': 'TreasuryDashboard',
  // U. Inventory
  'U-001': 'StockDashboard',
  'U-002': 'StockDashboard',
  // V. Tax & Regulatory
  'V-001': 'TaxReport',
  'V-002': 'TaxReport',
  // W. Multi-Branch
  'W-001': 'BranchComparison',
  'W-002': 'BranchComparison',
  // X. Enterprise Asset
  'X-001': 'AssetRegister',
  // Y. Analytics & Forecast
  'Y-001': 'AnalyticsDashboard',
  'Y-002': 'AnalyticsDashboard',
  // Z. System Administration
  'Z-001': 'AuditLog'
};
