/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import {
  Staff,
  Product,
  Nozzle,
  Pump,
  Customer,
  Supplier,
  Shift,
  BankAccount,
  DigitalAccount,
  StockTransaction,
  GlobalSettings,
  ExpenseEntry,
  Tank,
  RateHistoryEntry,
  StaffFinanceEntry,
  AttendanceRecord,
  Station,
  AuditTrailEntry,
  LubePosSale
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'fuelpro_settings',
  STAFF: 'fuelpro_staff',
  PRODUCTS: 'fuelpro_products',
  PUMPS: 'fuelpro_pumps',
  NOZZLES: 'fuelpro_nozzles',
  CUSTOMERS: 'fuelpro_customers',
  SUPPLIERS: 'fuelpro_suppliers',
  SHIFTS: 'fuelpro_shifts',
  BANKS: 'fuelpro_banks',
  DIGITAL_ACCOUNTS: 'fuelpro_digital_accounts',
  STOCK_TXNS: 'fuelpro_stock_txns',
  TANKS: 'fuelpro_tanks',
  RATE_HISTORY: 'fuelpro_rate_history',
  STAFF_FINANCE: 'fuelpro_staff_finance',
  ATTENDANCE: 'fuelpro_attendance'
};

const SPECIAL_STORAGE_KEYS = {
  STANDALONE_EXPENSES: 'fuelpro_standalone_expenses',
  RECONCILED_SHIFTS: 'fuelpro_reconciled_shifts',
  SETTINGS_AUDIT_TRAIL: 'fuelpro_settings_audit_trail',
  LUBE_POS_SALES: 'fuelpro_lube_pos_sales'
};

// Clear trigger for clean slate if needed
if (typeof window !== 'undefined' && !localStorage.getItem('fuelpro_fresh_v4_clean')) {
  localStorage.clear();
  localStorage.setItem('fuelpro_fresh_v4_clean', 'true');
}

const DEFAULT_STATION_ID = 'st_default';
const LUBE_STATION_ID = 'st_lube';
const STATION_SCOPE_MIGRATION_KEY = 'fuelpro_station_scope_v2';

// ==========================================
// SEED DATA FOR BUSINESS 1: FUEL STATION (st_default)
// ==========================================
const SEED_FUEL_STATION: Station = {
  id: DEFAULT_STATION_ID,
  name: 'PSO Super Star Fuel Station',
  urduName: 'پی ایس او سپر اسٹار فیول اسٹیشن',
  address: 'Main Kyb-e-Ittehad, DHA Phase 6, Karachi',
  ntn: 'NTN-4839201-5-PSO',
  ownerContact: '0300-8884422'
};

const SEED_FUEL_SETTINGS: GlobalSettings = {
  stationName: 'PSO Super Star Fuel Station',
  stationUrduName: 'پی ایس او سپر اسٹار فیول اسٹیشن',
  address: 'Main Kyb-e-Ittehad, DHA Phase 6, Karachi',
  ntn: 'NTN-4839201-5-PSO',
  ownerContact: '0300-8884422',
  theme: 'orange',
  language: 'en',
  currency: 'PKR'
};

// ==========================================
// SEED DATA FOR BUSINESS 2: LUBE BUSINESS (st_lube)
// ==========================================
const SEED_LUBE_STATION: Station = {
  id: LUBE_STATION_ID,
  name: 'Super Star Lube Hub',
  urduName: 'سپر اسٹار لیوب ہب',
  address: 'Main Commercial Area, DHA Phase 5, Karachi',
  ntn: 'NTN-9847291-3-LUBE',
  ownerContact: '0316-8432329'
};

const SEED_LUBE_SETTINGS: GlobalSettings = {
  stationName: 'Super Star Lube Hub',
  stationUrduName: 'سپر اسٹار لیوب ہب',
  address: 'Main Commercial Area, DHA Phase 5, Karachi',
  ntn: 'NTN-9847291-3-LUBE',
  ownerContact: '0316-8432329',
  theme: 'blue',
  language: 'en',
  currency: 'PKR'
};

