/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TenantDocument {
  orgId?: string;
  businessId?: string;
  businessType?: 'fuel_station' | 'cng' | 'lube';
  stationId?: string;
  ownerId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
  deletedAt?: number;
  deletedBy?: string;
}


export interface Staff extends TenantDocument {
  id: string;
  name: string;
  urduName: string;
  role: 'owner' | 'manager' | 'cashier' | 'salesman' | string;
  salary: number;
  advances: number;
  active: boolean; // Legacy active flag
  status?: 'active' | 'suspended' | 'blocked' | 'pending_verification' | 'trial_expired';
  permissions?: string[];
  allowedBusinessIds?: string[];
  pin: string;
  phone?: string;
  cnic?: string;
  advanceBalance?: number;
  salaryBalance?: number;
  loanBalance?: number;
}

export interface DealerMarginSetting {
  id: string;
  productType: 'petrol' | 'diesel' | 'kerosene' | 'ldo' | string;
  marginPerLiter: number;       // e.g. 8.64
  effectiveFrom: string;        // ISO date: "2024-01-01"
  effectiveTo: string | null;   // null = currently active
  setBy: string;                // userId
  notes: string;                // "OGRA notification ref XYZ"
  createdAt: string;
}

export type ProductType = 'fuel' | 'lube' | 'other';

export interface Product extends TenantDocument {
  id: string;
  name: string;
  urduName: string;
  rate: number;
  unit: string;
  type: ProductType;
  currentStock: number;
  minStock: number;
  capacity?: number;
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  dealerMarginPerUnit?: number;
  currentDealerMargin?: number;
}

export interface Nozzle extends TenantDocument {
  id: string;
  pumpId: string;
  name: string;
  productId: string;
  tankId?: string;
  startReading?: number;
  currentReading?: number;
  meterOffset?: number;
  offsetHistory?: {
    timestamp: string;
    previousOffset: number;
    addedOffset: number;
    newOffset: number;
    resetEventId: string;
  }[];
}

export interface Pump extends TenantDocument {
  id: string;
  name: string;
  nozzleCount?: number;
}

export interface Customer extends TenantDocument {
  id: string;
  name: string;
  urduName: string;
  contact: string;
  address: string;
  creditLimit: number;
  balance: number; // Positive means customer owes us money (Dr)
}

export interface Supplier extends TenantDocument {
  id: string;
  name: string;
  urduName: string;
  contact: string;
  accountNo: string;
  balance: number; // Positive means we owe the supplier money (Cr)
  
  // Advanced fields (optional for backward compatibility)
  creditLimit?: number;
  email?: string;
  address?: string;
  supplierType?: 'Fuel Supplier' | 'Lubricant Supplier' | 'CNG Supplier' | 'Service Provider' | 'Other';
  status?: 'Active' | 'Inactive';
  supplierSince?: string;
  ntn?: string;
}

export interface DebitEntry extends TenantDocument {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  rate: number;
  amount: number;
  note: string;
  date?: string;
  slipNumber?: string;
  vehicleNo?: string;
  productType?: string;
}

export interface RecoveryEntry extends TenantDocument {
  id: string;
  customerId: string;
  amount: number;
  mode: 'cash' | 'cheque' | 'transfer';
  reference: string;
  date?: string;
  receiptNumber?: string;
  paymentMode?: string;
}

export interface ExpenseEntry extends TenantDocument {
  id: string;
  category?: string; // Legacy
  categoryId?: string;
  categoryName?: string;
  amount: number;
  description: string;
  date: string;
  paidFrom: 'cash' | 'bank';
  staffId?: string;
}

export interface BankCashEntry extends TenantDocument {
  id: string;
  bankAccountId: string;
  amount: number;
  reference: string;
  customerId?: string;
}

export interface DigitalCashEntry extends TenantDocument {
  id: string;
  method: string;
  amount: number;
  transactionId: string;
  accountHolder?: string;
}


