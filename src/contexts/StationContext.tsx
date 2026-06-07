import React, { createContext, useContext, useEffect, ReactNode } from 'react';
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
  LubePosSale,
  InventoryMovement,
  JournalEntry
} from '../types';
import { db } from '../data/db';
import { useAuth } from './AuthContext';
import { firestoreDb } from '../data/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { dbFS } from '../lib/firebase';

import { useStationStore } from '../stores/useStationStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useShiftStore } from '../stores/useShiftStore';
import { useFinancialStore } from '../stores/useFinancialStore';
import { useStaffStore } from '../stores/useStaffStore';

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

export interface StationContextType {
  activeStationId: string;
  stations: Station[];
  settings: GlobalSettings;
  staff: Staff[];
  products: Product[];
  pumps: Pump[];
  nozzles: Nozzle[];
  customers: Customer[];
  suppliers: Supplier[];
  shifts: Shift[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  stockTxns: StockTransaction[];
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
  staffFinance: StaffFinanceEntry[];
  attendance: AttendanceRecord[];
  standaloneExpenses: ExpenseEntry[];
  lubePosSales: LubePosSale[];
  inventoryMovements: InventoryMovement[];
  journalEntries?: JournalEntry[];
  toast: ToastConfig;
  confirmDialog: ConfirmConfig;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, isAlert?: boolean, confirmText?: string, cancelText?: string) => void;
  showAlert: (title: string, message: string, onConfirm?: () => void) => void;
  closeConfirm: () => void;

