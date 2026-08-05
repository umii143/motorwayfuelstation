/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './types/workforce.types';

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
  dutyStatus?: 'on_duty' | 'off_duty' | 'break' | 'leave' | 'late';
  currentAssignment?: string;
  clockInTime?: string;
  permissions?: string[];
  allowedBusinessIds?: string[];
  pin: string;
  phone?: string;
  cnic?: string;
  advanceBalance?: number;
  salaryBalance?: number;
  loanBalance?: number;
  photoUrl?: string;
  joiningDate?: string;
  designation?: string;
}

export interface DealerMarginSetting {
  id: string;
  productType: 'petrol' | 'diesel' | 'kerosene' | 'ldo' | string;
  marginPerLiter: number; // e.g. 8.64
  effectiveFrom: string; // ISO date:"2024-01-01"
  effectiveTo: string | null; // null = currently active
  setBy: string; // userId
  notes: string; //"OGRA notification ref XYZ"
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

  // Backward compatibility / UI requirements
  purchaseRate?: number;
  currentRate?: number;
  costPrice?: number; // Unit cost price (reporting/inventory valuation)
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
  category?: string; // Legacy / Primary category
  categoryId?: string;
  categoryName?: string;
  subCategory?: string;
  amount: number;
  description: string;
  date: string;
  paidFrom: 'cash' | 'bank' | 'digital';
  paymentMethod?: 'cash' | 'bank' | 'digital';
  bankAccountId?: string;
  bankName?: string;
  digitalAccountId?: string;
  digitalName?: string;
  supplierId?: string;
  supplierName?: string;
  receiptNo?: string;
  invoiceNo?: string;
  gstAmount?: number;
  taxAmount?: number;
  attachmentUrl?: string;
  staffId?: string;
  staffName?: string;
  shiftId?: string;
  pumpId?: string;
  pumpName?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'voided';
  approvedBy?: string;
  approverRole?: 'cashier' | 'supervisor' | 'manager' | 'owner' | string;
  timestamp?: string;
  gps?: string;
  device?: string;
  ip?: string;
  recordedBy?: string; // User who recorded the expense (reporting)
  auditTrail?: DiscountAuditLog[];
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
  totalQuantity?: number; // Aggregate quantity across line items (reporting)
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

export interface DiscountAuditLog {
  timestamp: string;
  actor: string;
  role: 'cashier' | 'supervisor' | 'manager' | 'owner' | string;
  action: string;
  notes?: string;
  beforeStatus?: string;
  afterStatus?: string;
}

export interface DiscountEntry extends TenantDocument {
  id: string;
  amount: number;
  type: string;
  reason: string;
  customerName: string;
  customerId?: string;
  productId?: string;
  productName?: string;
  approvedBy: string;
  approverRole?: 'cashier' | 'supervisor' | 'manager' | 'owner' | string;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'voided';
  notes?: string;
  timestamp: string;

  // Audit & Transaction context metadata
  liters?: number;
  beforeRate?: number;
  afterRate?: number;
  discountPercent?: number;
  marginLoss?: number;
  shiftId?: string;
  pumpId?: string;
  pumpName?: string;
  nozzleId?: string;
  nozzleName?: string;
  staffId?: string;
  staffName?: string;
  vehicleNo?: string;
  fleetId?: string;
  category?: string;
  gps?: string;
  device?: string;
  ip?: string;
  auditTrail?: DiscountAuditLog[];
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

 // Enterprise Shift Intelligence Report header fields
 shiftNumber?: number;
 shiftLabel?: string; // e.g."Day Shift #12"
 shiftManagerId?: string; // Manager who supervised/closing the shift
 pumpId?: string; // Island/Pump association
 openingDateTime?: string; // ISO timestamp of shift open
 closingDateTime?: string; // ISO timestamp of shift close (finalized)
 weather?: string; // Optional weather note
 notes?: string; // Shift-level notes

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

