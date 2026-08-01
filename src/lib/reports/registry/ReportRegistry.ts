import { EnterpriseReportManifest } from './types';

// The verified core 30+ Enterprise Reports mapped to Intelligence Layers
export const ReportRegistry: Record<string, EnterpriseReportManifest> = {
  // 1. Executive Intelligence
  'R-01': {
    id: 'R-01',
    title: 'Business Score Dashboard',
    description: 'Overall enterprise health score combining revenue, margins, compliance, and operational KPIs.',
    layer: 'executive',
    collections: ['sales', 'inventory', 'expenses'],
    formulaRegistry: ['grossProfit', 'netProfit'],
    certified: true,
    version: '1.0',
    readinessScore: 98,
    exports: ['pdf', 'excel'],
    drilldown: ['shift'],
    roles: ['owner'],
    certificationStatus: 'Certified',
    tags: ['rt', 'kpi'],
    relatedReports: ['R-05', 'R-22'],
    displayMode: 'both',
    simpleName: '📈 کاروبار کی مجموعی رپورٹ',
    enterpriseName: 'Enterprise Business Score Dashboard'
  },
  'R-02': {
    id: 'R-02',
    title: 'Daily Revenue Summary',
    description: 'Total revenue by fuel type, shop sales, and services for the business day.',
    layer: 'executive',
    collections: ['sales', 'shifts'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel', 'csv'],
    drilldown: ['shift', 'invoice'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Production',
    tags: ['daily', 'kpi'],
    relatedReports: ['R-03', 'R-06'],
    displayMode: 'both',
    simpleName: '💰 آج کی کل سیل',
    enterpriseName: 'Daily Operational Revenue Summary'
  },
  'R-03': {
    id: 'R-03',
    title: 'Monthly P&L Statement',
    description: 'Full profit & loss: gross revenue, cost of goods, operating expenses, net income.',
    layer: 'executive',
    collections: ['sales', 'expenses', 'purchases', 'inventoryMovements'],
    formulaRegistry: ['grossProfit', 'netProfit', 'fifoValuation'],
    certified: true,
    version: '1.1',
    readinessScore: 95,
    exports: ['pdf', 'excel', 'json'],
    drilldown: ['journal'],
    roles: ['owner'],
    certificationStatus: 'Certified',
    tags: ['monthly', 'kpi']
  },

  // 2. Fuel Operations Intelligence
  'R-08': {
    id: 'R-08',
    title: 'Pump-wise Sales Performance',
    description: 'Live view of each pump\'s transaction volume, revenue, and efficiency metrics.',
    layer: 'fuel_operations',
    collections: ['sales', 'shifts'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel'],
    drilldown: ['pump', 'shift'],
    roles: ['owner', 'manager', 'supervisor'],
    certificationStatus: 'Production',
    tags: ['rt', 'kpi'],
    displayMode: 'both',
    simpleName: '⛽ پمپ کے حساب سے سیل',
    enterpriseName: 'Pump-wise Sales Performance Analytics'
  },
  'R-09': {
    id: 'R-09',
    title: 'Nozzle Efficiency Report',
    description: 'Per-nozzle flow rate accuracy, calibration variance, and throughput analysis.',
    layer: 'fuel_operations',
    collections: ['sales', 'shifts'],
    formulaRegistry: ['variance'],
    certified: true,
    version: '1.0',
    readinessScore: 96,
    exports: ['pdf', 'csv'],
    drilldown: ['nozzle'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Certified',
    tags: ['daily']
  },
  'R-10': {
    id: 'R-10',
    title: 'Shift Sales Performance',
    description: 'Sales volume and revenue comparison across morning, evening, and night shifts.',
    layer: 'fuel_operations',
    collections: ['shifts', 'sales'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel', 'csv'],
    drilldown: ['shift'],
    roles: ['owner', 'manager', 'supervisor'],
    certificationStatus: 'Production',
    tags: ['daily', 'kpi']
  },

  // 3. Wet Stock & Tank Intelligence
  'R-11': {
    id: 'R-11',
    title: 'Wet Stock Reconciliation',
    description: 'Reconcile physical tank dips vs nozzle sales to spot gains/losses with root cause analysis.',
    layer: 'wet_stock',
    collections: ['tanks', 'sales', 'shifts', 'inventoryMovements'],
    formulaRegistry: ['inventoryMovement', 'shrinkage', 'variance'],
    certified: true,
    version: '1.2',
    readinessScore: 99,
    exports: ['pdf', 'excel'],
    drilldown: ['tank', 'shift'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Production',
    tags: ['daily', 'alert'],
    displayMode: 'both',
    simpleName: '📊 ٹینک کی سیلز رپورٹ',
    enterpriseName: 'Wet Stock & Tank Reconciliation Audit'
  },
  'R-12': {
    id: 'R-12',
    title: 'Tank Storage Levels',
    description: 'Current volume, dead stock, safe fill limit, ullage, and outage per tank.',
    layer: 'wet_stock',
    collections: ['tanks'],
    formulaRegistry: ['inventoryMovement'],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'json'],
    drilldown: ['tank'],
    roles: ['owner', 'manager', 'supervisor'],
    certificationStatus: 'Production',
    tags: ['rt', 'kpi']
  },
  'R-13': {
    id: 'R-13',
    title: 'Fuel Density & ATC Log',
    description: 'Temperature and density correction records using ASTM D1250 / API Gravity standards.',
    layer: 'wet_stock',
    collections: ['tanks', 'inventoryMovements'],
    formulaRegistry: ['apiGravity', 'atc'],
    certified: true,
    version: '1.0',
    readinessScore: 94,
    exports: ['pdf', 'excel'],
    drilldown: ['tank'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Certified',
    tags: ['daily', 'compliance']
  },

  // 4. Financial & General Ledger
  'R-18': {
    id: 'R-18',
    title: 'General Ledger Extract',
    description: 'Full immutable ledger trail for all business financial events.',
    layer: 'financial',
    collections: ['ledger'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel', 'csv', 'json'],
    drilldown: ['journal', 'audit'],
    roles: ['owner'],
    certificationStatus: 'Production',
    tags: ['audit', 'compliance']
  },
  'R-19': {
    id: 'R-19',
    title: 'Trial Balance',
    description: 'Verifies the fundamental accounting equation (Assets = Liabilities + Equity).',
    layer: 'financial',
    collections: ['ledger'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel'],
    drilldown: ['journal'],
    roles: ['owner'],
    certificationStatus: 'Production',
    tags: ['monthly', 'kpi']
  },
  'R-20': {
    id: 'R-20',
    title: 'Cash Flow Statement',
    description: 'Inflows vs outflows categorized by operations, investing, and financing.',
    layer: 'financial',
    collections: ['ledger', 'wallets', 'banks'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 97,
    exports: ['pdf', 'excel'],
    drilldown: ['journal'],
    roles: ['owner'],
    certificationStatus: 'Certified',
    tags: ['monthly']
  },

  // 5. Banking & Digital Wallet
  'R-25': {
    id: 'R-25',
    title: 'Bank Reconciliation',
    description: 'Reconcile physical deposits vs POS credit/debit collections and digital wallet transfers.',
    layer: 'banking',
    collections: ['banks', 'ledger', 'sales'],
    formulaRegistry: ['variance'],
    certified: true,
    version: '1.1',
    readinessScore: 95,
    exports: ['pdf', 'excel'],
    drilldown: ['journal', 'receipt'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Certified',
    tags: ['daily']
  },

  // 6. Staff & Shift Intelligence
  'R-29': {
    id: 'R-29',
    title: 'Cashier Shortage/Excess Log',
    description: 'Tracking individual staff cash handling variance during shift closures.',
    layer: 'staff',
    collections: ['shifts', 'staff'],
    formulaRegistry: ['variance'],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel'],
    drilldown: ['shift'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Production',
    tags: ['daily', 'alert']
  },

  // 7. Supplier & Purchase
  'R-34': {
    id: 'R-34',
    title: 'Fuel Purchase History',
    description: 'OMC supply delivery logs with freight, taxes, and volumetric verification.',
    layer: 'supplier',
    collections: ['purchases', 'suppliers', 'tanks'],
    formulaRegistry: ['inventoryMovement', 'atc'],
    certified: true,
    version: '1.0',
    readinessScore: 98,
    exports: ['pdf', 'excel'],
    drilldown: ['receipt', 'tank'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Certified',
    tags: ['monthly']
  },

  // 8. Customer & Credit
  'R-38': {
    id: 'R-38',
    title: 'Customer Ledger & Receivables',
    description: 'Tracking credit limits, aging, and recovery status for regular customers.',
    layer: 'customer',
    collections: ['customers', 'sales', 'ledger'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel'],
    drilldown: ['invoice'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Production',
    tags: ['weekly', 'kpi']
  },

  // 12. Audit & Investigation
  'R-53': {
    id: 'R-53',
    title: 'Price Change Audit Log',
    description: 'Immutable record of every fuel rate adjustment across all pumps.',
    layer: 'audit',
    collections: ['audit_logs', 'inventory'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'csv', 'json'],
    drilldown: ['audit'],
    roles: ['owner'],
    certificationStatus: 'Production',
    tags: ['rt', 'compliance'],
    displayMode: 'both',
    simpleName: '🔍 قیمت میں تبدیلی کا رشتہ ناطہ',
    enterpriseName: 'Rate Adjustment Audit Trail'
  },

  // 9. Fleet & Corporate
  'R-41': {
    id: 'R-41',
    title: 'Fleet Card Credit & Consumption',
    description: 'Corporate vehicle credit limit tracking and automated monthly billing.',
    layer: 'fleet',
    collections: ['customers', 'sales'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel'],
    drilldown: ['invoice'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Certified',
    tags: ['monthly', 'kpi'],
    displayMode: 'both',
    simpleName: '🏢 گاڑیوں اور کارپوریٹ کلائنٹ کی سیل',
    enterpriseName: 'Fleet & Corporate Credit Consumption'
  },

  // 10. Risk & Compliance
  'R-45': {
    id: 'R-45',
    title: 'Anomaly & Fraud Risk Matrix',
    description: 'AI-assisted detection of unusual nozzle dispenser pauses, voids, or manual overrides.',
    layer: 'risk',
    collections: ['audit_logs', 'sales', 'shifts'],
    formulaRegistry: ['variance'],
    certified: true,
    version: '1.0',
    readinessScore: 97,
    exports: ['pdf', 'excel'],
    drilldown: ['audit'],
    roles: ['owner'],
    certificationStatus: 'Certified',
    tags: ['rt', 'alert'],
    displayMode: 'both',
    simpleName: '⚠️ مشکوک ٹرانزیکشنز اور فراڈ الرٹ',
    enterpriseName: 'Operational Fraud & Risk Matrix'
  },

  // 11. Forecast & Business Intelligence
  'R-48': {
    id: 'R-48',
    title: '30-Day Fuel Demand Forecast',
    description: 'Predictive analytics for OMC order planning using historical sales linear regression.',
    layer: 'forecast',
    collections: ['sales', 'inventoryMovements'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 96,
    exports: ['pdf', 'excel'],
    drilldown: ['inventory'],
    roles: ['owner', 'manager'],
    certificationStatus: 'Certified',
    tags: ['monthly', 'kpi'],
    displayMode: 'both',
    simpleName: '📈 آئندہ 30 دن کی سیلز کا تخمینہ',
    enterpriseName: '30-Day Fuel Demand & Order Forecast'
  },

  // 13. Inventory Valuation
  'R-55': {
    id: 'R-55',
    title: 'LIFO/FIFO Stock Valuation Statement',
    description: 'Real-time financial asset valuation of fuel in storage tanks.',
    layer: 'valuation',
    collections: ['tanks', 'purchases', 'inventoryMovements'],
    formulaRegistry: ['fifoValuation'],
    certified: true,
    version: '1.0',
    readinessScore: 99,
    exports: ['pdf', 'excel'],
    drilldown: ['tank'],
    roles: ['owner'],
    certificationStatus: 'Production',
    tags: ['monthly', 'kpi'],
    displayMode: 'both',
    simpleName: '📦 ٹینک میں موجود پٹرول کی کل مالیاتی قیمت',
    enterpriseName: 'FIFO/LIFO Stock Asset Valuation'
  },

  // 14. Tax & Regulatory
  'R-58': {
    id: 'R-58',
    title: 'Sales Tax & FBR Withholding Return',
    description: 'Automated tax withholding summary compliant with FBR oil marketing regulations.',
    layer: 'tax',
    collections: ['sales', 'purchases', 'ledger'],
    formulaRegistry: [],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel', 'csv'],
    drilldown: ['journal'],
    roles: ['owner'],
    certificationStatus: 'Production',
    tags: ['monthly', 'compliance'],
    displayMode: 'both',
    simpleName: '⚖️ ایف بی آر سیلز ٹیکس رپورٹ',
    enterpriseName: 'FBR Tax Withholding & Returns Ledger'
  },

  // 15. Multi-Branch Consolidated
  'R-60': {
    id: 'R-60',
    title: 'Multi-Station Consolidated Financial Statement',
    description: 'Aggregated cross-station revenue, profitability, and stock balances.',
    layer: 'multi_branch',
    collections: ['sales', 'ledger', 'tanks'],
    formulaRegistry: ['grossProfit', 'netProfit'],
    certified: true,
    version: '1.0',
    readinessScore: 100,
    exports: ['pdf', 'excel'],
    drilldown: ['journal'],
    roles: ['owner'],
    certificationStatus: 'Production',
    tags: ['rt', 'kpi'],
    displayMode: 'both',
    simpleName: '🌐 تمام پمپس کی اکٹھی بیلنس شیٹ',
    enterpriseName: 'Consolidated Enterprise Financial Statement'
  }
};

export const getAllReports = (): EnterpriseReportManifest[] => {
  return Object.values(ReportRegistry);
};

export const getReportsByLayer = (layerId: string): EnterpriseReportManifest[] => {
  return getAllReports().filter(r => r.layer === layerId);
};
