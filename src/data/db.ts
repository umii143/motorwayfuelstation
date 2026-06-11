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
  LubePosSale,
  FleetAccount,
  FleetVehicle,
  Driver,
  FleetTransaction,
  TankerSchedule,
  TankerDelivery,
  VarianceIncident,
  Asset,
  MaintenanceRecord,
  RewardTransaction,
  InventoryMovement,
  JournalEntry,
  StockBatch,
  CogsRecord,
  LoyaltyMember,
  DealerMarginSetting,
  TenantDocument,
  SalaryTransaction,
  StaffLoan,
  SalaryAdvance,
  InventorySnapshot,
  CashAccount,
  TreasuryTransaction,
  OwnerDrawing,
  CashReconciliation
} from '../types';
import {
  DEFAULT_FUEL_STATION_ID,
  LUBE_STATION_ID,
  getBusinessTypeForStation,
  isolateLubePosSales,
  isolateProductRecords,
  isolateShiftRecords,
  isolateTenantRecords,
  resolveStationId,
  withBusinessScope
} from '../lib/businessScope';

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
  LUBE_POS_SALES: 'fuelpro_lube_pos_sales',
  FLEET_ACCOUNTS: 'fuelpro_fleet_accounts',
  FLEET_VEHICLES: 'fuelpro_fleet_vehicles',
  FLEET_DRIVERS: 'fuelpro_fleet_drivers',
  FLEET_TRANSACTIONS: 'fuelpro_fleet_transactions',
  TANKER_SCHEDULES: 'fuelpro_tanker_schedules',
  TANKER_DELIVERIES: 'fuelpro_tanker_deliveries',
  VARIANCE_INCIDENTS: 'fuelpro_variance_incidents',
  ASSETS: 'fuelpro_assets',
  MAINTENANCE_RECORDS: 'fuelpro_maintenance_records',
  LOYALTY_MEMBERS: 'fuelpro_loyalty_members',
  REWARD_TRANSACTIONS: 'fuelpro_reward_transactions',
  INVENTORY_MOVEMENTS: 'fuelpro_inventory_movements',
  JOURNAL_ENTRIES: 'fuelpro_journal_entries',
  STOCK_BATCHES: 'fuelpro_stock_batches',
  COGS_RECORDS: 'fuelpro_cogs_records',
  DEALER_MARGIN_SETTINGS: 'fuelpro_dealer_margin_settings',
  SALARY_TRANSACTIONS: 'fuelpro_salary_transactions',
  STAFF_LOANS: 'fuelpro_staff_loans',
  SALARY_ADVANCES: 'fuelpro_salary_advances',
  INVENTORY_SNAPSHOTS: 'fuelpro_inventory_snapshots',
  CASH_ACCOUNTS: 'fuelpro_cash_accounts',
  TREASURY_TRANSACTIONS: 'fuelpro_treasury_transactions',
  OWNER_DRAWINGS: 'fuelpro_owner_drawings',
  CASH_RECONCILIATIONS: 'fuelpro_cash_reconciliations'
};

// Clear trigger for clean slate if needed
if (typeof window !== 'undefined' && !localStorage.getItem('fuelpro_fresh_v5_nodummies')) {
  localStorage.clear();
  localStorage.setItem('fuelpro_fresh_v5_nodummies', 'true');
}

const DEFAULT_STATION_ID = DEFAULT_FUEL_STATION_ID;
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
  currency: 'PKR',
  setupCompleted: false,
  setupVersion: 1
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
  currency: 'PKR',
  setupCompleted: false,
  setupVersion: 1
};

const SEED_LUBE_STAFF: any = [];

const SEED_LUBE_PRODUCTS: any = [];

const SEED_LUBE_CUSTOMERS: any = [];

const SEED_LUBE_SUPPLIERS: any = [];

const SEED_LUBE_BANKS: any = [];

const SEED_LUBE_DIGITAL_ACCOUNTS: any = [];

const SEED_LUBE_PUMPS: any = [];

const SEED_LUBE_NOZZLES: any = [];

const SEED_LUBE_TANKS: any = [];

// ==========================================
// SEED DATA FOR BUSINESS 1: FUEL STATION FALLBACKS
// ==========================================
const SEED_FUEL_STAFF: any = [];

const SEED_FUEL_PRODUCTS: any = [];

const SEED_FUEL_PUMPS: any = [];

const SEED_FUEL_NOZZLES: any = [];

const SEED_FUEL_TANKS: any = [];

const SEED_FUEL_CUSTOMERS: any = [];