  // Backward compatibility / UI requirements
  cashierName?: string;
  shiftName?: string; // Display shift name (reporting)
  operatorId?: string; // Operator/staff id (reporting)
  operatorName?: string; // Operator/staff display name (reporting)
  totalSales?: number;
  time?: string;
  pumpReadings?: any;
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
  type?: 'current' | 'savings' | 'islamic' | 'credit_line' | string;
  branch?: string;
  branchCode?: string;
  iban?: string;
  isActive?: boolean;
  minBalance?: number;
  openingBalance?: number;
  lastUpdated?: string;
}

export interface DigitalAccount extends TenantDocument {
  id: string;
  name: string;
  accountNo: string;
  balance: number;
  providerId?: 'easypaisa' | 'jazzcash' | 'nayapay' | 'sadapay' | 'raast' | 'hbl' | 'ubl' | 'meezan' | 'pos_machine' | 'bank_qr' | 'stripe' | 'paypal' | 'custom';
  healthStatus?: 'online' | 'offline' | 'api_error' | 'sync_error';
  mdrRate?: number;
  fixedFee?: number;
  taxRate?: number;
  maxWalletLimit?: number;
  branchId?: string;
  merchantId?: string;
  terminalId?: string;
  qrCodeData?: string;
  method?: string; // Payment method label (reporting)
}

export interface MerchantTerminal extends TenantDocument {
  id: string;
  name: string;
  serialNumber: string;
  merchantId: string;
  terminalId: string;
  terminalType: 'pos_machine' | 'qr_code' | 'online_gateway' | 'custom';
  walletAccountId: string;
  assignedCounter: string;
  pumpId?: string;
  branchId?: string;
  status: 'active' | 'maintenance' | 'disabled';
  uptimePercent?: number;
  lastSyncTime?: string;
  apiStatus?: 'online' | 'offline' | 'error' | 'api_error';
}

export interface DigitalTransaction extends TenantDocument {
  id: string;
  transactionId: string;
  referenceNo: string;
  walletAccountId: string;
  terminalId?: string;
  pumpId?: string;
  customerId?: string;
  customerName?: string;
  vehicleNo?: string;
  cnic?: string;
  phone?: string;
  operatorId?: string;
  operatorName?: string;
  shiftId?: string;
  amount: number;
  mdrFee?: number;
  taxAmount?: number;
  netReceived?: number;
  status: 'success' | 'failed' | 'pending' | 'timeout' | 'reversed' | 'cancelled';
  type: 'sale' | 'refund' | 'settlement';
  timestamp: string;
  isDuplicate?: boolean;
  fraudRiskScore?: number;
  fraudFlags?: string[];
  notes?: string;
}

export interface WalletSettlement extends TenantDocument {
  id: string;
  settlementNo: string;
  walletAccountId: string;
  bankAccountId: string;
  grossAmount: number;
  totalMdrFee: number;
  totalTax: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  referenceNo: string;
  createdDate: string;
  settlementDate?: string;
  journalEntryId?: string;
  processedBy?: string;
}

export interface FleetLoyaltyWallet extends TenantDocument {
  id: string;
  customerId: string;
  customerName: string;
  accountType: 'fleet_company' | 'oil_tanker' | 'logistics' | 'regular_driver' | 'vip_customer';
  vehicleNumbers: string[];
  preferredWalletId?: string;
  monthlySpending: number;
  totalVisits: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';
  rewardPoints: number;
  cashbackEarned: number;
  creditLimit?: number;
  favoritePumpId?: string;
  favoriteWalletName?: string;
}

export interface WalletAuditLog extends TenantDocument {
  id: string;
  action: 'created' | 'edited' | 'disabled' | 'settlement' | 'refund' | 'reconciliation' | 'fraud_alert' | 'limit_warning';
  walletAccountId?: string;
  terminalId?: string;
  transactionId?: string;
  userId: string;
  userRole: string;
  timestamp: string;
  details: string;
  discrepancyAmount?: number;
}

export interface StockBatch extends TenantDocument {
 id: string;

 // Core identifiers
 tankId?: string;
 productId: string; // Legacy: maps to productType
 productType?: string; // 'petrol' | 'diesel' | 'super' | 'kerosene' | 'ldo'
 batchNumber: string; // e.g."HSD-2025-0041"
 supplierId?: string;

 // ─── INVOICE FIELDS ────────────────────────────────────────────
 invoiceNumber?: string; //"8810/02293"
 doNumber?: string; // Delivery Order No
 tokenNumber?: string; // PSO Token No
 contractNumber?: string;
 date: string; // Legacy delivery date (kept for backward compat)
 deliveryDate?: string; // ISO date"2025-11-17"
 deliveryTime?: string; //"14:30"

 // ─── QUANTITY ──────────────────────────────────────────────────
 qtyOnInvoice?: number; // What paper invoice says
 qtyReceived: number; // Actual measured quantity
 qtyShort?: number; // qtyOnInvoice - qtyReceived (stored in DB)
 qtyRemaining: number; // Decreases as sold via FIFO

 // ─── INVOICE PRICING (NEW — Real Invoice Total Approach) ────────
 invoiceTotalAmount?: number; // Rs. 37,51,951.36 (actual total from invoice)
 invoiceCostPerLiter?: number; // Auto: invoiceTotalAmount / qtyReceived