export interface LubePosSaleLine {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface LubePosSale extends TenantDocument {
  id: string;
  invoiceNo: string;
  date: string;
  time: string;
  cashierId: string;
  customerId?: string;
  customerName?: string;
  vehicleNo?: string;
  paymentMode: 'cash' | 'bank' | 'digital' | 'credit';
  bankAccountId?: string;
  digitalAccountId?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountReceived: number;
  changeGiven: number;
  notes?: string;
  items: LubePosSaleLine[];
  isRecovery?: boolean;
  isAdjustment?: boolean;
  isReturn?: boolean;
  returnedSaleId?: string;
}

export interface SupplierPayment extends TenantDocument {
  id: string;
  supplierId: string;
  date: string;
  amount: number;
  mode: 'cash' | 'cheque' | 'transfer' | 'digital';
  bankAccountId?: string;
  reference: string;
  notes?: string;
  paymentMode?: string;
}

export interface DiscountEntry extends TenantDocument {
  id: string;
  amount: number;
  type: string;
  reason: string;
  customerName: string;
  productId?: string;
  approvedBy: string;
  notes?: string;
  timestamp: string;
}

export interface ShiftPriceSegment {
  id: string;
  shiftId: string;
  nozzleId: string;
  productId: string;
  oldRate: number;
  newRate: number;
  effectiveAt: string;
  capturedAt: string;
  delayMinutes: number;
  delayStatus: 'normal' | 'warning' | 'critical';
  meterOpen: number;
  meterClose: number;
  meterOpenDisplay?: number;
  meterCloseDisplay?: number;
  litersSold: number;
  revenue: number;
  segmentIndex: number;
}

export interface PendingPriceRevision {
  id: string;
  productId: string;
  oldRate: number;
  newRate: number;
  effectiveAt: string;
  reason?: string;
  approvedBy?: string;
}

export interface MeterResetEvent extends TenantDocument {
  id: string;
  nozzleId: string;
  nozzleName: string;
  productId: string;
  productName: string;
  oldReading: number;
  newReading: number;
  meterDifference?: number;
  
  // Stock snapshot
  stockAtReset?: number;
  tankStockBeforeReset?: number;
  tankStockAfterReset?: number;
  tankId?: string;
  tankName?: string;

  // Financial
  priceAtReset: number;
  inventoryValueAtReset?: number;

  reason: string;
  isRollover: boolean;
  
  resetType?: 'ROLLOVER' | 'METER_REPLACEMENT' | 'METER_REPAIR' | 'CALIBRATION' | 'ADMIN_CORRECTION';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  eventHash?: string;

  activeShiftId?: string;
  shiftNumber?: string;
  salesmanId?: string;
  salesmanName?: string;
  
  authorizedBy: string;
  authorizedByName?: string;
  authorizationMethod?: 'MASTER_PIN' | 'BIOMETRIC' | 'OWNER_ACCOUNT';
  requestedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  isFinanciallyImpacting?: boolean;
  
  timestamp: string;
  createdAt?: number;
  
  evidenceUrl?: string;
  beforeMeterImage?: string;
  afterMeterImage?: string;
  notes?: string;
}

export interface Shift extends TenantDocument {
  id: string;
  staffId: string;
  type: 'day' | 'night';
  date: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'closed';
  
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: number;
  activeMidShiftAlert?: boolean;
  segments?: ShiftPriceSegment[];
  pendingPriceRevisions?: PendingPriceRevision[];
  
  openingReadings: { [nozzleId: string]: number }; // ACTUAL readings (display + offset)
  openingReadingsDisplay?: { [nozzleId: string]: number }; // DISPLAY readings (what user saw)
  closingReadings: { [nozzleId: string]: number }; // ACTUAL readings (display + offset)
  closingReadingsDisplay?: { [nozzleId: string]: number }; // DISPLAY readings (what user saw)
  testLiters: { [productId: string]: number };
  rates?: { [productId: string]: number }; // Add rates
  
  debitEntries: DebitEntry[];
  recoveryEntries: RecoveryEntry[];
  expenseEntries: ExpenseEntry[];
  bankCashEntries: BankCashEntry[];
  digitalCashEntries: DigitalCashEntry[];
  discountEntries?: DiscountEntry[];

  supplierPayments: SupplierPayment[];
  