const SEED_FUEL_SUPPLIERS: any = [];

const SEED_FUEL_BANKS: any = [];

const SEED_FUEL_DIGITAL_ACCOUNTS: any = [];

// ==========================================
// SEED DATA FOR DEALER MARGINS
// ==========================================
const SEED_DEALER_MARGINS: DealerMarginSetting[] = [
  {
    id: 'dm_petrol_1',
    productType: 'petrol',
    marginPerLiter: 8.64,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    setBy: 'system',
    notes: 'OGRA fixed dealer margin - current rate',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dm_diesel_1',
    productType: 'diesel',
    marginPerLiter: 8.64,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    setBy: 'system',
    notes: 'OGRA fixed dealer margin - current rate',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dm_kerosene_1',
    productType: 'kerosene',
    marginPerLiter: 6.50,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    setBy: 'system',
    notes: 'OGRA fixed dealer margin - current rate',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dm_ldo_1',
    productType: 'ldo',
    marginPerLiter: 6.50,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    setBy: 'system',
    notes: 'OGRA fixed dealer margin - current rate',
    createdAt: new Date().toISOString(),
  }
];

// ==========================================
// DB ENGINE API WITH STRUCTURAL ISOLATION
// ==========================================

const STATION_DATA_BASE_KEYS = [
  ...Object.values(STORAGE_KEYS),
  ...Object.values(SPECIAL_STORAGE_KEYS)
];

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

type ScopedListKind = 'default' | 'products' | 'shifts' | 'lubePosSales';

function scopeStorageRecords<T extends TenantDocument>(
  stationId: string,
  records: T[],
  kind: ScopedListKind = 'default'
): T[] {
  if (kind === 'products') {
    return isolateProductRecords(records as unknown as Product[], stationId) as unknown as T[];
  }

  if (kind === 'shifts') {
    return isolateShiftRecords(records as unknown as Shift[], stationId) as unknown as T[];
  }

  if (kind === 'lubePosSales') {
    return isolateLubePosSales(records as unknown as LubePosSale[], stationId) as unknown as T[];
  }

  return isolateTenantRecords(records, stationId);
}

function getScopedStorageList<T extends TenantDocument>(
  stationId: string,
  baseKey: string,
  seed: T[],
  kind: ScopedListKind = 'default'
): T[] {
  const key = db.getStationStorageKey(stationId, baseKey);
  const scopedSeed = scopeStorageRecords(stationId, seed, kind);
  const stored = getStorageItem<T[]>(key, scopedSeed);
  const scopedStored = scopeStorageRecords(stationId, stored, kind);

  if (JSON.stringify(stored) !== JSON.stringify(scopedStored)) {
    setStorageItem(key, scopedStored);
  }

  return scopedStored;
}

function saveScopedStorageList<T extends TenantDocument>(
  stationId: string,
  baseKey: string,
  records: T[],
  kind: ScopedListKind = 'default'
): void {
  setStorageItem(
    db.getStationStorageKey(stationId, baseKey),
    scopeStorageRecords(stationId, records, kind)
  );
}