 // ─── LEGACY PRICING (kept for backward compat) ─────────────────
 ograPumpPrice: number;
 dealerMargin: number;
 omcInvoicePrice?: number; // OLD approach: OGRA - margin (deprecated)
 carriageTotal?: number; // Legacy
 carriagePerLiter?: number; // Legacy
 otherChargesTotal?: number; // Legacy
 otherPerLiter?: number; // Legacy

 // ─── EXTRA COSTS (NEW) ─────────────────────────────────────────
 carriageAmount?: number; // Separate carriage (0 for PSO)
 carriagePaidTo?: string; //"Abdullah Enterprises"
 driverTipAmount?: number; // Cash tip paid to driver
 otherCharges?: number; // Other misc costs
 supplierCarriageInvoiced?: boolean; // PSO=true (delivery in invoice), Attock=false

 // ─── LANDED COST ───────────────────────────────────────────────
 totalExtraCosts?: number; // carriage + tip + other
 totalLandedCost?: number; // invoiceTotal + all extras
 landedCostPerLiter: number; // totalLandedCost / qtyReceived

 // ─── EXPECTED BATCH MARGIN (renamed from Gross Profit) ─────────
 expectedBatchMarginPerLiter?: number; // ograPrice - landedCostPerLiter
 expectedBatchMarginTotal?: number; // margin × qtyReceived

 // ─── LEGACY MARGIN FIELDS (kept for backward compat) ───────────
 grossMarginPerLiter?: number;
 netMarginPerLiter?: number;
 expectedGrossProfit?: number;
 expectedNetProfit?: number;

 // ─── REALIZED PROFIT (fills as FIFO sales happen) ──────────────
 totalLitersSold?: number; // Tracks how much sold from this batch
 realizedRevenue?: number; // Sum of: liters × sell_price per deduction
 realizedCOGS?: number; // Sum of: liters × landed_cost per deduction
 realizedMargin?: number; // realizedRevenue - realizedCOGS
 realizedMarginPerLiter?: number; // realizedMargin / totalLitersSold

 // ─── SEAL VERIFICATION ────────────────────────────────────────
 sealNumberFrom?: string; //"920851"
 sealNumberTo?: string; //"920862"
 totalSealsExpected?: number; // Auto: To - From + 1
 totalSealsReceived?: number; // Physical count
 sealStatus?: 'ok' | 'broken' | 'missing' | 'mismatch';
 sealNotes?: string;

 // ─── BATCH TRACEABILITY / QUALITY ─────────────────────────────
 observedGravity?: number; // e.g. 0.721
 observedTemp?: number; // e.g. 92 (°C)
 calibrationNumber?: string; //"7499"
 calibrationExpiry?: string; //"2027-05-04"
 batchTestReport?: string;
 density?: number;