  expectedCash: number;
  submittedCash: number;
  shortage: number;
  overage: number;
  cashVariance?: number;
}

export interface ReceiptLine {
  quantity: number;
  rate: number;
  amount: number;
  nozzleId?: string;
  tankId?: string;
}

export interface Receipt extends TenantDocument {
  id: string;
  receiptNo: string;
  date: string; // ISO date
  time: string; // HH:mm format
  shiftId?: string;
  cashierId: string;
  customerId?: string; 
  customerName?: string;
  vehicleNo?: string;
  paymentMode: 'cash' | 'card' | 'digital' | 'credit';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: ReceiptLine[];
  notes?: string;
}

export interface BankAccount extends TenantDocument {
  id: string;
  name: string;
  accountNo: string;
  balance: number;
}

export interface DigitalAccount extends TenantDocument {
  id: string;
  name: string;
  accountNo: string;
  balance: number;
}

export interface StockBatch extends TenantDocument {
  id: string;

  // Core identifiers
  tankId?: string;
  productId: string;           // Legacy: maps to productType
  productType?: string;        // 'petrol' | 'diesel' | 'super' | 'kerosene' | 'ldo'
  batchNumber: string;         // e.g. "HSD-2025-0041"
  supplierId?: string;

  // ─── INVOICE FIELDS ────────────────────────────────────────────
  invoiceNumber?: string;      // "8810/02293"
  doNumber?: string;           // Delivery Order No
  tokenNumber?: string;        // PSO Token No
  contractNumber?: string;
  date: string;                // Legacy delivery date (kept for backward compat)
  deliveryDate?: string;       // ISO date "2025-11-17"
  deliveryTime?: string;       // "14:30"

  // ─── QUANTITY ──────────────────────────────────────────────────
  qtyOnInvoice?: number;       // What paper invoice says
  qtyReceived: number;         // Actual measured quantity
  qtyShort?: number;           // qtyOnInvoice - qtyReceived (stored in DB)
  qtyRemaining: number;        // Decreases as sold via FIFO

  // ─── INVOICE PRICING (NEW — Real Invoice Total Approach) ────────
  invoiceTotalAmount?: number;     // Rs. 37,51,951.36 (actual total from invoice)
  invoiceCostPerLiter?: number;    // Auto: invoiceTotalAmount / qtyReceived

  // ─── LEGACY PRICING (kept for backward compat) ─────────────────
  ograPumpPrice: number;
  dealerMargin: number;
  omcInvoicePrice?: number;        // OLD approach: OGRA - margin (deprecated)
  carriageTotal?: number;          // Legacy
  carriagePerLiter?: number;       // Legacy
  otherChargesTotal?: number;      // Legacy
  otherPerLiter?: number;          // Legacy

  // ─── EXTRA COSTS (NEW) ─────────────────────────────────────────
  carriageAmount?: number;         // Separate carriage (0 for PSO)
  carriagePaidTo?: string;         // "Abdullah Enterprises"
  driverTipAmount?: number;        // Cash tip paid to driver
  otherCharges?: number;           // Other misc costs
  supplierCarriageInvoiced?: boolean; // PSO=true (delivery in invoice), Attock=false

  // ─── LANDED COST ───────────────────────────────────────────────
  totalExtraCosts?: number;        // carriage + tip + other
  totalLandedCost?: number;        // invoiceTotal + all extras
  landedCostPerLiter: number;      // totalLandedCost / qtyReceived

  // ─── EXPECTED BATCH MARGIN (renamed from Gross Profit) ─────────
  expectedBatchMarginPerLiter?: number; // ograPrice - landedCostPerLiter
  expectedBatchMarginTotal?: number;    // margin × qtyReceived

  // ─── LEGACY MARGIN FIELDS (kept for backward compat) ───────────
  grossMarginPerLiter?: number;
  netMarginPerLiter?: number;
  expectedGrossProfit?: number;
  expectedNetProfit?: number;

  // ─── REALIZED PROFIT (fills as FIFO sales happen) ──────────────
  totalLitersSold?: number;        // Tracks how much sold from this batch
  realizedRevenue?: number;        // Sum of: liters × sell_price per deduction
  realizedCOGS?: number;           // Sum of: liters × landed_cost per deduction
  realizedMargin?: number;         // realizedRevenue - realizedCOGS
  realizedMarginPerLiter?: number; // realizedMargin / totalLitersSold

