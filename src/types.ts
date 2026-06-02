/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Staff {
  id: string;
  name: string;
  urduName: string;
  role: 'owner' | 'manager' | 'cashier' | 'salesman';
  salary: number;
  advances: number;
  active: boolean;
  pin: string;
  phone?: string;
  cnic?: string;
  advanceBalance?: number;
  salaryBalance?: number;
}

export type ProductType = 'fuel' | 'lube' | 'other';

export interface Product {
  id: string;
  name: string;
  urduName: string;
  rate: number;
  unit: string;
  type: ProductType;
  currentStock: number;
  minStock: number;
  capacity?: number;
}

export interface Nozzle {
  id: string;
  pumpId: string;
  name: string;
  productId: string;
  tankId?: string;
  startReading?: number;
  currentReading?: number;
}

export interface Pump {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  urduName: string;
  contact: string;
  address: string;
  creditLimit: number;
  balance: number; // Positive means customer owes us money (Dr)
}

export interface Supplier {
  id: string;
  name: string;
  urduName: string;
  contact: string;
  accountNo: string;
  balance: number; // Positive means we owe the supplier money (Cr)
}

export interface DebitEntry {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  rate: number;
  amount: number;
  note: string;
}

export interface RecoveryEntry {
  id: string;
  customerId: string;
  amount: number;
  mode: 'cash' | 'cheque' | 'transfer';
  reference: string;
}

export interface ExpenseEntry {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paidFrom: 'cash' | 'bank';
  staffId?: string;
}

export interface BankCashEntry {
  id: string;
  bankAccountId: string;
  amount: number;
  reference: string;
  customerId?: string;
}

export interface DigitalCashEntry {
  id: string;
  method: string;
  amount: number;
  transactionId: string;
  accountHolder?: string;
}

export interface LubeSale {
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

export interface LubePosSale {
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

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  mode: 'cash' | 'cheque' | 'transfer';
  bankAccountId?: string;
  reference: string;
}

export interface DiscountEntry {
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

export interface Shift {
  id: string;
  staffId: string;
  type: 'day' | 'night';
  date: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'closed';
  
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

export interface BankAccount {
  id: string;
  name: string;
  accountNo: string;
  balance: number;
}

export interface DigitalAccount {
  id: string;
  name: string;
  accountNo: string;
  balance: number;
}

export interface StockTransaction {
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
}

export interface Station {
  id: string;
  name: string;
  urduName: string;
  address: string;
  ntn: string;
  ownerContact: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  details: string;
  operator: string;
}

export interface GlobalSettings {
  stationName: string;
  stationUrduName: string;
  address: string;
  ntn: string;
  ownerContact: string;
  theme: 'light' | 'dark' | 'blue' | 'emerald' | 'orange';
  language: 'en' | 'ur' | 'ar' | 'es' | 'zh';
  currency?: string;
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

export interface Tank {
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

export interface RateHistoryEntry {
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
}

export interface StaffFinanceEntry {
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

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: 'present' | 'absent' | 'off' | 'late' | 'leave';
  checkIn?: string;
  checkOut?: string;
}