  setStations: (stations: Station[]) => void;
  setSettings: (settings: GlobalSettings) => void;
  setStaff: (staff: Staff[]) => void;
  setProducts: (products: Product[]) => void;
  setPumps: (pumps: Pump[]) => void;
  setNozzles: (nozzles: Nozzle[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  setShifts: (shifts: Shift[]) => void;
  setBanks: (banks: BankAccount[]) => void;
  setDigitalAccounts: (digitalAccounts: DigitalAccount[]) => void;
  setStockTxns: (stockTxns: StockTransaction[]) => void;
  setTanks: (tanks: Tank[]) => void;
  setRateHistory: (rateHistory: RateHistoryEntry[]) => void;
  setStaffFinance: (staffFinance: StaffFinanceEntry[]) => void;
  setAttendance: (attendance: AttendanceRecord[]) => void;
  setStandaloneExpenses: (standaloneExpenses: ExpenseEntry[]) => void;
  setLubePosSales: (lubePosSales: LubePosSale[]) => void;
  setInventoryMovements: (inventoryMovements: InventoryMovement[]) => void;

  handleAddStation: (station: Station) => void;
  handleEditStation: (updatedStation: Station) => void;
  handleDeleteStation: (stationId: string) => void;
  handleSwitchStation: (stationId: string) => void;
  handleUpdateSettings: (newSettings: GlobalSettings) => void;
  handleAddStaff: (newStaff: Staff) => void;
  handleUpdateStaff: (updatedMember: Staff) => void;
  handleAddCustomer: (newCustomer: Customer) => void;
  handleUpdateCustomer: (updatedCustomer: Customer) => void;
  handleDeleteCustomer: (customerId: string) => void;
  handleAddSupplier: (newSupplier: Supplier) => void;
  handleUpdateSupplier: (updatedSupplier: Supplier) => void;
  handleDeleteSupplier: (supplierId: string) => void;
  handleAddShift: (newShift: Shift) => void;
  handleUpdateShift: (updatedShift: Shift) => void;
  handleAddStockReceipt: (txn: StockTransaction) => void;
  handleUpdateProductStock: (productId: string, newStock: number) => void;
  handleUpdateProductRate: (productId: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string) => void;
  handleDeleteRateHistory: (id: string) => void;
  handleUpdateProduct: (updatedProduct: Product) => void;
  handleDeleteProduct: (productId: string) => void;
  handleAddProduct: (newProduct: Product) => void;
  handleAddTank: (newTank: Tank) => void;
  handleUpdateTank: (updatedTank: Tank) => void;
  handleDeleteTank: (id: string) => void;
  handleAddNozzle: (newNozzle: Nozzle) => void;
  handleUpdateNozzle: (updatedNozzle: Nozzle) => void;
  handleDeleteNozzle: (id: string) => void;
  handleAddStaffFinance: (newEntry: StaffFinanceEntry) => void;
  handleAddShiftSalaryPayment: (staffId: string, amount: number, note: string, paidFrom: 'cash' | 'bank', date: string, expenseId: string) => void;
  handleDeleteShiftSalaryPayment: (expenseId: string) => void;
  handleAddAttendance: (records: AttendanceRecord[]) => void;
  handleAddStandaloneExpense: (expense: ExpenseEntry) => void;
  handleAddLubePosSale: (sale: LubePosSale) => void;
  handleAddBank: (bank: BankAccount) => void;
  handleUpdateBanks: (updatedBanks: BankAccount[]) => void;
  handleAddDigitalAccount: (acc: DigitalAccount) => void;
  handleUpdateDigitalAccounts: (updatedAccs: DigitalAccount[]) => void;
  handleDeleteDebitEntry: (shiftId: string, entryId: string) => void;
  handleDeleteRecoveryEntry: (shiftId: string, entryId: string) => void;
  handleDeleteSupplierPayment: (shiftId: string, entryId: string) => void;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, hasPermission } = useAuth();
  const orgId = user?.orgId;

  const checkPerm = (permission: string, actionNameEn: string, actionNameUr: string) => {
    if (!hasPermission(permission)) {
      const msg = settings.language === 'ur'
        ? `آپ کو ${actionNameUr} کی اجازت نہیں ہے۔`
        : `Unauthorized. You do not have permission to ${actionNameEn}.`;
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  // Bind Context to Zustand Stores
  const activeStationId = useStationStore((state) => state.activeStationId);
  const stations = useStationStore((state) => state.stations);
  const settings = useStationStore((state) => state.settings);
  const toast = useStationStore((state) => state.toast);
  const confirmDialog = useStationStore((state) => state.confirmDialog);

  const showToast = useStationStore((state) => state.showToast);
  const showConfirm = useStationStore((state) => state.showConfirm);
  const showAlert = useStationStore((state) => state.showAlert);
  const closeConfirm = useStationStore((state) => state.closeConfirm);

  const setStations = useStationStore((state) => state.setStations);
  const setSettings = useStationStore((state) => state.setSettings);
  const handleAddStation = useStationStore((state) => state.handleAddStation);
  const handleEditStation = useStationStore((state) => state.handleEditStation);
  const handleDeleteStation = (id: string) => useStationStore.getState().handleDeleteStation(id);
  const handleSwitchStation = useStationStore((state) => state.handleSwitchStation);

  const customers = useCustomerStore((state) => state.customers);
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const handleAddCustomer = (c: Customer) => useCustomerStore.getState().handleAddCustomer(c, orgId, activeStationId, settings.language, showToast);
  const handleUpdateCustomer = (c: Customer) => useCustomerStore.getState().handleUpdateCustomer(c, orgId, activeStationId, settings.language, showToast);
  const handleDeleteCustomer = (id: string) => useCustomerStore.getState().handleDeleteCustomer(id, orgId, activeStationId, settings.language, showToast);

  const suppliers = useSupplierStore((state) => state.suppliers);
  const setSuppliers = useSupplierStore((state) => state.setSuppliers);
  const handleAddSupplier = (s: Supplier) => useSupplierStore.getState().handleAddSupplier(s, orgId, activeStationId, settings.language, showToast);
  const handleUpdateSupplier = (s: Supplier) => useSupplierStore.getState().handleUpdateSupplier(s, orgId, activeStationId, settings.language, showToast);
  const handleDeleteSupplier = (id: string) => useSupplierStore.getState().handleDeleteSupplier(id, orgId, activeStationId, settings.language, showToast);

  const products = useInventoryStore((state) => state.products);
  const tanks = useInventoryStore((state) => state.tanks);
  const nozzles = useInventoryStore((state) => state.nozzles);
  const pumps = useInventoryStore((state) => state.pumps);
  const stockTxns = useInventoryStore((state) => state.stockTxns);
  const rateHistory = useInventoryStore((state) => state.rateHistory);
  const inventoryMovements = useInventoryStore((state) => state.inventoryMovements);

  const setProducts = useInventoryStore((state) => state.setProducts);
  const setTanks = useInventoryStore((state) => state.setTanks);
  const setNozzles = useInventoryStore((state) => state.setNozzles);
  const setPumps = useInventoryStore((state) => state.setPumps);
  const setStockTxns = useInventoryStore((state) => state.setStockTxns);
  const setRateHistory = useInventoryStore((state) => state.setRateHistory);
  const setInventoryMovements = useInventoryStore((state) => state.setInventoryMovements);

  const handleUpdateProductStock = (id: string, qty: number) => useInventoryStore.getState().handleUpdateProductStock(id, qty, orgId, activeStationId, checkPerm);
  const handleUpdateProductRate = (id: string, rate: number, reason?: string, by?: string, dStr?: string) => useInventoryStore.getState().handleUpdateProductRate(id, rate, reason, by, dStr, orgId, activeStationId, checkPerm);
  const handleDeleteRateHistory = (id: string) => useInventoryStore.getState().handleDeleteRateHistory(id, orgId, activeStationId, checkPerm);
  const handleUpdateProduct = (p: Product) => useInventoryStore.getState().handleUpdateProduct(p, orgId, activeStationId);
  const handleDeleteProduct = (id: string) => useInventoryStore.getState().handleDeleteProduct(id, orgId, activeStationId);
  const handleAddProduct = (p: Product) => useInventoryStore.getState().handleAddProduct(p, orgId, activeStationId);
  const handleAddTank = (t: Tank) => useInventoryStore.getState().handleAddTank(t, orgId, activeStationId, checkPerm);
  const handleUpdateTank = (t: Tank) => useInventoryStore.getState().handleUpdateTank(t, orgId, activeStationId, checkPerm);
  const handleDeleteTank = (id: string) => useInventoryStore.getState().handleDeleteTank(id, orgId, activeStationId, checkPerm);
  const handleAddNozzle = (n: Nozzle) => useInventoryStore.getState().handleAddNozzle(n, orgId, activeStationId);
  const handleUpdateNozzle = (n: Nozzle) => useInventoryStore.getState().handleUpdateNozzle(n, orgId, activeStationId);
  const handleDeleteNozzle = (id: string) => useInventoryStore.getState().handleDeleteNozzle(id, orgId, activeStationId);
  const handleAddStockReceipt = (tx: StockTransaction) => useInventoryStore.getState().handleAddStockReceipt(tx, orgId, activeStationId, checkPerm);

  const shifts = useShiftStore((state) => state.shifts);
  const setShifts = useShiftStore((state) => state.setShifts);
  const handleAddShift = (sh: Shift) => useShiftStore.getState().handleAddShift(sh, orgId, activeStationId);
  const handleUpdateShift = (sh: Shift) => useShiftStore.getState().handleUpdateShift(sh, orgId, activeStationId, checkPerm);
  const handleDeleteDebitEntry = (sId: string, eId: string) => useShiftStore.getState().handleDeleteDebitEntry(sId, eId, orgId, activeStationId);
  const handleDeleteRecoveryEntry = (sId: string, eId: string) => useShiftStore.getState().handleDeleteRecoveryEntry(sId, eId, orgId, activeStationId);
  const handleDeleteSupplierPayment = (sId: string, eId: string) => useShiftStore.getState().handleDeleteSupplierPayment(sId, eId, orgId, activeStationId);

  const banks = useFinancialStore((state) => state.banks);
  const digitalAccounts = useFinancialStore((state) => state.digitalAccounts);
  const standaloneExpenses = useFinancialStore((state) => state.standaloneExpenses);
  const lubePosSales = useFinancialStore((state) => state.lubePosSales);
  const journalEntries = useFinancialStore((state) => state.journalEntries);

  const setBanks = useFinancialStore((state) => state.setBanks);
  const setDigitalAccounts = useFinancialStore((state) => state.setDigitalAccounts);
  const setStandaloneExpenses = useFinancialStore((state) => state.setStandaloneExpenses);
  const setLubePosSales = useFinancialStore((state) => state.setLubePosSales);
  const setJournalEntries = useFinancialStore((state) => state.setJournalEntries);

  const handleAddBank = (b: BankAccount) => useFinancialStore.getState().handleAddBank(b, orgId, activeStationId);
  const handleUpdateBanks = (bList: BankAccount[]) => useFinancialStore.getState().handleUpdateBanks(bList, orgId, activeStationId);
  const handleAddDigitalAccount = (da: DigitalAccount) => useFinancialStore.getState().handleAddDigitalAccount(da, orgId, activeStationId);
  const handleUpdateDigitalAccounts = (daList: DigitalAccount[]) => useFinancialStore.getState().handleUpdateDigitalAccounts(daList, orgId, activeStationId);
  const handleAddStandaloneExpense = (exp: ExpenseEntry) => useFinancialStore.getState().handleAddStandaloneExpense(exp, orgId, activeStationId);
  const handleAddLubePosSale = (sale: LubePosSale) => useFinancialStore.getState().handleAddLubePosSale(sale, orgId, activeStationId, (cId, diff) => {
    const custs = useCustomerStore.getState().customers;
    const nextCusts = custs.map(c => c.id === cId ? { ...c, balance: Math.round((c.balance + diff) * 100) / 100 } : c);
    useCustomerStore.getState().setCustomers(nextCusts);
    if (orgId) {
      const updatedC = nextCusts.find(c => c.id === cId);
      if (updatedC) {
        firestoreDb.saveDocument(orgId, activeStationId, activeStationId === 'st_lube' ? 'lube' : 'fuel_station', 'customers', cId, updatedC);
      }
    }
  });

  const staff = useStaffStore((state) => state.staff);
  const staffFinance = useStaffStore((state) => state.staffFinance);
  const attendance = useStaffStore((state) => state.attendance);

  const setStaff = useStaffStore((state) => state.setStaff);
  const setStaffFinance = useStaffStore((state) => state.setStaffFinance);
  const setAttendance = useStaffStore((state) => state.setAttendance);

  const handleAddStaff = (st: Staff) => useStaffStore.getState().handleAddStaff(st, orgId, activeStationId);
  const handleUpdateStaff = (st: Staff) => useStaffStore.getState().handleUpdateStaff(st, orgId, activeStationId);
  const handleAddStaffFinance = (e: StaffFinanceEntry) => useStaffStore.getState().handleAddStaffFinance(
    e,
    orgId,
    activeStationId,
    settings,
    handleAddStandaloneExpense,
    handleUpdateBanks,
    banks
  );
  const handleAddShiftSalaryPayment = (sId: string, amt: number, note: string, paidFrom: 'cash' | 'bank', date: string, expId: string) =>
    useStaffStore.getState().handleAddShiftSalaryPayment(sId, amt, note, paidFrom, date, expId, orgId, activeStationId);
  const handleDeleteShiftSalaryPayment = (expId: string) =>
    useStaffStore.getState().handleDeleteShiftSalaryPayment(expId, orgId, activeStationId);
  const handleAddAttendance = (recs: AttendanceRecord[]) => useStaffStore.getState().handleAddAttendance(recs, orgId, activeStationId);

  const handleUpdateSettings = (newSettings: GlobalSettings) => useStationStore.getState().handleUpdateSettings(newSettings, orgId);

  // Sync state between database and Zustand when active station or tenant changes
  useEffect(() => {
    if (orgId) return;

    const loadedSettings = db.getSettings(activeStationId);
    const loadedStaff = db.getStaffList(activeStationId);
    const loadedProducts = db.getProducts(activeStationId);
    const loadedPumps = db.getPumps(activeStationId);
    const loadedNozzles = db.getNozzles(activeStationId);
    const loadedCustomers = db.getCustomers(activeStationId);
    const loadedSuppliers = db.getSuppliers(activeStationId);
    const loadedShifts = db.getShifts(activeStationId);
    const loadedBanks = db.getBankAccounts(activeStationId);
    const loadedDigital = db.getDigitalAccounts(activeStationId);
    const loadedStockTxns = db.getStockTransactions(activeStationId);
    const loadedTanks = db.getTanks(activeStationId);
    const loadedRateHistory = db.getRateHistory(activeStationId);
    const loadedStaffFinance = db.getStaffFinance(activeStationId);
    const loadedAttendance = db.getAttendance(activeStationId);
    const loadedStandalone = db.getStandaloneExpenses(activeStationId);
    const loadedLubePosSales = db.getLubePosSales(activeStationId);
    const loadedInventoryMovements = db.getInventoryMovements(activeStationId);
    const loadedJournalEntries = db.getJournalEntries(activeStationId);

    const activeBType = activeStationId === 'st_lube' ? 'lube' : 'fuel_station';

    useStationStore.setState({ settings: loadedSettings });
    useStaffStore.setState({ staff: loadedStaff.filter(item => !item.businessType || item.businessType === activeBType) });
    useInventoryStore.setState({
      products: loadedProducts,
      pumps: loadedPumps,
      nozzles: loadedNozzles,
      stockTxns: loadedStockTxns,
      tanks: loadedTanks,
      rateHistory: loadedRateHistory,
      inventoryMovements: loadedInventoryMovements
    });
    useCustomerStore.setState({ customers: loadedCustomers.filter(item => !item.businessType || item.businessType === activeBType) });
    useSupplierStore.setState({ suppliers: loadedSuppliers.filter(item => !item.businessType || item.businessType === activeBType) });
    useShiftStore.setState({ shifts: loadedShifts });
    useFinancialStore.setState({
      banks: loadedBanks,
      digitalAccounts: loadedDigital,
      standaloneExpenses: loadedStandalone,
      lubePosSales: loadedLubePosSales,
      journalEntries: loadedJournalEntries
    });
    useStaffStore.setState({ staffFinance: loadedStaffFinance, attendance: loadedAttendance });
  }, [activeStationId, orgId]);

  // Firestore subscribers for SaaS tenancy
  useEffect(() => {
    if (!orgId) return;

    const activeBType = activeStationId === 'st_lube' ? 'lube' : 'fuel_station';
    const unsubscribes = [
      firestoreDb.subscribeToCollection<Staff>(orgId, activeStationId, 'staff', (items) => {
        useStaffStore.setState({ staff: items.filter(item => !item.businessType || item.businessType === activeBType) });
      }),
      firestoreDb.subscribeToCollection<Product>(orgId, activeStationId, 'products', (items) => useInventoryStore.setState({ products: items })),
      firestoreDb.subscribeToCollection<Pump>(orgId, activeStationId, 'pumps', (items) => useInventoryStore.setState({ pumps: items })),
      firestoreDb.subscribeToCollection<Nozzle>(orgId, activeStationId, 'nozzles', (items) => useInventoryStore.setState({ nozzles: items })),
      firestoreDb.subscribeToCollection<Customer>(orgId, activeStationId, 'customers', (items) => {
        useCustomerStore.setState({ customers: items.filter(item => !item.businessType || item.businessType === activeBType) });
      }),
      firestoreDb.subscribeToCollection<Supplier>(orgId, activeStationId, 'suppliers', (items) => {
        useSupplierStore.setState({ suppliers: items.filter(item => !item.businessType || item.businessType === activeBType) });
      }),
      firestoreDb.subscribeToCollection<Shift>(orgId, activeStationId, 'shifts', (items) => useShiftStore.setState({ shifts: items })),
      firestoreDb.subscribeToCollection<BankAccount>(orgId, activeStationId, 'banks', (items) => useFinancialStore.setState({ banks: items })),
      firestoreDb.subscribeToCollection<DigitalAccount>(orgId, activeStationId, 'digitalAccounts', (items) => useFinancialStore.setState({ digitalAccounts: items })),
      firestoreDb.subscribeToCollection<StockTransaction>(orgId, activeStationId, 'stockTxns', (items) => useInventoryStore.setState({ stockTxns: items })),
      firestoreDb.subscribeToCollection<Tank>(orgId, activeStationId, 'tanks', (items) => useInventoryStore.setState({ tanks: items })),
      firestoreDb.subscribeToCollection<RateHistoryEntry>(orgId, activeStationId, 'rateHistory', (items) => useInventoryStore.setState({ rateHistory: items })),
      firestoreDb.subscribeToCollection<StaffFinanceEntry>(orgId, activeStationId, 'staffFinance', (items) => useStaffStore.setState({ staffFinance: items })),
      firestoreDb.subscribeToCollection<AttendanceRecord>(orgId, activeStationId, 'attendance', (items) => useStaffStore.setState({ attendance: items })),
      firestoreDb.subscribeToCollection<ExpenseEntry>(orgId, activeStationId, 'standaloneExpenses', (items) => useFinancialStore.setState({ standaloneExpenses: items })),
      firestoreDb.subscribeToCollection<LubePosSale>(orgId, activeStationId, 'lubePosSales', (items) => useFinancialStore.setState({ lubePosSales: items })),
      firestoreDb.subscribeToCollection<InventoryMovement>(orgId, activeStationId, 'inventoryMovements', (items) => useInventoryStore.setState({ inventoryMovements: items })),
      firestoreDb.subscribeToCollection<JournalEntry>(orgId, activeStationId, 'journalEntries', (items) => useFinancialStore.setState({ journalEntries: items }))
    ];

    const loadSettingsFS = async () => {
      const docRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        useStationStore.setState({ settings: docSnap.data() as GlobalSettings });
      }
    };
    loadSettingsFS();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [orgId, activeStationId]);

  const value: StationContextType = {
    activeStationId,
    stations,
    settings,
    staff,
    products,
    pumps,
    nozzles,
    customers,
    suppliers,
    shifts,
    banks,
    digitalAccounts,
    stockTxns,
    tanks,
    rateHistory,
    staffFinance,
    attendance,
    standaloneExpenses,
    lubePosSales,
    inventoryMovements,
    journalEntries,
    toast,
    confirmDialog,
    showToast,
    showConfirm,
    showAlert,
    closeConfirm,
    setStations,
    setSettings,
    setStaff,
    setProducts,
    setPumps,
    setNozzles,
    setCustomers,
    setSuppliers,
    setShifts,
    setBanks,
    setDigitalAccounts,
    setStockTxns,
    setTanks,
    setRateHistory,
    setStaffFinance,
    setAttendance,
    setStandaloneExpenses,
    setLubePosSales,
    setInventoryMovements,
    handleAddStation,
    handleEditStation,
    handleDeleteStation,
    handleSwitchStation,
    handleUpdateSettings,
    handleAddStaff,
    handleUpdateStaff,
    handleAddCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    handleAddSupplier,
    handleUpdateSupplier,
    handleDeleteSupplier,
    handleAddShift,
    handleUpdateShift,
    handleAddStockReceipt,
    handleUpdateProductStock,
    handleUpdateProductRate,
    handleDeleteRateHistory,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddProduct,
    handleAddTank,
    handleUpdateTank,
    handleDeleteTank,
    handleAddNozzle,
    handleUpdateNozzle,
    handleDeleteNozzle,
    handleAddStaffFinance,
    handleAddShiftSalaryPayment,
    handleDeleteShiftSalaryPayment,
    handleAddAttendance,
    handleAddStandaloneExpense,
    handleAddLubePosSale,
    handleAddBank,
    handleUpdateBanks,
    handleAddDigitalAccount,
    handleUpdateDigitalAccounts,
    handleDeleteDebitEntry,
    handleDeleteRecoveryEntry,
    handleDeleteSupplierPayment
  };

  return (
    <StationContext.Provider value={value}>
      {children}
    </StationContext.Provider>
  );
};

export const useStation = () => {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
};