  // ─── SEAL VERIFICATION ────────────────────────────────────────
  sealNumberFrom?: string;         // "920851"
  sealNumberTo?: string;           // "920862"
  totalSealsExpected?: number;     // Auto: To - From + 1
  totalSealsReceived?: number;     // Physical count
  sealStatus?: 'ok' | 'broken' | 'missing' | 'mismatch';
  sealNotes?: string;

  // ─── BATCH TRACEABILITY / QUALITY ─────────────────────────────
  observedGravity?: number;        // e.g. 0.721
  observedTemp?: number;           // e.g. 92 (°C)
  calibrationNumber?: string;      // "7499"
  calibrationExpiry?: string;      // "2027-05-04"
  batchTestReport?: string;
  density?: number;

  // ─── DIP READINGS ─────────────────────────────────────────────
  dipBefore?: number;
  dipAfter?: number;
  dipExpectedAfter?: number;       // Auto: dipBefore + qtyReceived
  dipVariance?: number;            // |dipAfter - dipExpectedAfter|

  // ─── DRIVER INFO ──────────────────────────────────────────────
  driverName?: string;
  driverNic?: string;
  vehicleNumber?: string;

  // ─── PAYMENT ──────────────────────────────────────────────────
  paymentMethod?: 'credit' | 'cash' | 'bank' | 'partial';
  amountPaid?: number;
  outstandingBalance?: number;
  paymentDueDate?: string;

  // ─── RECEIVED BY (REQUIRED from v2) ───────────────────────────
  receivedBy?: string;             // Staff ID

  // ─── INVENTORY AGING ──────────────────────────────────────────
  agingAlertSent?: boolean;

  // ─── REVALUATION ──────────────────────────────────────────────
  revaluationGainLoss?: number;
  lastRevaluationAt?: string;