const SEED_LUBE_STAFF: Staff[] = [
  { id: 'st_l_1', name: 'Zohaib Butt', urduName: 'زہیب بٹ', role: 'owner', salary: 150000, advances: 0, active: true, pin: '1234', phone: '0316-8432329' },
  { id: 'st_l_2', name: 'Muhammad Waqas', urduName: 'محمد وقاص', role: 'manager', salary: 45000, advances: 0, active: true, pin: '2222', phone: '0300-1234567' },
  { id: 'st_l_3', name: 'Sajid Ali', urduName: 'ساجد علی', role: 'cashier', salary: 28000, advances: 0, active: true, pin: '1111', phone: '0300-7654321' }
];

const SEED_LUBE_PRODUCTS: Product[] = [
  { id: 'prod_l1', name: 'Shell Helix Ultra 5W-40 (4L)', urduName: 'شیل ہیلکس الٹرا 5W-40', rate: 9400, unit: 'Bottles', type: 'lube', currentStock: 85, minStock: 10, capacity: 150 },
  { id: 'prod_l2', name: 'Rimula R4 15W-40 (4L)', urduName: 'ریمولا R4 15W-40', rate: 7200, unit: 'Bottles', type: 'lube', currentStock: 60, minStock: 15, capacity: 100 },
  { id: 'prod_l3', name: 'Premium Genuine Oil Filter', urduName: 'پریمیم آئل فلٹر', rate: 1500, unit: 'Packets', type: 'other', currentStock: 120, minStock: 20, capacity: 250 },
  { id: 'prod_l4', name: 'Toyota Genuine Air Filter', urduName: 'ٹوئوٹا ایئر فلٹر', rate: 2500, unit: 'Packets', type: 'other', currentStock: 80, minStock: 12, capacity: 200 },
  { id: 'prod_l5', name: 'Castrol Magnatec 10W-40 (4L)', urduName: 'کیسٹرول میگنیٹیک 10W-40', rate: 8500, unit: 'Bottles', type: 'lube', currentStock: 45, minStock: 8, capacity: 120 }
];

const SEED_LUBE_CUSTOMERS: Customer[] = [
  { id: 'cust_l1', name: 'Faisal Auto Care', urduName: 'فیصل آٹو کیئر', contact: '0333-1234567', address: 'DHA Phase 2, Karachi', balance: 35000, creditLimit: 200000 },
  { id: 'cust_l2', name: 'Defense Service Station', urduName: 'ڈیفنس سروس اسٹیشن', contact: '021-3567890', address: 'Gizri Road, Karachi', balance: -8500, creditLimit: 100000 },
  { id: 'cust_l3', name: 'Elite Car Spa', urduName: 'ایلیٹ کار اسپار', contact: '0312-9876543', address: 'Clifton Block 5, Karachi', balance: 12400, creditLimit: 150000 }
];

const SEED_LUBE_SUPPLIERS: Supplier[] = [
  { id: 'sup_l1', name: 'Shell Pakistan Distributor HQ', urduName: 'شیل پاکستان ڈسٹریبیوٹر', contact: '021-111-743-557', accountNo: 'MEEZAN-9832049219', balance: 150000 },
  { id: 'sup_l2', name: 'Guard Filter Supply Depot', urduName: 'گارڈ فلٹر ڈسٹری بیوشن', contact: '042-3584910', accountNo: 'HBL-12498392109', balance: 45000 }
];

const SEED_LUBE_BANKS: BankAccount[] = [
  { id: 'bank_l1', name: 'Meezan Bank Lube Account', accountNo: '0250-9832049219', balance: 385000 },
  { id: 'bank_l2', name: 'HBL Business Account', accountNo: '1249-8392109281', balance: 145000 }
];

const SEED_LUBE_DIGITAL_ACCOUNTS: DigitalAccount[] = [
  { id: 'da_l1', name: 'JazzCash Lube Merchant', accountNo: '0316-8432329', balance: 25000 },
  { id: 'da_l2', name: 'EasyPaisa Business Wallet', accountNo: '0300-8884422', balance: 18000 }
];

