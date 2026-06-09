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
}

export interface DebitEntry extends TenantDocument {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  rate: number;
  amount: number;
  note: string;
}

export interface RecoveryEntry extends TenantDocument {
  id: string;
  customerId: string;
  amount: number;
  mode: 'cash' | 'cheque' | 'transfer';
  reference: string;
}

export interface ExpenseEntry extends TenantDocument {
  id: string;
  category: string;
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

export interface LubeSale extends TenantDocument {
  id: string;
  itemId: string;
  quantity: number;
  price: number;
  amount: number;
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

export interface ShiftRateSegment {
  id: string;
  shiftId: string;
  nozzleId: string;
  productId: string;
  rate: number;
  meterOpen: number;
  meterClose: number;
  litersSold: number;
  revenue: number;
  segmentIndex: number;
  startedAt: string;
  closedAt: string;
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
  segments?: ShiftRateSegment[];
  
  openingReadings: { [nozzleId: string]: number };
  closingReadings: { [nozzleId: string]: number };
  testLiters: { [productId: string]: number };
  
  debitEntries: DebitEntry[];
  recoveryEntries: RecoveryEntry[];
  expenseEntries: ExpenseEntry[];
  bankCashEntries: BankCashEntry[];
  digitalCashEntries: DigitalCashEntry[];
  discountEntries?: DiscountEntry[];
  lubeSales: LubeSale[];
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
  tankId?: string;
  productId: string;
  batchNumber: string;
  supplierId?: string;
  date: string;
  qtyReceived: number;
  qtyRemaining: number;

  ograPumpPrice: number;
  dealerMargin: number;
  omcInvoicePrice: number;
  carriageTotal: number;
  carriagePerLiter: number;
  otherChargesTotal: number;
  otherPerLiter: number;
  landedCostPerLiter: number;

  grossMarginPerLiter: number;
  netMarginPerLiter: number;
  expectedGrossProfit: number;
  expectedNetProfit: number;

  dipBefore?: number;
  dipAfter?: number;

  status: 'active' | 'depleted';
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
  id: string;
  timestamp: string; // ISO String or unix timestamp
  category: string;
  action: string;
  details: string;
  operator: string;
}

export interface GlobalSettings extends TenantDocument {
  stationName: string;
  stationUrduName: string;
  address: string;
  ntn: string;
  ownerContact: string;
  theme: 'light' | 'dark' | 'blue' | 'emerald' | 'orange';
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

export interface RateHistoryEntry extends TenantDocument {
  id: string;
  productId: string;
  date: string;
  oldRate: number;
  newRate: number;
  change: number;
  stockAtTime: number;
  impactAmount: number; // old vs new stock gain/loss
  reason: string;
  changedBy: string;
  difference?: number;
  stockAtChange?: number;
  gainLoss?: number;
  changedAt?: number;
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
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  subscriptionPlan: string;
  subscriptionStartDate?: number;
  subscriptionEndDate?: number;
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
  partyType?: 'customer' | 'supplier' | 'bank' | 'digital' | 'staff' | 'expense' | 'revenue';
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