  // ─── STATUS ───────────────────────────────────────────────────
  status: 'active' | 'depleted' | 'partial' | 'exhausted' | 'quarantined' | 'pending_qa';
  batchStatus?: 'active' | 'partial' | 'exhausted' | 'depleted' | 'quarantined' | 'pending_qa';
  qualityStatus?: 'clear' | 'under_review' | 'quarantined';
  notes?: string;
  supplierName?: string;
}

export interface CogsRecord extends TenantDocument {
  id: string;
  shiftId: string;
  shiftSegmentId: string;
  batchId: string;
  productType: string;
  litersDeducted: number;
  ograPumpPrice: number;
  dealerMargin: number;
  omcInvoicePrice: number;
  carriagePerLiter: number;
  otherChargesPerLiter: number;
  landedCostPerLiter: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  saleDate: string;
}

// ─── FIFO DEDUCTION RECORD ──────────────────────────────────────────
export interface FIFODeduction extends TenantDocument {
  id: string;
  batchId: string;
  shiftId: string;
  shiftSegmentId?: string;
  nozzleId: string;
  litersDeducted: number;
  sellingPrice: number;          // OGRA rate at time of sale
  batchLandedCost: number;       // from batch.landedCostPerLiter
  realizedRevenue: number;       // liters × sellingPrice
  realizedCOGS: number;          // liters × landedCost
  realizedMargin: number;        // revenue - cogs
  realizedMarginPerLiter: number;
  saleDate: string;              // ISO date string YYYY-MM-DD
  // Note: createdAt / updatedAt from TenantDocument (number / ms)
}

// ─── SUPPLIER CLAIM ─────────────────────────────────────────────────
export interface SupplierClaim extends TenantDocument {
  id: string;
  batchId: string;
  supplierId: string;
  claimNumber: string;           // "CLM-2025-0089" (auto-generated)
  claimType: 'short_quantity' | 'quality' | 'seal_broken' | 'adulteration' | 'other';
  qtyShort?: number;
  claimAmount: number;
  description: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'recovered' | 'partial';
  raisedDate: string;
  submittedDate?: string;
  supplierResponse?: string;
  resolvedDate?: string;
  recoveredAmount: number;
  outstandingClaim: number;
  raisedBy: string;
  notes?: string;
  // Note: createdAt / updatedAt from TenantDocument (number / ms)
}

// ─── INVENTORY REVALUATION ──────────────────────────────────────────
export interface InventoryRevaluation extends TenantDocument {
  id: string;
  priceChangeId: string;
  batchId: string;
  productType: string;
  qtyRemaining: number;
  oldOGRAPrice: number;
  newOGRAPrice: number;
  rateDelta: number;
  gainLossAmount: number;
  impactType: 'gain' | 'loss';
  revaluedAt: string;
}

// ─── SUPPLIER PERFORMANCE ───────────────────────────────────────────
export interface SupplierPerformanceScore extends TenantDocument {
  id: string;
  supplierId: string;
  supplierName: string;
  periodMonth: string;           // "2025-11" (YYYY-MM)
  deliveries: number;
  onTime: number;
  shortDeliveries: number;
  totalQtyShort: number;
  totalQtyDelivered: number;
  claimsRaised: number;
  claimsResolved: number;
  avgMargin: number;
  marginStdDeviation: number;
  qualityIssues: number;
  performanceScore: number;      // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: string;
}

export interface StockTransaction extends TenantDocument {
  id: string;
  itemId: string;
  type: 'receipt' | 'sale' | 'adjustment';
  quantity: number;
  by: string;
  date: string;
  amount?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  fuelType?: string;
  supplierId?: string;
  carriageCost?: number;
  tankId?: string;
  // Purchase Financials
  paymentMode?: 'cash' | 'credit' | 'bank' | 'digital';
  amountPaid?: number;
  bankAccountId?: string;
  dueDate?: string;
  invoiceNo?: string;
  notes?: string;
}

export interface Station extends TenantDocument {
  id: string;
  name: string;
  urduName: string;
  address: string;
  ntn: string;
  ownerContact: string;
}

export interface AuditTrailEntry extends TenantDocument {
  id: string; // Action ID
  timestamp: string; // ISO String or unix timestamp
  category: string;
  action: string;
  details: string;
  user: string; // User ID or Name
  role: string; // Role
  branch: string; // Branch ID
  oldValue?: string | object;
  newValue?: string | object;
  ip?: string;
  device?: string;
}

export interface GlobalSettings extends TenantDocument {
  stationName: string;
  stationUrduName: string;
  address: string;
  ntn: string;
  ownerContact: string;
  theme: 'light' | 'dark' | 'blue' | 'emerald' | 'orange' | 'white';
  language: 'en' | 'ur' | 'ar' | 'es' | 'zh';
  currency?: string;
  setupCompleted?: boolean;
  setupVersion?: number;
  whatsappSettings?: {
    enabled: boolean;
    number: string;
    alerts: {
      shiftClose: boolean;
      priceChange: boolean;
      tankLow: boolean;
      cashVariance: boolean;
    };
  };
  security?: {
    masterPin?: string;
    requirePinForMeterReset?: boolean;
    requirePinForFactoryReset?: boolean;
    factoryResetPin?: string;
    priceOverridePin?: string;
    sessionTimeoutMinutes?: number;
    biometricEnabled?: boolean;
    enforceShiftHours?: boolean;
    autoCloseShifts?: boolean;
    maxShiftDurationHours?: number;
  };
  treasury?: {
    cashVarianceThreshold?: number;
    discountApprovalLimit?: number;
    supplierPaymentLimit?: number;
    autoLockPeriodMinutes?: number;
    defaultOwnerSafe?: string;
  };
  eventCalendar?: {
    ramadanStart?: string;
    eidUlFitr?: string;
    eidUlAdha?: string;
    muharram?: string;
    independenceDay?: string;
    ramadanMultiplier?: number;
    eidMultiplier?: number;
  };
  customExpenseCategories?: { id: string; label: string; urdu: string }[];
  phone?: string;
  email?: string;
  tagline?: string;
  logoUrl?: string;
}

export const EXPENSE_CATEGORIES = [
  { id: 'fuel_purchase', label: 'Fuel Purchase', urdu: 'فیول کی خریداری', icon: '⛽' },
  { id: 'owner_family', label: 'Owner/Manager/Family', urdu: 'مالک/مینیجر/فیملی کے اخراجات', icon: '👑' },
  { id: 'salary', label: 'Staff Salary', urdu: 'اسٹاف کی تنخواہ', icon: '👷' },
  { id: 'maintenance', label: 'Maintenance/Repair', urdu: 'مرمت اور دیکھ بھال', icon: '🔧' },
  { id: 'electricity', label: 'Electricity Bill', urdu: 'بجلی کا بل', icon: '💡' },
  { id: 'water', label: 'Water Bill', urdu: 'پانی کا بل', icon: '💧' },
  { id: 'cleaning', label: 'Cleaning/Supplies', urdu: 'صفائی کا سامان', icon: '🧹' },
  { id: 'licenses', label: 'License/Fees', urdu: 'لائسنس اور فیس', icon: '🏛️' },
  { id: 'stationery', label: 'Stationery', urdu: 'اسٹیشنری', icon: '📦' },
  { id: 'meals', label: 'Staff Meal', urdu: 'اسٹاف کا کھانا', icon: '🍽' },
  { id: 'security', label: 'Security', urdu: 'سیکیورٹی', icon: '🔒' },
  { id: 'other', label: 'Other', urdu: 'دیگر اخراجات', icon: '📝' }
];

export interface Tank extends TenantDocument {
  id: string;
  name: string;
  productId: string; // fuel product id
  capacity: number;
  safeLevel: number;
  criticalLevel: number;
  currentStock: number;
  openingStock: number;
  physicalLabel?: string;
  dipChart: { cm: number; liters: number }[];
}

export interface Attachment {
  id: string;
  fileName: string;
  url: string;
  type: 'pdf' | 'image' | 'circular' | 'letter';
  uploadedDate: string;
  uploadedBy: string;
  size: number;
}

export interface TankSnapshotDetail {
  tankId: string;
  tankName: string;
  stockQuantity: number;
  waterLevel?: number;
  temperature?: number;
}

export interface InventorySnapshot extends TenantDocument {
  id: string;
  snapshotDate: string;
  snapshotTime: string;
  productId: string;
  productName: string;
  stockQuantity: number;
  currentPrice: number;
  inventoryValue: number;
  snapshotValueBefore?: number;
  snapshotValueAfter?: number;
  tankDetails?: TankSnapshotDetail[];
  createdBy: string;
}

export type RateChangeReason = 
  | 'OGRA Revision' 
  | 'PSO Revision' 
  | 'Shell Revision' 
  | 'GO Revision' 
  | 'APL Revision' 
  | 'Manual Correction' 
  | 'Special Adjustment' 
  | 'System Correction';

export interface RateHistoryEntry extends TenantDocument {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  difference: number;
  changeType: 'increase' | 'decrease';
  stockAtTimeOfChange: number;
  inventoryImpact: number;
  snapshotId: string;
  effectiveDate: string;
  effectiveTime: string;
  changedBy: string;
  approvalStatus: 'approved' | 'pending';
  notes?: string;
  reason: RateChangeReason;
  attachments?: Attachment[];