const SEED_LUBE_PUMPS: Pump[] = [
  { id: 'pump_l1', name: 'Service Pit #1' },
  { id: 'pump_l2', name: 'Service Pit #2' }
];

const SEED_LUBE_NOZZLES: Nozzle[] = [
  { id: 'nozzle_l1', name: 'Pit 1 Shell Helix', pumpId: 'pump_l1', productId: 'prod_l1', tankId: 'tank_l1', startReading: 0, currentReading: 0 },
  { id: 'nozzle_l2', name: 'Pit 2 Rimula', pumpId: 'pump_l2', productId: 'prod_l2', tankId: 'tank_l1', startReading: 0, currentReading: 0 }
];

const SEED_LUBE_TANKS: Tank[] = [
  { id: 'tank_l1', name: 'Lube Pit #1 Hydraulic Reservoir', productId: 'prod_l1', capacity: 2000, safeLevel: 1500, criticalLevel: 300, currentStock: 1200, openingStock: 1200, dipChart: [] }
];

// ==========================================
// SEED DATA FOR BUSINESS 1: FUEL STATION FALLBACKS
// ==========================================
const SEED_FUEL_STAFF: Staff[] = [
  { id: 'st_f_1', name: 'Sohail Khan', urduName: 'سہیل خان', role: 'owner', salary: 200000, advances: 0, active: true, pin: '1234', phone: '0300-8884422' },
  { id: 'st_f_2', name: 'Yasir Shah', urduName: 'یاسر شاہ', role: 'manager', salary: 50000, advances: 0, active: true, pin: '2222', phone: '0300-1112223' },
  { id: 'st_f_3', name: 'Rashid Minhas', urduName: 'راشد منہاس', role: 'salesman', salary: 25000, advances: 0, active: true, pin: '1111', phone: '0333-4445556' }
];

const SEED_FUEL_PRODUCTS: Product[] = [
  { id: 'prod_f1', name: 'Altron Premium PMG (Petrol)', urduName: 'پٹرول مائع', rate: 275.50, unit: 'Ltrs', type: 'fuel', currentStock: 18500, minStock: 2000, capacity: 25000 },
  { id: 'prod_f2', name: 'Euro 5 HSD (Diesel)', urduName: 'ڈیزل مائع', rate: 284.10, unit: 'Ltrs', type: 'fuel', currentStock: 14200, minStock: 3000, capacity: 25000 },
  { id: 'prod_f3', name: 'Altron X High Octane (HOBC)', urduName: 'ہائی اوکٹین', rate: 298.60, unit: 'Ltrs', type: 'fuel', currentStock: 6800, minStock: 1000, capacity: 15000 }
];

const SEED_FUEL_PUMPS: Pump[] = [
  { id: 'pump_f1', name: 'Dispenser Island #1' },
  { id: 'pump_f2', name: 'Dispenser Island #2' }
];

const SEED_FUEL_NOZZLES: Nozzle[] = [
  { id: 'nozzle_f1', name: 'Nozzle 1A PMG', pumpId: 'pump_f1', productId: 'prod_f1', tankId: 'tank_f1', startReading: 125000, currentReading: 125000 },
  { id: 'nozzle_f2', name: 'Nozzle 1B HSD', pumpId: 'pump_f1', productId: 'prod_f2', tankId: 'tank_f2', startReading:  85000, currentReading:  85000 },
  { id: 'nozzle_f3', name: 'Nozzle 2A HOBC', pumpId: 'pump_f2', productId: 'prod_f3', tankId: 'tank_f3', startReading:  42000, currentReading:  42000 }
];

const SEED_FUEL_TANKS: Tank[] = [
  { id: 'tank_f1', name: 'PMG Storage Tank 1', productId: 'prod_f1', capacity: 25000, safeLevel: 22000, criticalLevel: 2000, currentStock: 18500, openingStock: 18500, dipChart: [] },
  { id: 'tank_f2', name: 'HSD Storage Tank 2', productId: 'prod_f2', capacity: 25000, safeLevel: 22000, criticalLevel: 3000, currentStock: 14200, openingStock: 14200, dipChart: [] },
  { id: 'tank_f3', name: 'HOBC Storage Tank 3', productId: 'prod_f3', capacity: 15000, safeLevel: 12000, criticalLevel: 1000, currentStock: 6800, openingStock: 6800, dipChart: [] }
];