export const db = {
  getStationStorageKey: (stationId: string, baseKey: string): string => {
    return buildScopedStorageKey(stationId, baseKey);
  },

  getStationsList: (): Station[] => {
    try {
      const list = localStorage.getItem('fuelpro_stations');
      if (!list) {
        const defaultList = [
          withBusinessScope(SEED_FUEL_STATION, DEFAULT_STATION_ID),
          withBusinessScope(SEED_LUBE_STATION, LUBE_STATION_ID)
        ];
        localStorage.setItem('fuelpro_stations', JSON.stringify(defaultList));
        return defaultList;
      }
      const parsed = JSON.parse(list) as Station[];
      if (!parsed.some(s => s.id === DEFAULT_STATION_ID)) {
        parsed.unshift(SEED_FUEL_STATION);
      }
      if (!parsed.some(s => s.id === LUBE_STATION_ID)) {
        parsed.push(SEED_LUBE_STATION);
      }
      const scopedStations = parsed.map((station) => withBusinessScope(station, station.id));
      localStorage.setItem('fuelpro_stations', JSON.stringify(scopedStations));
      return scopedStations;
    } catch {
      return [
        withBusinessScope(SEED_FUEL_STATION, DEFAULT_STATION_ID),
        withBusinessScope(SEED_LUBE_STATION, LUBE_STATION_ID)
      ];
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
      const initialSettings = withBusinessScope(isLube ? SEED_LUBE_SETTINGS : SEED_FUEL_SETTINGS, stationId);
      localStorage.setItem(key, JSON.stringify(initialSettings));
      return initialSettings;
    }
    const scopedSettings = withBusinessScope(JSON.parse(item) as GlobalSettings, stationId);
    if (JSON.stringify(JSON.parse(item)) !== JSON.stringify(scopedSettings)) {
      localStorage.setItem(key, JSON.stringify(scopedSettings));
    }
    return scopedSettings;
  },
  
  saveSettings: (stationId: string, settings: GlobalSettings) => 
    localStorage.setItem(db.getStationStorageKey(stationId, STORAGE_KEYS.SETTINGS), JSON.stringify(withBusinessScope(settings, stationId))),

  getStaffList: (stationId: string): Staff[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_STAFF : SEED_FUEL_STAFF;
    return getScopedStorageList(stationId, STORAGE_KEYS.STAFF, seed);
  },
  saveStaffList: (stationId: string, staff: Staff[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.STAFF, staff),

  getProducts: (stationId: string): Product[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_PRODUCTS : SEED_FUEL_PRODUCTS;
    return getScopedStorageList(stationId, STORAGE_KEYS.PRODUCTS, seed, 'products');
  },
  saveProducts: (stationId: string, products: Product[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.PRODUCTS, products, 'products'),

  getPumps: (stationId: string): Pump[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_PUMPS : SEED_FUEL_PUMPS;
    return getScopedStorageList(stationId, STORAGE_KEYS.PUMPS, seed);
  },
  savePumps: (stationId: string, pumps: Pump[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.PUMPS, pumps),

  getNozzles: (stationId: string): Nozzle[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_NOZZLES : SEED_FUEL_NOZZLES;
    return getScopedStorageList(stationId, STORAGE_KEYS.NOZZLES, seed);
  },
  saveNozzles: (stationId: string, nozzles: Nozzle[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.NOZZLES, nozzles),

  getCustomers: (stationId: string): Customer[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_CUSTOMERS : SEED_FUEL_CUSTOMERS;
    return getScopedStorageList(stationId, STORAGE_KEYS.CUSTOMERS, seed);
  },
  saveCustomers: (stationId: string, customers: Customer[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.CUSTOMERS, customers),

  getSuppliers: (stationId: string): Supplier[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_SUPPLIERS : SEED_FUEL_SUPPLIERS;
    return getScopedStorageList(stationId, STORAGE_KEYS.SUPPLIERS, seed);
  },
  saveSuppliers: (stationId: string, suppliers: Supplier[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.SUPPLIERS, suppliers),

  getShifts: (stationId: string): Shift[] => 
    getScopedStorageList(stationId, STORAGE_KEYS.SHIFTS, [] as Shift[], 'shifts'),
  saveShifts: (stationId: string, shifts: Shift[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.SHIFTS, shifts, 'shifts'),

  getBankAccounts: (stationId: string): BankAccount[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_BANKS : SEED_FUEL_BANKS;
    return getScopedStorageList(stationId, STORAGE_KEYS.BANKS, seed);
  },
  saveBankAccounts: (stationId: string, banks: BankAccount[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.BANKS, banks),

  getDigitalAccounts: (stationId: string): DigitalAccount[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_DIGITAL_ACCOUNTS : SEED_FUEL_DIGITAL_ACCOUNTS;
    return getScopedStorageList(stationId, STORAGE_KEYS.DIGITAL_ACCOUNTS, seed);
  },
  saveDigitalAccounts: (stationId: string, digital: DigitalAccount[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.DIGITAL_ACCOUNTS, digital),

  getStockTransactions: (stationId: string): StockTransaction[] => 
    getScopedStorageList(stationId, STORAGE_KEYS.STOCK_TXNS, [] as StockTransaction[]),
  saveStockTransactions: (stationId: string, txns: StockTransaction[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.STOCK_TXNS, txns),

  getTanks: (stationId: string): Tank[] => {
    const seed = stationId === LUBE_STATION_ID ? SEED_LUBE_TANKS : SEED_FUEL_TANKS;
    return getScopedStorageList(stationId, STORAGE_KEYS.TANKS, seed);
  },
  saveTanks: (stationId: string, tanks: Tank[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.TANKS, tanks),

  getRateHistory: (stationId: string): RateHistoryEntry[] => 
    getScopedStorageList(stationId, STORAGE_KEYS.RATE_HISTORY, [] as RateHistoryEntry[]),
  saveRateHistory: (stationId: string, history: RateHistoryEntry[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.RATE_HISTORY, history),

  getStaffFinance: (stationId: string): StaffFinanceEntry[] => 
    getScopedStorageList(stationId, STORAGE_KEYS.STAFF_FINANCE, [] as StaffFinanceEntry[]),
  saveStaffFinance: (stationId: string, finances: StaffFinanceEntry[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.STAFF_FINANCE, finances),

  getAttendance: (stationId: string): AttendanceRecord[] => 
    getScopedStorageList(stationId, STORAGE_KEYS.ATTENDANCE, [] as AttendanceRecord[]),
  saveAttendance: (stationId: string, records: AttendanceRecord[]) => 
    saveScopedStorageList(stationId, STORAGE_KEYS.ATTENDANCE, records),

  getStandaloneExpenses: (stationId: string): ExpenseEntry[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.STANDALONE_EXPENSES, [] as ExpenseEntry[]),
  saveStandaloneExpenses: (stationId: string, expenses: ExpenseEntry[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.STANDALONE_EXPENSES, expenses),

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
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.SETTINGS_AUDIT_TRAIL, [] as AuditTrailEntry[]),
  saveSettingsAuditTrail: (stationId: string, entries: AuditTrailEntry[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.SETTINGS_AUDIT_TRAIL, entries),
  getLubePosSales: (stationId: string): LubePosSale[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.LUBE_POS_SALES, [] as LubePosSale[], 'lubePosSales'),
  saveLubePosSales: (stationId: string, sales: LubePosSale[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.LUBE_POS_SALES, sales, 'lubePosSales'),

  getFleetAccounts: (stationId: string): FleetAccount[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_ACCOUNTS, [] as FleetAccount[]),
  saveFleetAccounts: (stationId: string, accounts: FleetAccount[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_ACCOUNTS, accounts),

  getFleetVehicles: (stationId: string): FleetVehicle[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_VEHICLES, [] as FleetVehicle[]),
  saveFleetVehicles: (stationId: string, vehicles: FleetVehicle[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_VEHICLES, vehicles),

  getFleetDrivers: (stationId: string): Driver[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_DRIVERS, [] as Driver[]),
  saveFleetDrivers: (stationId: string, drivers: Driver[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_DRIVERS, drivers),

  getFleetTransactions: (stationId: string): FleetTransaction[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_TRANSACTIONS, [] as FleetTransaction[]),
  saveFleetTransactions: (stationId: string, txns: FleetTransaction[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.FLEET_TRANSACTIONS, txns),

  getTankerSchedules: (stationId: string): TankerSchedule[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.TANKER_SCHEDULES, [] as TankerSchedule[]),
  saveTankerSchedules: (stationId: string, schedules: TankerSchedule[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.TANKER_SCHEDULES, schedules),

  getTankerDeliveries: (stationId: string): TankerDelivery[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.TANKER_DELIVERIES, [] as TankerDelivery[]),
  saveTankerDeliveries: (stationId: string, deliveries: TankerDelivery[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.TANKER_DELIVERIES, deliveries),

  getVarianceIncidents: (stationId: string): VarianceIncident[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.VARIANCE_INCIDENTS, [] as VarianceIncident[]),
  saveVarianceIncidents: (stationId: string, incidents: VarianceIncident[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.VARIANCE_INCIDENTS, incidents),

  getAssets: (stationId: string): Asset[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.ASSETS, [] as Asset[]),
  saveAssets: (stationId: string, assets: Asset[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.ASSETS, assets),

  getMaintenanceRecords: (stationId: string): MaintenanceRecord[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.MAINTENANCE_RECORDS, [] as MaintenanceRecord[]),
  saveMaintenanceRecords: (stationId: string, records: MaintenanceRecord[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.MAINTENANCE_RECORDS, records),

  getLoyaltyMembers: (stationId: string): LoyaltyMember[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.LOYALTY_MEMBERS, [] as LoyaltyMember[]),
  saveLoyaltyMembers: (stationId: string, members: LoyaltyMember[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.LOYALTY_MEMBERS, members),

  getRewardTransactions: (stationId: string): RewardTransaction[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.REWARD_TRANSACTIONS, [] as RewardTransaction[]),
  saveRewardTransactions: (stationId: string, transactions: RewardTransaction[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.REWARD_TRANSACTIONS, transactions),

  getInventoryMovements: (stationId: string): InventoryMovement[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.INVENTORY_MOVEMENTS, [] as InventoryMovement[]),
  saveInventoryMovements: (stationId: string, movements: InventoryMovement[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.INVENTORY_MOVEMENTS, movements),

  getJournalEntries: (stationId: string): JournalEntry[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.JOURNAL_ENTRIES, [] as JournalEntry[]),
  saveJournalEntries: (stationId: string, entries: JournalEntry[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.JOURNAL_ENTRIES, entries),

  getStockBatches: (stationId: string): StockBatch[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.STOCK_BATCHES, [] as StockBatch[]),
  saveStockBatches: (stationId: string, batches: StockBatch[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.STOCK_BATCHES, batches),

  getCOGSRecords: (stationId: string): CogsRecord[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.COGS_RECORDS, [] as CogsRecord[]),
  saveCOGSRecords: (stationId: string, records: CogsRecord[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.COGS_RECORDS, records),

  getSalaryTransactions: (stationId: string): SalaryTransaction[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.SALARY_TRANSACTIONS, [] as SalaryTransaction[]),
  saveSalaryTransactions: (stationId: string, txns: SalaryTransaction[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.SALARY_TRANSACTIONS, txns),

  getStaffLoans: (stationId: string): StaffLoan[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.STAFF_LOANS, [] as StaffLoan[]),
  saveStaffLoans: (stationId: string, loans: StaffLoan[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.STAFF_LOANS, loans),

  getSalaryAdvances: (stationId: string): SalaryAdvance[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.SALARY_ADVANCES, [] as SalaryAdvance[]),
  saveSalaryAdvances: (stationId: string, advances: SalaryAdvance[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.SALARY_ADVANCES, advances),

  getInventorySnapshots: (stationId: string): InventorySnapshot[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.INVENTORY_SNAPSHOTS, [] as InventorySnapshot[]),
  saveInventorySnapshots: (stationId: string, snapshots: InventorySnapshot[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.INVENTORY_SNAPSHOTS, snapshots),

  getDealerMarginSettings: (stationId: string): DealerMarginSetting[] =>
    getStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.DEALER_MARGIN_SETTINGS),
      SEED_DEALER_MARGINS
    ),
  saveDealerMarginSettings: (stationId: string, settings: DealerMarginSetting[]) =>
    setStorageItem(
      db.getStationStorageKey(stationId, SPECIAL_STORAGE_KEYS.DEALER_MARGIN_SETTINGS),
      settings
    ),
    
  getCashAccounts: (stationId: string): CashAccount[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.CASH_ACCOUNTS, [] as CashAccount[]),
  saveCashAccounts: (stationId: string, accounts: CashAccount[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.CASH_ACCOUNTS, accounts),

  getTreasuryTransactions: (stationId: string): TreasuryTransaction[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.TREASURY_TRANSACTIONS, [] as TreasuryTransaction[]),
  saveTreasuryTransactions: (stationId: string, transactions: TreasuryTransaction[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.TREASURY_TRANSACTIONS, transactions),

  getOwnerDrawings: (stationId: string): OwnerDrawing[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.OWNER_DRAWINGS, [] as OwnerDrawing[]),
  saveOwnerDrawings: (stationId: string, drawings: OwnerDrawing[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.OWNER_DRAWINGS, drawings),

  getCashReconciliations: (stationId: string): CashReconciliation[] =>
    getScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.CASH_RECONCILIATIONS, [] as CashReconciliation[]),
  saveCashReconciliations: (stationId: string, reconciliations: CashReconciliation[]) =>
    saveScopedStorageList(stationId, SPECIAL_STORAGE_KEYS.CASH_RECONCILIATIONS, reconciliations),
    
  getCurrentDealerMargin: (stationId: string, productType: string, atDate: string = new Date().toISOString()): number => {
    const settings = db.getDealerMarginSettings(stationId);
    
    // Check for exact productType or name-based fallback matching
    const normalizedType = productType.toLowerCase();
    let typeToMatch = normalizedType;
    if (normalizedType.includes('petrol') || normalizedType.includes('pmg') || normalizedType.includes('hobc') || normalizedType.includes('altron')) {
       typeToMatch = 'petrol';
    } else if (normalizedType.includes('diesel') || normalizedType.includes('hsd')) {
       typeToMatch = 'diesel';
    } else if (normalizedType.includes('kerosene') || normalizedType.includes('sko')) {
       typeToMatch = 'kerosene';
    } else if (normalizedType.includes('ldo')) {
       typeToMatch = 'ldo';
    }

    const setting = settings
      .filter(s => s.productType === typeToMatch)
      .filter(s => s.effectiveFrom <= atDate)
      .filter(s => s.effectiveTo === null || s.effectiveTo >= atDate)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];

    return setting?.marginPerLiter ?? 8.64; // fallback to current OGRA rate
  },

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