  // Legacy fields (kept for backward compatibility, optional)
  date?: string;
  oldRate?: number;
  newRate?: number;
  change?: number;
  stockAtTime?: number;
  impactAmount?: number;
  stockAtChange?: number;
  gainLoss?: number;
  changedAt?: number;
  timestamp?: number;
  revaluationImpact?: number;
  stockOnHand?: number;
}

export interface StaffFinanceEntry extends TenantDocument {
  id: string;
  staffId: string;
  date: string;
  type: 'accrual' | 'issue' | 'advance';
  amount: number;
  balanceAfter: number;
  reference: string;
  note?: string;
  mode?: 'cash' | 'bank' | 'card' | 'transfer';
  deductedAdvance?: number;
}

export interface SalaryTransaction extends TenantDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  month: string;
  paymentDate: string;
  paymentMethod: string;
  paymentSource: string; // e.g. 'cash', 'hbl', 'meezan'
  status: 'draft' | 'pending_approval' | 'approved' | 'paid';
  expenseId?: string;
  createdBy: string;
  approvedBy?: string;
  remarks?: string;
  branchId?: string;
  advanceDeduction?: number;
  loanDeduction?: number;
  netPaid?: number;
}

export interface StaffLoan extends TenantDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  loanAmount: number;
  monthlyInstallment: number;
  remainingBalance: number;
  dateIssued: string;
  status: 'active' | 'cleared';
  branchId?: string;
}

