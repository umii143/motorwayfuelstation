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
  JournalEntry,
  StockBatch,
  CogsRecord,
  DealerMarginSetting,
  SalaryTransaction,
  StaffLoan,
  SalaryAdvance,
  MeterResetEvent
} from '../types';
import { db } from '../data/db';
import { useAuth } from './AuthContext';
import { firestoreDb } from '../data/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { dbFS } from '../lib/firebase';
import {
  getBusinessTypeForStation,
  isolateLubePosSales,
  isolateProductRecords,
  isolateShiftRecords,
  isolateTenantRecords
} from '../lib/businessScope';

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
  salaryTransactions: SalaryTransaction[];
  staffLoans: StaffLoan[];
  salaryAdvances: SalaryAdvance[];
  attendance: AttendanceRecord[];
  standaloneExpenses: ExpenseEntry[];
  lubePosSales: LubePosSale[];
  inventoryMovements: InventoryMovement[];
  meterResets: MeterResetEvent[];
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
  setSalaryTransactions: (txns: SalaryTransaction[]) => void;
  setStaffLoans: (loans: StaffLoan[]) => void;
  setSalaryAdvances: (advances: SalaryAdvance[]) => void;
  setAttendance: (attendance: AttendanceRecord[]) => void;
  setStandaloneExpenses: (standaloneExpenses: ExpenseEntry[]) => void;
  setLubePosSales: (lubePosSales: LubePosSale[]) => void;
  setInventoryMovements: (inventoryMovements: InventoryMovement[]) => void;
  setMeterResets: (meterResets: MeterResetEvent[]) => void;

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
  handleAddSalaryTransaction: (txn: SalaryTransaction) => Promise<void>;
  handleUpdateSalaryTransaction: (txn: SalaryTransaction) => Promise<void>;
  handleAddStaffLoan: (loan: StaffLoan) => Promise<void>;
  handleUpdateStaffLoan: (loan: StaffLoan) => Promise<void>;
  handleAddSalaryAdvance: (adv: SalaryAdvance) => Promise<void>;
  handleUpdateSalaryAdvance: (adv: SalaryAdvance) => Promise<void>;
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
  handleAddMeterReset: (reset: MeterResetEvent) => Promise<void>;
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
  const meterResets = useInventoryStore((state) => state.meterResets);

  const setProducts = (products: Product[]) => useInventoryStore.getState().setProducts(products, orgId);
  const setTanks = (tanks: Tank[]) => useInventoryStore.getState().setTanks(tanks, orgId);
  const setNozzles = (nozzles: Nozzle[]) => useInventoryStore.getState().setNozzles(nozzles, orgId);
  const setPumps = (pumps: Pump[]) => useInventoryStore.getState().setPumps(pumps, orgId);
  const setStockTxns = useInventoryStore((state) => state.setStockTxns);
  const setRateHistory = useInventoryStore((state) => state.setRateHistory);
  const setInventoryMovements = useInventoryStore((state) => state.setInventoryMovements);
  const setMeterResets = useInventoryStore((state) => state.setMeterResets);

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
  const handleAddMeterReset = (reset: MeterResetEvent) => useInventoryStore.getState().handleAddMeterReset(reset, orgId, activeStationId);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        firestoreDb.saveDocument(orgId, activeStationId, getBusinessTypeForStation(activeStationId), 'customers', cId, updatedC);
      }
    }
  });

  const staff = useStaffStore((state) => state.staff);
  const staffFinance = useStaffStore((state) => state.staffFinance);
  const salaryTransactions = useStaffStore((state) => state.salaryTransactions);
  const staffLoans = useStaffStore((state) => state.staffLoans);
  const salaryAdvances = useStaffStore((state) => state.salaryAdvances);
  const attendance = useStaffStore((state) => state.attendance);

  const setStaff = useStaffStore((state) => state.setStaff);
  const setStaffFinance = useStaffStore((state) => state.setStaffFinance);
  const setSalaryTransactions = useStaffStore((state) => state.setSalaryTransactions);
  const setStaffLoans = useStaffStore((state) => state.setStaffLoans);
  const setSalaryAdvances = useStaffStore((state) => state.setSalaryAdvances);
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
  const handleAddSalaryTransaction = (txn: SalaryTransaction) => useStaffStore.getState().handleAddSalaryTransaction(txn, orgId, activeStationId);
  const handleUpdateSalaryTransaction = (txn: SalaryTransaction) => useStaffStore.getState().handleUpdateSalaryTransaction(txn, orgId, activeStationId);
  const handleAddStaffLoan = (loan: StaffLoan) => useStaffStore.getState().handleAddStaffLoan(loan, orgId, activeStationId);
  const handleUpdateStaffLoan = (loan: StaffLoan) => useStaffStore.getState().handleUpdateStaffLoan(loan, orgId, activeStationId);
  const handleAddSalaryAdvance = (adv: SalaryAdvance) => useStaffStore.getState().handleAddSalaryAdvance(adv, orgId, activeStationId);
  const handleUpdateSalaryAdvance = (adv: SalaryAdvance) => useStaffStore.getState().handleUpdateSalaryAdvance(adv, orgId, activeStationId);
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
    const loadedSalaryTransactions = db.getSalaryTransactions(activeStationId);
    const loadedStaffLoans = db.getStaffLoans(activeStationId);
    const loadedSalaryAdvances = db.getSalaryAdvances(activeStationId);
    const loadedAttendance = db.getAttendance(activeStationId);
    const loadedStandalone = db.getStandaloneExpenses(activeStationId);
    const loadedLubePosSales = db.getLubePosSales(activeStationId);
    const loadedInventoryMovements = db.getInventoryMovements(activeStationId);
    const loadedJournalEntries = db.getJournalEntries(activeStationId);
    const loadedStockBatches = db.getStockBatches(activeStationId);
    const loadedCogsRecords = db.getCOGSRecords(activeStationId);
    const loadedDealerMarginSettings = db.getDealerMarginSettings(activeStationId);
    const loadedMeterResets = db.getMeterResets(activeStationId);

    useStationStore.setState({ settings: loadedSettings });
    useStaffStore.setState({ staff: isolateTenantRecords(loadedStaff, activeStationId) });
    useInventoryStore.setState({
      products: isolateProductRecords(loadedProducts, activeStationId),
      pumps: isolateTenantRecords(loadedPumps, activeStationId),
      nozzles: isolateTenantRecords(loadedNozzles, activeStationId),
      stockTxns: isolateTenantRecords(loadedStockTxns, activeStationId),
      tanks: isolateTenantRecords(loadedTanks, activeStationId),
      rateHistory: isolateTenantRecords(loadedRateHistory, activeStationId),
      inventoryMovements: isolateTenantRecords(loadedInventoryMovements, activeStationId),
      stockBatches: isolateTenantRecords(loadedStockBatches, activeStationId),
      cogsRecords: isolateTenantRecords(loadedCogsRecords, activeStationId),
      dealerMarginSettings: loadedDealerMarginSettings,
      meterResets: isolateTenantRecords(loadedMeterResets, activeStationId)
    });
    useCustomerStore.setState({ customers: isolateTenantRecords(loadedCustomers, activeStationId) });
    useSupplierStore.setState({ suppliers: isolateTenantRecords(loadedSuppliers, activeStationId) });
    useShiftStore.setState({ shifts: isolateShiftRecords(loadedShifts, activeStationId) });
    useFinancialStore.setState({
      banks: isolateTenantRecords(loadedBanks, activeStationId),
      digitalAccounts: isolateTenantRecords(loadedDigital, activeStationId),
      standaloneExpenses: isolateTenantRecords(loadedStandalone, activeStationId),
      lubePosSales: isolateLubePosSales(loadedLubePosSales, activeStationId),
      journalEntries: isolateTenantRecords(loadedJournalEntries, activeStationId)
    });
    useStaffStore.setState({
      staffFinance: isolateTenantRecords(loadedStaffFinance, activeStationId),
      salaryTransactions: isolateTenantRecords(loadedSalaryTransactions, activeStationId),
      staffLoans: isolateTenantRecords(loadedStaffLoans, activeStationId),
      salaryAdvances: isolateTenantRecords(loadedSalaryAdvances, activeStationId),
      attendance: isolateTenantRecords(loadedAttendance, activeStationId)
    });
  }, [activeStationId, orgId]);

  // Firestore subscribers for SaaS tenancy
  useEffect(() => {
    if (!orgId) return;

    const unsubscribes = [
      firestoreDb.subscribeToCollection<Staff>(orgId, activeStationId, 'staff', (items) => {
        useStaffStore.setState({ staff: isolateTenantRecords(items, activeStationId, orgId) });
      }),
      firestoreDb.subscribeToCollection<Product>(orgId, activeStationId, 'products', (items) => useInventoryStore.setState({ products: isolateProductRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<Pump>(orgId, activeStationId, 'pumps', (items) => useInventoryStore.setState({ pumps: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<Nozzle>(orgId, activeStationId, 'nozzles', (items) => useInventoryStore.setState({ nozzles: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<Customer>(orgId, activeStationId, 'customers', (items) => {
        useCustomerStore.setState({ customers: isolateTenantRecords(items, activeStationId, orgId) });
      }),
      firestoreDb.subscribeToCollection<Supplier>(orgId, activeStationId, 'suppliers', (items) => {
        useSupplierStore.setState({ suppliers: isolateTenantRecords(items, activeStationId, orgId) });
      }),
      firestoreDb.subscribeToCollection<Shift>(orgId, activeStationId, 'shifts', (items) => useShiftStore.setState({ shifts: isolateShiftRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<BankAccount>(orgId, activeStationId, 'banks', (items) => useFinancialStore.setState({ banks: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<DigitalAccount>(orgId, activeStationId, 'digitalAccounts', (items) => useFinancialStore.setState({ digitalAccounts: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<StockTransaction>(orgId, activeStationId, 'stockTxns', (items) => useInventoryStore.setState({ stockTxns: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<Tank>(orgId, activeStationId, 'tanks', (items) => useInventoryStore.setState({ tanks: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<RateHistoryEntry>(orgId, activeStationId, 'rateHistory', (items) => useInventoryStore.setState({ rateHistory: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<StaffFinanceEntry>(orgId, activeStationId, 'staffFinance', (items) => useStaffStore.setState({ staffFinance: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<SalaryTransaction>(orgId, activeStationId, 'salaryTransactions', (items) => useStaffStore.setState({ salaryTransactions: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<StaffLoan>(orgId, activeStationId, 'staffLoans', (items) => useStaffStore.setState({ staffLoans: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<SalaryAdvance>(orgId, activeStationId, 'salaryAdvances', (items) => useStaffStore.setState({ salaryAdvances: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<AttendanceRecord>(orgId, activeStationId, 'attendance', (items) => useStaffStore.setState({ attendance: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<ExpenseEntry>(orgId, activeStationId, 'standaloneExpenses', (items) => useFinancialStore.setState({ standaloneExpenses: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<LubePosSale>(orgId, activeStationId, 'lubePosSales', (items) => useFinancialStore.setState({ lubePosSales: isolateLubePosSales(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<InventoryMovement>(orgId, activeStationId, 'inventoryMovements', (items) => useInventoryStore.setState({ inventoryMovements: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<JournalEntry>(orgId, activeStationId, 'journalEntries', (items) => useFinancialStore.setState({ journalEntries: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<StockBatch>(orgId, activeStationId, 'stockBatches', (items) => useInventoryStore.setState({ stockBatches: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<CogsRecord>(orgId, activeStationId, 'cogsRecords', (items) => useInventoryStore.setState({ cogsRecords: isolateTenantRecords(items, activeStationId, orgId) })),
      firestoreDb.subscribeToCollection<DealerMarginSetting>(orgId, activeStationId, 'dealerMarginSettings', (items) => useInventoryStore.setState({ dealerMarginSettings: items })),
      firestoreDb.subscribeToCollection<MeterResetEvent>(orgId, activeStationId, 'meter_resets', (items) => useInventoryStore.setState({ meterResets: isolateTenantRecords(items, activeStationId, orgId) }))
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
    salaryTransactions,
    staffLoans,
    salaryAdvances,
    attendance,
    standaloneExpenses,
    lubePosSales,
    inventoryMovements,
    journalEntries,
    meterResets,
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
    setSalaryTransactions,
    setStaffLoans,
    setSalaryAdvances,
    setAttendance,
    setStandaloneExpenses,
    setLubePosSales,
    setInventoryMovements,
    setMeterResets,
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
    handleAddSalaryTransaction,
    handleUpdateSalaryTransaction,
    handleAddStaffLoan,
    handleUpdateStaffLoan,
    handleAddSalaryAdvance,
    handleUpdateSalaryAdvance,
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
    handleDeleteSupplierPayment,
    handleAddMeterReset
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