const SEED_FUEL_CUSTOMERS: Customer[] = [
  { id: 'cust_f1', name: 'Sindh High-Way Police Depot', urduName: 'سندھ ہائی وے پولیس', contact: '021-99212015', address: 'Super-Highway HQ, Karachi', balance: 145000, creditLimit: 500000 },
  { id: 'cust_f2', name: 'Karachi Municipal Corporation', urduName: 'بلدیہ عظمی کراچی', contact: '021-99215111', address: 'Civic Centre, Karachi', balance: 289000, creditLimit: 1000000 },
  { id: 'cust_f3', name: 'Green Luxury Travels Bus Co.', urduName: 'گرین لگژری ٹریول', contact: '0321-8283849', address: 'Sohrab Goth Bus terminal, Karachi', balance: -45000, creditLimit: 300000 }
];

const SEED_FUEL_SUPPLIERS: Supplier[] = [
  { id: 'sup_f1', name: 'Pakistan State Oil Co. HQ', urduName: 'پاکستان اسٹیٹ آئل', contact: '021-111-111-PSO', accountNo: 'NBP-0010482015', balance: 1250000 },
  { id: 'sup_f2', name: 'Shell Pakistan Depot Keamari', urduName: 'شیل پاکستان کیماڑی', contact: '021-111-743-557', accountNo: 'Meezan-9842109281', balance: 450000 }
];

const SEED_FUEL_BANKS: BankAccount[] = [
  { id: 'bank_f1', name: 'National Bank of Pakistan', accountNo: 'NBP-0012-984320-11', balance: 1250000 },
  { id: 'bank_f2', name: 'Meezan Bank PSO Account', accountNo: 'MEEZAN-0320-84329-01', balance: 480000 }
];

const SEED_FUEL_DIGITAL_ACCOUNTS: DigitalAccount[] = [
  { id: 'da_f1', name: 'HBL PSO Fuel card POS', accountNo: 'HBL-POS-4839210-9', balance: 185000 },
  { id: 'da_f2', name: 'EasyPaisa Merchant Wallet', accountNo: '0300-8884422', balance: 45000 }
];

// ==========================================
// DB ENGINE API WITH STRUCTURAL ISOLATION
// ==========================================

const STATION_DATA_BASE_KEYS = [
  ...Object.values(STORAGE_KEYS),
  ...Object.values(SPECIAL_STORAGE_KEYS)
];

function resolveStationId(stationId?: string): string {
  return stationId || DEFAULT_STATION_ID;
}

function buildScopedStorageKey(stationId: string, baseKey: string): string {
  return `${baseKey}_${resolveStationId(stationId)}`;
}

function buildLegacyStorageKey(stationId: string, baseKey: string): string {
  const resolvedStationId = resolveStationId(stationId);
  if (resolvedStationId === DEFAULT_STATION_ID) {
    return baseKey;
  }
  return `${baseKey}_${resolvedStationId}`;
}

function migrateLegacyStationScope(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (localStorage.getItem(STATION_SCOPE_MIGRATION_KEY)) {
    return;
  }

  STATION_DATA_BASE_KEYS.forEach((baseKey) => {
    const scopedKey = buildScopedStorageKey(DEFAULT_STATION_ID, baseKey);
    const legacyKey = buildLegacyStorageKey(DEFAULT_STATION_ID, baseKey);
    const scopedValue = localStorage.getItem(scopedKey);
    const legacyValue = localStorage.getItem(legacyKey);

    if (legacyKey !== scopedKey && scopedValue === null && legacyValue !== null) {
      localStorage.setItem(scopedKey, legacyValue);
    }

    if (legacyKey !== scopedKey && legacyValue !== null) {
      localStorage.removeItem(legacyKey);
    }
  });

  localStorage.setItem(STATION_SCOPE_MIGRATION_KEY, 'true');
}

migrateLegacyStationScope();

function getStorageItem<T>(key: string, seed: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return seed;
  }
}

function setStorageItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
}

export const db = {
  getStationStorageKey: (stationId: string, baseKey: string): string => {
    return buildScopedStorageKey(stationId, baseKey);
  },

  getStationsList: (): Station[] => {
    try {
      const list = localStorage.getItem('fuelpro_stations');
      if (!list) {
        const defaultList = [SEED_FUEL_STATION, SEED_LUBE_STATION];
        localStorage.setItem('fuelpro_stations', JSON.stringify(defaultList));
        return defaultList;
      }
      const parsed = JSON.parse(list) as Station[];
      // Self-Correction: ensure Lube station exists for smooth Dual-Business ERP
      if (!parsed.some(s => s.id === LUBE_STATION_ID)) {
        parsed.push(SEED_LUBE_STATION);
        localStorage.setItem('fuelpro_stations', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return [SEED_FUEL_STATION, SEED_LUBE_STATION];
    }
  },

  saveStationsList: (stations: Station[]) => {
    localStorage.setItem('fuelpro_stations', JSON.stringify(stations));
  },

  getActiveStationId: (): string => {
    try {
      const active = localStorage.getItem('fuelpro_active_station_id');
      if (!active) {
        localStorage.setItem('fuelpro_active_station_id', DEFAULT_STATION_ID);
        return DEFAULT_STATION_ID;
      }
      return active;
    } catch {
      return DEFAULT_STATION_ID;
    }
  },

  setActiveStationId: (id: string) => {
    localStorage.setItem('fuelpro_active_station_id', id);
  },

  getSettings: (stationId: string): GlobalSettings => {
    const key = db.getStationStorageKey(stationId, STORAGE_KEYS.SETTINGS);
    const item = localStorage.getItem(key);
    if (!item) {
      const isLube = stationId === LUBE_STATION_ID;
      const initialSettings = isLube ? SEED_LUBE_SETTINGS : SEED_FUEL_SETTINGS;
      localStorage.setItem(key, JSON.stringify(initialSettings));
      return initialSettings;
    }
    return JSON.parse(item) as GlobalSettings;
  },
  
  saveSettings: (stationId: string, settings: GlobalSettings) => 
    localStorage.setItem(db.getStationStorageKey(stationId, STORAGE_KEYS.SETTINGS), JSON.stringify(settings)),

  getStaffList: (stationId: string): Staff[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_STAFF : SEED_FUEL_STAFF;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.STAFF), seed);
  },
  saveStaffList: (stationId: string, staff: Staff[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.STAFF), staff),

  getProducts: (stationId: string): Product[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_PRODUCTS : SEED_FUEL_PRODUCTS;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.PRODUCTS), seed);
  },
  saveProducts: (stationId: string, products: Product[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.PRODUCTS), products),

  getPumps: (stationId: string): Pump[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_PUMPS : SEED_FUEL_PUMPS;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.PUMPS), seed);
  },
  savePumps: (stationId: string, pumps: Pump[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.PUMPS), pumps),

  getNozzles: (stationId: string): Nozzle[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_NOZZLES : SEED_FUEL_NOZZLES;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.NOZZLES), seed);
  },
  saveNozzles: (stationId: string, nozzles: Nozzle[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.NOZZLES), nozzles),

  getCustomers: (stationId: string): Customer[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_CUSTOMERS : SEED_FUEL_CUSTOMERS;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.CUSTOMERS), seed);
  },
  saveCustomers: (stationId: string, customers: Customer[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.CUSTOMERS), customers),

  getSuppliers: (stationId: string): Supplier[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_SUPPLIERS : SEED_FUEL_SUPPLIERS;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.SUPPLIERS), seed);
  },
  saveSuppliers: (stationId: string, suppliers: Supplier[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.SUPPLIERS), suppliers),

  getShifts: (stationId: string): Shift[] => 
    getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.SHIFTS), [] as Shift[]),
  saveShifts: (stationId: string, shifts: Shift[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.SHIFTS), shifts),

  getBankAccounts: (stationId: string): BankAccount[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_BANKS : SEED_FUEL_BANKS;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.BANKS), seed);
  },
  saveBankAccounts: (stationId: string, banks: BankAccount[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.BANKS), banks),

  getDigitalAccounts: (stationId: string): DigitalAccount[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_DIGITAL_ACCOUNTS : SEED_FUEL_DIGITAL_ACCOUNTS;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.DIGITAL_ACCOUNTS), seed);
  },
  saveDigitalAccounts: (stationId: string, digital: DigitalAccount[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.DIGITAL_ACCOUNTS), digital),

  getStockTransactions: (stationId: string): StockTransaction[] => 
    getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.STOCK_TXNS), [] as StockTransaction[]),
  saveStockTransactions: (stationId: string, txns: StockTransaction[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.STOCK_TXNS), txns),

  getTanks: (stationId: string): Tank[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_TANKS : SEED_FUEL_TANKS;
    return getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.TANKS), seed);
  },
  saveTanks: (stationId: string, tanks: Tank[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.TANKS), tanks),

  getRateHistory: (stationId: string): RateHistoryEntry[] => 
    getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.RATE_HISTORY), [] as RateHistoryEntry[]),
  saveRateHistory: (stationId: string, history: RateHistoryEntry[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.RATE_HISTORY), history),

  getStaffFinance: (stationId: string): StaffFinanceEntry[] => 
    getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.STAFF_FINANCE), [] as StaffFinanceEntry[]),
  saveStaffFinance: (stationId: string, finances: StaffFinanceEntry[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.STAFF_FINANCE), finances),

  getAttendance: (stationId: string): AttendanceRecord[] => 
    getStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.ATTENDANCE), [] as AttendanceRecord[]),
  saveAttendance: (stationId: string, records: AttendanceRecord[]) => 
    setStorageItem(db.getStationStorageKey(stationId, STORAGE_KEYS.ATTENDANCE), records),

  getStandaloneExpenses: (stationId: string): ExpenseEntry[] =>
    getStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.STANDALONE_EXPENSES),
      [] as ExpenseEntry[]
    ),
  saveStandaloneExpenses: (stationId: string, expenses: ExpenseEntry[]) =>
    setStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.STANDALONE_EXPENSES),
      expenses
    ),

  getReconciledShiftIds: (stationId: string): string[] =>
    getStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.RECONCILED_SHIFTS),
      [] as string[]
    ),
  saveReconciledShiftIds: (stationId: string, ids: string[]) =>
    setStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.RECONCILED_SHIFTS),
      ids
    ),

  getSettingsAuditTrail: (stationId: string): AuditTrailEntry[] =>
    getStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.SETTINGS_AUDIT_TRAIL),
      [] as AuditTrailEntry[]
    ),
  saveSettingsAuditTrail: (stationId: string, entries: AuditTrailEntry[]) =>
    setStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.SETTINGS_AUDIT_TRAIL),
      entries
    ),
  getLubePosSales: (stationId: string): LubePosSale[] =>
    getStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.LUBE_POS_SALES),
      [] as LubePosSale[]
    ),
  saveLubePosSales: (stationId: string, sales: LubePosSale[]) =>
    setStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.LUBE_POS_SALES),
      sales
    ),
  clearSettingsAuditTrail: (stationId: string) => {
    const scopedKey = db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.SETTINGS_AUDIT_TRAIL);
    const legacyKey = buildLegacyStorageKey(stationId, SPECIAL_STORAGE_KEYS.SETTINGS_AUDIT_TRAIL);
    localStorage.removeItem(scopedKey);
    if (legacyKey !== scopedKey) {
      localStorage.removeItem(legacyKey);
    }
  },

  clearStationData: (stationId: string) => {
    STATION_DATA_BASE_KEYS.forEach((baseKey) => {
      const scopedKey = db.getStationStorageKey(stationId, baseKey);
      const legacyKey = buildLegacyStorageKey(stationId, baseKey);
      localStorage.removeItem(scopedKey);
      if (legacyKey !== scopedKey) {
        localStorage.removeItem(legacyKey);
      }
    });
  },

  resetToDefault: () => {
    localStorage.clear();
    window.location.reload();
  }
};