 // ─── DIP READINGS ─────────────────────────────────────────────
 dipBefore?: number;
 dipAfter?: number;
 dipExpectedAfter?: number; // Auto: dipBefore + qtyReceived
 dipVariance?: number; // |dipAfter - dipExpectedAfter|

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
 receivedBy?: string; // Staff ID

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
 sellingPrice: number; // OGRA rate at time of sale
 batchLandedCost: number; // from batch.landedCostPerLiter
 realizedRevenue: number; // liters × sellingPrice
 realizedCOGS: number; // liters × landedCost
 realizedMargin: number; // revenue - cogs
 realizedMarginPerLiter: number;
 saleDate: string; // ISO date string YYYY-MM-DD
 // Note: createdAt / updatedAt from TenantDocument (number / ms)
}

// ─── SUPPLIER CLAIM ─────────────────────────────────────────────────
export interface SupplierClaim extends TenantDocument {
 id: string;
 batchId: string;
 supplierId: string;
 claimNumber: string; //"CLM-2025-0089" (auto-generated)
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
 periodMonth: string; //"2025-11" (YYYY-MM)
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
 performanceScore: number; // 0-100
 grade: 'A' | 'B' | 'C' | 'D' | 'F';
 recommendation: string;
}

export interface StockTransaction extends TenantDocument {
  id: string;
  itemId: string;
  productId?: string; // Fuel/lube product id (reporting)
  productName?: string; // Product display name (reporting)
  invoiceNumber?: string; // Supplier invoice number (reporting)
  receivedBy?: string; // Person who received the delivery (reporting)
  type: 'receipt' | 'sale' | 'adjustment' | 'dispense';
  quantity: number;
  by: string;
  date: string;
  amount?: number;
  totalAmount?: number; // Total line amount (reporting)
  rate?: number; // Unit rate (reporting)
  purchasePrice?: number;
  sellingPrice?: number;
  fuelType?: string;
  supplierId?: string;
  supplierName?: string; // Supplier display name (reporting)
  challanNo?: string; // Delivery challan reference (reporting)
  densityObserved?: number; // Observed density (petroleum reporting)
  vehicleNo?: string; // Delivery vehicle number (reporting)
  carriageCost?: number;
  tankId?: string;
  shiftId?: string; // Linked shift (fuel dispense reporting)
  pumpId?: string; // Linked pump (fuel dispense reporting)
  nozzleId?: string; // Linked nozzle (fuel dispense reporting)
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
 notes?: string;
 relatedTransactionId?: string;
}

export interface GlobalSettings extends TenantDocument {
 stationName: string;
 stationUrduName: string;
 address: string;
 ntn: string;
 ownerContact: string;
 theme: 'cream' | 'creamy' | 'light' | 'dark' | 'sunset' | 'blue' | 'emerald' | 'orange' | 'white';
 language: 'en' | 'ur' | 'ar' | 'es' | 'zh';
 currency?: string;
 receiptPrinter?: 'thermal_80mm' | 'thermal_58mm' | 'a4';
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
 screenLockEnabled?: boolean;
 screenLockPin?: string;
 failedAttempts?: number;
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
 productName?: string;
 capacity: number;
 safeLevel: number;
 criticalLevel: number;
  currentStock: number;
  currentVolume?: number; // Realtime pumpable volume (reporting fallback)
  currentDip?: number; // Latest hydrostatic dip reading (reporting)
  fuelType?: string; // Fuel grade/category (reporting)
  openingStock: number;
  physicalLabel?: string;
  calibrationDue?: string;
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
 name: string; // e.g."Main Safe","Shift Cash Pool"
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

export interface GlobalPricingConfig {
 saleActive: boolean;
 saleEndDate: string; // ISO date string
 offers: {
 [planId: string]: {
 originalPrice: number;
 salePrice: number;
 };
 };
}

// ==========================================
// ENTERPRISE BUSINESS EVENT ENGINE
// ==========================================
// The Digital Roznamcha is the single source of truth. Every operation
// emits a standardized BusinessEvent linked to the Business Graph.

export type BusinessEventType =
 | 'SHIFT_OPENED'
 | 'SHIFT_CLOSED'
 | 'SALE_CREATED'
 | 'SALE_VOIDED'
 | 'LUBE_SALE_CREATED'
 | 'CUSTOMER_CREATED'
 | 'CUSTOMER_UPDATED'
 | 'SUPPLIER_PAYMENT'
 | 'PRICE_CHANGED'
 | 'BANK_DEPOSIT'
 | 'DIGITAL_PAYMENT'
 | 'EXPENSE_ADDED'
 | 'EXPENSE_APPROVED'
 | 'TANK_DELIVERY'
 | 'TANK_DIP'
 | 'NOZZLE_READING'
 | 'METER_READING'
 | 'INVENTORY_ADJUSTMENT'
 | 'STOCK_TRANSFER'
 | 'PRODUCT_CREATED'
 | 'PRODUCT_UPDATED'
 | 'CREDIT_SALE'
 | 'RECOVERY_RECEIVED'
 | 'CASH_DEPOSIT'
 | 'JOURNAL_ENTRY'
 | 'LOGIN'
 | 'PERMISSION_CHANGED'
 | 'SETTINGS_CHANGED'
 | 'BACKUP_CREATED'
 | 'REPORT_EXPORTED'
 | 'METER_RESET'
 | 'SHIFT_FINALIZED';

export type EventSeverity = 'info' | 'success' | 'warning' | 'critical';

export type EventApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

/** A reference to a node in the Business Graph. */
export interface EventEntityRef {
 kind: 'customer' | 'supplier' | 'shift' | 'product' | 'tank' | 'nozzle' | 'invoice' | 'payment' | 'expense' | 'staff' | 'batch' | 'ledger' | 'journal' | 'audit' | 'roznamcha';
 id: string;
 label?: string;
}

export interface BusinessEvent extends TenantDocument {
 id: string;
 eventType: BusinessEventType;
 timestamp: string; // ISO datetime
 businessDate: string; // YYYY-MM-DD
 shiftId?: string;
 userId?: string;
 userName?: string;
 userRole?: string;
 stationId?: string;
 stationName?: string;
 module: string; // e.g. 'shifts', 'inventory', 'sales'
 entity?: EventEntityRef; // primary entity affected
 relatedEntities?: EventEntityRef[];
 oldValue?: any;
 newValue?: any;
 reason?: string;
 referenceNumber?: string;
 attachments?: { name: string; url: string; type: string }[];
 gps?: { lat: number; lng: number };
 device?: string;
 ip?: string;
 severity: EventSeverity;
 tags?: string[];
 approvalStatus: EventApprovalStatus;
 amount?: number; // monetary/volume impact where relevant
 summary: string; // human-readable headline
}