export interface SalaryAdvance extends TenantDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  dateIssued: string;
  status: 'active' | 'recovered';
  recoveredAmount: number;
  branchId?: string;
}

export interface AttendanceRecord extends TenantDocument {
  id: string;
  staffId: string;
  date: string;
  status: 'present' | 'absent' | 'off' | 'late' | 'leave';
  checkIn?: string;
  checkOut?: string;
}

// Enterprise Enhancements Types

export interface LedgerEntry extends TenantDocument {
  id: string;
  type: 'Sale' | 'Purchase' | 'Expense' | 'Credit Sale' | 'Credit Recovery' | 'Salary' | 'Inventory Adjustment' | 'Opening Balance' | 'Closing Balance';
  amount: number;
  date: string; // ISO String
  referenceId?: string;
  notes?: string;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: number;
}

export interface InventoryMovement extends TenantDocument {
  id: string;
  productId: string;
  type: 'Purchase' | 'Sale' | 'Adjustment' | 'Transfer' | 'Return' | 'Wastage' | 'Tank Refill' | 'Tank Loss';
  quantity: number;
  date: string; // ISO String
  referenceId?: string;
  notes?: string;
  tankId?: string;
}

export interface Organization {
  id: string;
  name: string;
  schemaVersion: number;
  ownerId: string;
  trialStartDate: number;
  trialEndDate?: number;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing' | 'expired' | 'pending_verification';
  subscriptionPlan: string;
  subscriptionTier?: string;
  subscriptionStartDate?: number;
  subscriptionEndDate?: number;
  expiryDate?: number;
  createdAt: number;
  updatedAt: number;
}

// Phase 1 - Fleet Management Types

export interface FleetAccount extends TenantDocument {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  balance: number; // Positive means they owe us
  status: 'active' | 'suspended' | 'closed';
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface FleetVehicle extends TenantDocument {
  id: string;
  accountId: string;
  registrationNumber: string;
  make: string;
  model: string;
  category: 'car' | 'truck' | 'bus' | 'van' | 'heavy_machinery';
  rfidTag?: string;
  status: 'active' | 'inactive' | 'maintenance';
  monthlyFuelLimit: number; // in Liters
  currentMonthConsumption: number; // in Liters
}

export interface Driver extends TenantDocument {
  id: string;
  accountId: string;
  name: string;
  licenseNumber: string;
  phone: string;
  assignedVehicleId?: string;
  status: 'active' | 'suspended';
}

export interface FleetTransaction extends TenantDocument {
  id: string;
  accountId: string;
  vehicleId?: string;
  driverId?: string;
  productId: string; // Type of fuel
  date: string;
  quantity: number;
  rate: number;
  amount: number;
  type: 'consumption' | 'payment' | 'adjustment';
  paymentMode?: 'cash' | 'cheque' | 'bank_transfer' | 'credit';
  referenceNumber?: string;
  invoiceId?: string;
}

// Phase 2 - Logistics & Tanker Operations Types

export interface TankerSchedule extends TenantDocument {
  id: string;
  supplierId: string;
  poNumber: string; // Purchase Order Number
  productId: string;
  orderedQuantity: number;
  expectedDeliveryDate: string; // ISO date or datetime
  eta?: string; // Estimated Time of Arrival
  driverName?: string;
  driverPhone?: string;
  vehicleRegNo?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
}

export interface TankerDelivery extends TenantDocument {
  id: string;
  scheduleId: string;
  tankId: string;
  actualDeliveryDate: string;
  invoiceQuantity: number;
  actualDipQuantity: number; // Dip difference after decanting
  shortageQuantity: number; // Invoice - Actual Dip
  shortageAmount: number; // Value of lost fuel
  status: 'verified' | 'disputed';
  decantedBy: string; // Staff ID
  notes?: string;
}

// Phase 3 - Loss Prevention & Compliance Types

export interface VarianceIncident extends TenantDocument {
  id: string;
  date: string;
  type: 'tank_shrinkage' | 'cash_variance' | 'thermal_expansion' | 'suspected_theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceId: string; // Tank ID, Shift ID, or Delivery ID
  expectedAmount: number; // Volume or Cash
  actualAmount: number; // Volume or Cash
  varianceAmount: number; // The difference
  financialLoss: number; // Monetary value of the variance
  status: 'open' | 'investigating' | 'resolved';
  investigatorId?: string; // Staff ID
  resolutionNotes?: string;
}

// Phase 4 - Maintenance & Asset Management Types

export interface Asset extends TenantDocument {
  id: string;
  name: string; // e.g., Pump 1, Generator A
  type: 'pump' | 'nozzle' | 'generator' | 'compressor' | 'other';
  serialNumber?: string;
  installationDate: string;
  warrantyExpiryDate?: string;
  status: 'active' | 'under_maintenance' | 'retired';
}

export interface MaintenanceRecord extends TenantDocument {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective';
  description: string;
  scheduledDate: string;
  completedDate?: string;
  cost: number;
  provider: string; // Internal staff or external vendor
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

// Phase 5 - Loyalty & Corporate Rewards Types

export interface LoyaltyMember extends TenantDocument {
  id: string;
  name: string;
  phone: string;
  cardNumber?: string;
  email?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  pointsBalance: number;
  status: 'active' | 'suspended';
  joinDate: string;
}

export interface RewardTransaction extends TenantDocument {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'adjustment';
  points: number; // Positive for earn/adjustment, negative for redeem
  sourceTransactionId?: string; // Optional link to a POS receipt
  description: string;
  date: string;
}

export interface JournalEntry extends TenantDocument {
  id: string;
  date: string; // ISO DateTime string
  partyId?: string; // customerId, supplierId, bankId, digitalId, or staffId
  partyType?: 'customer' | 'supplier' | 'bank' | 'digital' | 'staff' | 'expense' | 'revenue' | 'shift' | 'asset';
  partyName?: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  referenceId: string; // shiftId, lubePosSaleId, standaloneExpenseId
  runningBalanceAfter?: number;
  isLocked?: boolean;
}

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isAlert?: boolean;
  confirmText?: string;
  cancelText?: string;
}

// ==========================================
// TREASURY & CASH CONTROL MODULE (PHASE 3)
// ==========================================

export type CashAccountType = 'shift_cash' | 'main_safe' | 'owner_cash' | 'bank' | 'digital';

export interface CashAccount extends TenantDocument {
  id: string;
  name: string; // e.g. "Main Safe", "Shift Cash Pool"
  type: CashAccountType;
  balance: number;
  bankAccountId?: string; // If mapped directly to BankAccount
  digitalAccountId?: string; // If mapped to DigitalAccount
}

export type TreasuryTransactionType = 'transfer' | 'deposit' | 'withdrawal' | 'supplier_payment' | 'reconciliation' | 'adjustment' | 'income' | 'expense';

export interface TreasuryTransaction extends TenantDocument {
  id: string;
  date: string;
  sourceAccountId?: string;
  sourceAccountType?: CashAccountType;
  destinationAccountId?: string;
  destinationAccountType?: CashAccountType;
  amount: number;
  type: TreasuryTransactionType;
  referenceId?: string; // invoice number, shift ID, etc.
  description: string;
  performedBy: string; // user ID or name
  status: 'completed' | 'pending' | 'failed';
}

export interface CashReconciliation extends TenantDocument {
  id: string;
  date: string;
  shiftId?: string;
  accountId: string; // The account being reconciled (usually shift_cash or main_safe)
  expectedCash: number;
  physicalCash: number;
  variance: number; // positive = overage, negative = shortage
  notes: string;
  reconciledBy: string;
}

export interface OwnerDrawing extends TenantDocument {
  id: string;
  date: string;
  amount: number;
  sourceAccountId: string;
  sourceAccountType: CashAccountType;
  description: string;
  withdrawnBy: string; // Usually the owner's ID
}