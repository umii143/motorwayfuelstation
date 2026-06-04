import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  InventoryMovement
} from '../types';
import { db } from '../data/db';
import { useAuth } from './AuthContext';
import { firestoreDb } from '../data/firestore';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { dbFS } from '../lib/firebase';

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
  toast: ToastConfig;
  confirmDialog: ConfirmConfig;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, isAlert?: boolean, confirmText?: string, cancelText?: string) => void;
  showAlert: (title: string, message: string, onConfirm?: () => void) => void;
  closeConfirm: () => void;

  setStations: React.Dispatch<React.SetStateAction<Station[]>>;
  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setPumps: React.Dispatch<React.SetStateAction<Pump[]>>;
  setNozzles: React.Dispatch<React.SetStateAction<Nozzle[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setBanks: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  setDigitalAccounts: React.Dispatch<React.SetStateAction<DigitalAccount[]>>;
  setStockTxns: React.Dispatch<React.SetStateAction<StockTransaction[]>>;
  setTanks: React.Dispatch<React.SetStateAction<Tank[]>>;
  setRateHistory: React.Dispatch<React.SetStateAction<RateHistoryEntry[]>>;
  setStaffFinance: React.Dispatch<React.SetStateAction<StaffFinanceEntry[]>>;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  setStandaloneExpenses: React.Dispatch<React.SetStateAction<ExpenseEntry[]>>;
  setLubePosSales: React.Dispatch<React.SetStateAction<LubePosSale[]>>;

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

  // ==========================================
  // MULTI-STATION (MULTI-BRANCH) ARCHITECTURE
  // ==========================================
  const [activeStationId, setActiveStationId] = useState<string>(() => db.getActiveStationId());
  const [stations, setStations] = useState<Station[]>(() => db.getStationsList());

  const [toast, setToast] = useState<ToastConfig>({ message: '', type: 'success', visible: false });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmConfig>({
    title: '',
    message: '',
    visible: false,
    onConfirm: () => {},
    onCancel: () => {}
  });

  const toastTimeoutRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, visible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isAlert = false,
    confirmText?: string,
    cancelText?: string
  ) => {
    setConfirmDialog({
      title,
      message,
      visible: true,
      isAlert,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
      },
      onCancel: () => {
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setConfirmDialog({
      title,
      message,
      visible: true,
      isAlert: true,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
      },
      onCancel: () => {
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, visible: false }));
  };

  // Block saves during context-switching transitions
  const currentStationIdRef = useRef(activeStationId);

  // Load state parameters directly from LocalStorage Database (seeded with respective active station ID)
  const [settings, setSettings] = useState<GlobalSettings>(() => db.getSettings(db.getActiveStationId()));
  const [staff, setStaff] = useState<Staff[]>(() => db.getStaffList(db.getActiveStationId()));
  const [products, setProducts] = useState<Product[]>(() => db.getProducts(db.getActiveStationId()));
  const [pumps, setPumps] = useState<Pump[]>(() => db.getPumps(db.getActiveStationId()));
  const [nozzles, setNozzles] = useState<Nozzle[]>(() => db.getNozzles(db.getActiveStationId()));
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers(db.getActiveStationId()));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers(db.getActiveStationId()));
  const [shifts, setShifts] = useState<Shift[]>(() => db.getShifts(db.getActiveStationId()));
  const [banks, setBanks] = useState<BankAccount[]>(() => db.getBankAccounts(db.getActiveStationId()));
  const [digitalAccounts, setDigitalAccounts] = useState<DigitalAccount[]>(() => db.getDigitalAccounts(db.getActiveStationId()));
  const [stockTxns, setStockTxns] = useState<StockTransaction[]>(() => db.getStockTransactions(db.getActiveStationId()));
  const [tanks, setTanks] = useState<Tank[]>(() => db.getTanks(db.getActiveStationId()));
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>(() => db.getRateHistory(db.getActiveStationId()));
  const [staffFinance, setStaffFinance] = useState<StaffFinanceEntry[]>(() => db.getStaffFinance(db.getActiveStationId()));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => db.getAttendance(db.getActiveStationId()));

  // Standalone expenses that are direct station outflows outside of shifts
  const [standaloneExpenses, setStandaloneExpenses] = useState<ExpenseEntry[]>(() =>
    db.getStandaloneExpenses(db.getActiveStationId())
  );
  const [lubePosSales, setLubePosSales] = useState<LubePosSale[]>(() =>
    db.getLubePosSales(db.getActiveStationId())
  );

  // Re-load all states dynamically and atomically when activeStationId changes (LocalStorage Fallback)
  useEffect(() => {
    if (orgId) return; // Skip local storage load if using Firestore SaaS
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

    // Apply state changes
    setSettings(loadedSettings);
    setStaff(loadedStaff);
    setProducts(loadedProducts);
    setPumps(loadedPumps);
    setNozzles(loadedNozzles);
    setCustomers(loadedCustomers);
    setSuppliers(loadedSuppliers);
    setShifts(loadedShifts);
    setBanks(loadedBanks);
    setDigitalAccounts(loadedDigital);
    setStockTxns(loadedStockTxns);
    setTanks(loadedTanks);
    setRateHistory(loadedRateHistory);
    setStaffFinance(loadedStaffFinance);
    setAttendance(loadedAttendance);
    setStandaloneExpenses(loadedStandalone);
    setLubePosSales(loadedLubePosSales);

    // After updating all state, safely advance the lock reference
    currentStationIdRef.current = activeStationId;
  }, [activeStationId, orgId]);

  // Real-time Firestore subscriptions for SaaS multitenant isolation
  useEffect(() => {
    if (!orgId) return;

    const unsubscribes = [
      firestoreDb.subscribeToCollection<Staff>(orgId, activeStationId, 'staff', setStaff),
      firestoreDb.subscribeToCollection<Product>(orgId, activeStationId, 'products', setProducts),
      firestoreDb.subscribeToCollection<Pump>(orgId, activeStationId, 'pumps', setPumps),
      firestoreDb.subscribeToCollection<Nozzle>(orgId, activeStationId, 'nozzles', setNozzles),
      firestoreDb.subscribeToCollection<Customer>(orgId, activeStationId, 'customers', setCustomers),
      firestoreDb.subscribeToCollection<Supplier>(orgId, activeStationId, 'suppliers', setSuppliers),
      firestoreDb.subscribeToCollection<Shift>(orgId, activeStationId, 'shifts', setShifts),
      firestoreDb.subscribeToCollection<BankAccount>(orgId, activeStationId, 'banks', setBanks),
      firestoreDb.subscribeToCollection<DigitalAccount>(orgId, activeStationId, 'digitalAccounts', setDigitalAccounts),
      firestoreDb.subscribeToCollection<StockTransaction>(orgId, activeStationId, 'stockTxns', setStockTxns),
      firestoreDb.subscribeToCollection<Tank>(orgId, activeStationId, 'tanks', setTanks),
      firestoreDb.subscribeToCollection<RateHistoryEntry>(orgId, activeStationId, 'rateHistory', setRateHistory),
      firestoreDb.subscribeToCollection<StaffFinanceEntry>(orgId, activeStationId, 'staffFinance', setStaffFinance),
      firestoreDb.subscribeToCollection<AttendanceRecord>(orgId, activeStationId, 'attendance', setAttendance),
      firestoreDb.subscribeToCollection<ExpenseEntry>(orgId, activeStationId, 'standaloneExpenses', setStandaloneExpenses),
      firestoreDb.subscribeToCollection<LubePosSale>(orgId, activeStationId, 'lubePosSales', setLubePosSales)
    ];

    // Load settings from settings doc
    const loadSettingsFS = async () => {
      const docRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as GlobalSettings);
      }
    };
    loadSettingsFS();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [orgId, activeStationId]);

  // Synchronize dynamic lists to active station's local storage partition ONLY when matching lock reference
  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveSettings(activeStationId, settings);
    }
  }, [settings, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveStaffList(activeStationId, staff);
    }
  }, [staff, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveProducts(activeStationId, products);
    }
  }, [products, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.savePumps(activeStationId, pumps);
    }
  }, [pumps, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveNozzles(activeStationId, nozzles);
    }
  }, [nozzles, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveCustomers(activeStationId, customers);
    }
  }, [customers, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveSuppliers(activeStationId, suppliers);
    }
  }, [suppliers, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveShifts(activeStationId, shifts);
    }
  }, [shifts, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveBankAccounts(activeStationId, banks);
    }
  }, [banks, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveDigitalAccounts(activeStationId, digitalAccounts);
    }
  }, [digitalAccounts, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveStockTransactions(activeStationId, stockTxns);
    }
  }, [stockTxns, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveTanks(activeStationId, tanks);
    }
  }, [tanks, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveRateHistory(activeStationId, rateHistory);
    }
  }, [rateHistory, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveStaffFinance(activeStationId, staffFinance);
    }
  }, [staffFinance, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveAttendance(activeStationId, attendance);
    }
  }, [attendance, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveStandaloneExpenses(activeStationId, standaloneExpenses);
    }
  }, [standaloneExpenses, activeStationId, orgId]);

  useEffect(() => {
    if (orgId) return;
    if (activeStationId === currentStationIdRef.current) {
      db.saveLubePosSales(activeStationId, lubePosSales);
    }
  }, [lubePosSales, activeStationId, orgId]);

  // Synchronize central Stations Directory changes
  useEffect(() => {
    db.saveStationsList(stations);
  }, [stations]);

  // Station Management Mutations
  const handleAddStation = (station: Station) => {
    setStations((prev) => [...prev, station]);
    const initialSettings: GlobalSettings = {
      stationName: station.name,
      stationUrduName: station.urduName,
      address: station.address,
      ntn: station.ntn,
      ownerContact: station.ownerContact,
      theme: 'light',
      language: settings.language
    };
    db.saveSettings(station.id, initialSettings);
    db.setActiveStationId(station.id);
    setActiveStationId(station.id);
  };

  const handleEditStation = (updatedStation: Station) => {
    setStations((prev) => prev.map((s) => (s.id === updatedStation.id ? updatedStation : s)));
    const currentSettings = db.getSettings(updatedStation.id);
    const updatedSettings: GlobalSettings = {
      ...currentSettings,
      stationName: updatedStation.name,
      stationUrduName: updatedStation.urduName,
      address: updatedStation.address,
      ntn: updatedStation.ntn,
      ownerContact: updatedStation.ownerContact
    };
    db.saveSettings(updatedStation.id, updatedSettings);
    if (updatedStation.id === activeStationId) {
      setSettings(updatedSettings);
    }
  };

  const handleDeleteStation = (stationId: string) => {
    if (stationId === 'st_default') {
      showAlert(
        settings.language === 'ur' ? 'خرابی' : 'Error',
        settings.language === 'ur' ? 'بنیادی پہلے سے طے شدہ اسٹیشن کو حذف نہیں کیا جا سکتا۔' : 'The core default station cannot be deleted.'
      );
      return;
    }
    
    showConfirm(
      settings.language === 'ur' ? 'کیا آپ کو یقین ہے؟' : 'Are You Sure?',
      settings.language === 'ur' ? 'کیا آپ واقعی اس اسٹیشن کا سارا ڈیٹا ہمیشہ کے لیے حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to permanently delete this station and all its isolated records? This cannot be undone.',
      () => {
        setStations((prev) => prev.filter((s) => s.id !== stationId));
        db.clearStationData(stationId);

        if (activeStationId === stationId) {
          db.setActiveStationId('st_default');
          setActiveStationId('st_default');
        }
        showToast(
          settings.language === 'ur' ? 'اسٹیشن کامیابی سے حذف ہو گیا!' : 'Station deleted successfully!',
          'success'
        );
      }
    );
  };

  const handleSwitchStation = (stationId: string) => {
    db.setActiveStationId(stationId);
    setActiveStationId(stationId);
  };


  // ==========================================
  // MUTATION CALLBACK WORKFLOWS
  // ==========================================

  const getBusinessType = (stationId: string): 'fuel_station' | 'cng' | 'lube' => {
    if (stationId === 'st_lube') return 'lube';
    return 'fuel_station';
  };

  const handleUpdateSettings = async (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'settings', 'global', newSettings);
    }
  };

  const handleAddStaff = async (newStaff: Staff) => {
    setStaff((prev) => [...prev, newStaff]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'staff', newStaff.id, newStaff);
    }
  };

  const handleUpdateStaff = async (updatedMember: Staff) => {
    setStaff((prev) => prev.map((s) => (s.id === updatedMember.id ? updatedMember : s)));
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'staff', updatedMember.id, updatedMember);
    }
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers((prev) => [...prev, newCustomer]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'customers', newCustomer.id, newCustomer);
    }
    showToast(settings.language === 'ur' ? 'گاہک کا کھاتہ کامیابی سے شامل ہو گیا۔' : 'Customer profile successfully created.', 'success');
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'customers', updatedCustomer.id, updatedCustomer);
    }
    showToast(settings.language === 'ur' ? 'گاہک کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں۔' : 'Customer profile successfully updated.', 'success');
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    if (orgId) {
      await firestoreDb.deleteDocument(orgId, activeStationId, 'customers', customerId);
    }
    showToast(settings.language === 'ur' ? 'گاہک کا کھاتہ کامیابی سے حذف ہو گیا۔' : 'Customer profile successfully deleted.', 'success');
  };

  const handleAddSupplier = async (newSupplier: Supplier) => {
    setSuppliers((prev) => [...prev, newSupplier]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'suppliers', newSupplier.id, newSupplier);
    }
    showToast(settings.language === 'ur' ? 'سپلائر کامیابی سے شامل ہو گیا۔' : 'Supplier profile successfully created.', 'success');
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s)));
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'suppliers', updatedSupplier.id, updatedSupplier);
    }
    showToast(settings.language === 'ur' ? 'سپلائر کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں۔' : 'Supplier profile successfully updated.', 'success');
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    if (orgId) {
      await firestoreDb.deleteDocument(orgId, activeStationId, 'suppliers', supplierId);
    }
    showToast(settings.language === 'ur' ? 'سپلائر کامیابی سے حذف ہو گیا۔' : 'Supplier profile successfully deleted.', 'success');
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'products', updatedProduct.id, updatedProduct);
    }
    showToast(settings.language === 'ur' ? 'پروڈکٹ کامیابی سے اپ ڈیٹ ہو گئی۔' : 'Product successfully updated.', 'success');
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (orgId) {
      await firestoreDb.deleteDocument(orgId, activeStationId, 'products', productId);
    }
    showToast(settings.language === 'ur' ? 'پروڈکٹ کامیابی سے حذف ہو گئی۔' : 'Product successfully deleted.', 'success');
  };

  const handleAddProduct = async (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'products', newProduct.id, newProduct);
    }
    showToast(settings.language === 'ur' ? 'پروڈکٹ کامیابی سے شامل ہو گئی۔' : 'Product successfully registered.', 'success');
  };

  const handleAddShift = async (newShift: Shift) => {
    setShifts((prev) => [newShift, ...prev]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'shifts', newShift.id, newShift);
    }
  };

  const handleUpdateShift = async (updatedShift: Shift) => {
    if (updatedShift.status === 'closed') {
      checkPerm('shift.close', 'close shift', 'شفٹ بند کرنے');
      
      const bType = getBusinessType(activeStationId);

      // 1. Group nozzle discharges by tankId and productId
      const tankDischarges: { [tankId: string]: number } = {};
      const productDischarges: { [productId: string]: number } = {};
      
      nozzles.forEach((nz) => {
        const openR = updatedShift.openingReadings[nz.id] || 0;
        const closeR = updatedShift.closingReadings[nz.id] || 0;
        const discharge = Math.max(0, closeR - openR);
        
        if (nz.tankId) {
          tankDischarges[nz.tankId] = (tankDischarges[nz.tankId] || 0) + discharge;
        }
        productDischarges[nz.productId] = (productDischarges[nz.productId] || 0) + discharge;
      });

      // 2. Validate tank stocks before closing the shift
      for (const tankId in tankDischarges) {
        const tank = tanks.find((t) => t.id === tankId);
        if (tank) {
          const discharge = tankDischarges[tankId];
          if (discharge > tank.currentStock) {
            const msg = settings.language === 'ur'
              ? `ٹینک "${tank.name}" میں اسٹاک کم ہے۔ دستیاب اسٹاک: ${tank.currentStock} لیٹر۔ مطلوبہ فروخت: ${discharge} لیٹر۔`
              : `Insufficient tank stock for ${tank.name}. Available: ${tank.currentStock} L. Requested sale: ${discharge} L.`;
            showToast(msg, 'error');
            throw new Error(msg);
          }
        }
      }

      // Also validate lube product stocks
      for (const lubeSale of updatedShift.lubeSales) {
        const product = products.find((p) => p.id === lubeSale.itemId);
        if (product) {
          if (lubeSale.quantity > product.currentStock) {
            const msg = settings.language === 'ur'
              ? `پراڈکٹ "${product.name}" کا اسٹاک کم ہے۔ دستیاب اسٹاک: ${product.currentStock}۔ مطلوبہ فروخت: ${lubeSale.quantity}۔`
              : `Insufficient product stock for ${product.name}. Available: ${product.currentStock}. Requested: ${lubeSale.quantity}.`;
            showToast(msg, 'error');
            throw new Error(msg);
          }
        }
      }

      // 3. Compute new customer balances
      const nextCustomers = customers.map((cust) => {
        let balanceDiff = 0;
        updatedShift.debitEntries.forEach((d) => {
          if (d.customerId === cust.id) balanceDiff += d.amount;
        });
        updatedShift.recoveryEntries.forEach((r) => {
          if (r.customerId === cust.id) balanceDiff -= r.amount;
        });
        return balanceDiff !== 0 ? { ...cust, balance: cust.balance + balanceDiff } : cust;
      });

      // 4. Compute new supplier balances
      const nextSuppliers = suppliers.map((supp) => {
        let paidDiff = 0;
        updatedShift.supplierPayments.forEach((p) => {
          if (p.supplierId === supp.id) paidDiff += p.amount;
        });
        return paidDiff !== 0 ? { ...supp, balance: Math.max(0, supp.balance - paidDiff) } : supp;
      });

      // 5. Compute new tank stocks and generate stock transactions + inventory movements
      const generatedStockTxns: StockTransaction[] = [];
      const generatedMovements: InventoryMovement[] = [];

      const nextTanks = tanks.map((tk) => {
        const tankDisch = tankDischarges[tk.id] || 0;
        if (tankDisch > 0) {
          const testLiters = updatedShift.testLiters[tk.productId] || 0;
          const productTanks = tanks.filter((t) => t.productId === tk.productId);
          const totalDischarge = productTanks.reduce((sum, t) => sum + (tankDischarges[t.id] || 0), 0);
          const propTest = totalDischarge > 0 ? (tankDisch / totalDischarge) * testLiters : 0;
          const netDisch = Math.max(0, tankDisch - propTest);
          const newStock = Math.max(0, Number((tk.currentStock - netDisch).toFixed(2)));
          
          // Generate transaction & movement
          const txnId = `stk_sale_shift_${updatedShift.id}_tank_${tk.id}`;
          const sellingPrice = products.find(p => p.id === tk.productId)?.rate || 0;
          generatedStockTxns.push({
            id: txnId,
            itemId: tk.productId,
            type: 'sale',
            quantity: netDisch,
            by: updatedShift.staffId,
            date: updatedShift.date,
            amount: netDisch * sellingPrice,
            sellingPrice,
            fuelType: 'Fuel Sale',
            tankId: tk.id,
            orgId: orgId || undefined,
            stationId: activeStationId,
            businessType: bType,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          generatedMovements.push({
            id: `mov_sale_shift_${updatedShift.id}_tank_${tk.id}`,
            productId: tk.productId,
            type: 'Sale',
            quantity: netDisch,
            date: new Date().toISOString(),
            referenceId: updatedShift.id,
            notes: `Shift Sale from Tank ${tk.name}`,
            tankId: tk.id,
            orgId: orgId || undefined,
            stationId: activeStationId,
            businessType: bType,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          return { ...tk, currentStock: newStock };
        }
        return tk;
      });

      // 6. Compute new product stocks and generate transactions/movements for lubes
      const nextProducts = products.map((prod) => {
        if (prod.type === 'fuel') {
          const totalDisch = productDischarges[prod.id] || 0;
          const testLit = updatedShift.testLiters[prod.id] || 0;
          const netSoldLitres = Math.max(0, totalDisch - testLit);
          if (netSoldLitres > 0) {
            return { ...prod, currentStock: Math.max(0, Number((prod.currentStock - netSoldLitres).toFixed(2))) };
          }
        } else if (prod.type === 'lube') {
          const lubeTx = updatedShift.lubeSales.reduce((acc, sale) => {
            return sale.itemId === prod.id ? acc + sale.quantity : acc;
          }, 0);
          if (lubeTx > 0) {
            const txnId = `stk_lube_sale_shift_${updatedShift.id}_prod_${prod.id}`;
            generatedStockTxns.push({
              id: txnId,
              itemId: prod.id,
              type: 'sale',
              quantity: lubeTx,
              by: updatedShift.staffId,
              date: updatedShift.date,
              amount: lubeTx * prod.rate,
              sellingPrice: prod.rate,
              fuelType: 'Lube Sale',
              orgId: orgId || undefined,
              stationId: activeStationId,
              businessType: bType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });

            generatedMovements.push({
              id: `mov_lube_sale_shift_${updatedShift.id}_prod_${prod.id}`,
              productId: prod.id,
              type: 'Sale',
              quantity: lubeTx,
              date: new Date().toISOString(),
              referenceId: updatedShift.id,
              notes: `Shift Sale for Lube Product ${prod.name}`,
              orgId: orgId || undefined,
              stationId: activeStationId,
              businessType: bType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });

            return { ...prod, currentStock: Math.max(0, Number((prod.currentStock - lubeTx).toFixed(2))) };
          }
        }
        return prod;
      });

      // 7. Compute new bank balances
      const nextBanks = banks.map((bk) => {
        let bankDelta = 0;
        updatedShift.bankCashEntries.forEach((bc) => {
          if (bc.bankAccountId === bk.id) bankDelta += bc.amount;
        });
        updatedShift.supplierPayments.forEach((p) => {
          if (p.bankAccountId === bk.id) bankDelta -= p.amount;
        });
        return bankDelta !== 0 ? { ...bk, balance: bk.balance + bankDelta } : bk;
      });

      // 8. Handle payroll shortage advances
      let nextStaff = staff;
      let newStaffFinanceEntry: StaffFinanceEntry | null = null;
      let staffMemberToUpdate: Staff | null = null;

      if (updatedShift.shortage && updatedShift.shortage > 0) {
        const staffMember = staff.find((st) => st.id === updatedShift.staffId);
        if (staffMember) {
          const refId = 'SF-SHORT-' + updatedShift.id;
          newStaffFinanceEntry = {
            id: 'sf_short_' + Date.now(),
            staffId: updatedShift.staffId,
            date: updatedShift.date,
            type: 'advance',
            amount: updatedShift.shortage,
            balanceAfter: 0,
            reference: refId,
            note: `Shortage Cash Discrepancy assigned to Operator from Shift Check #${updatedShift.id}`,
            orgId: orgId || undefined,
            stationId: activeStationId,
            businessType: bType,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          staffMemberToUpdate = { ...staffMember, advances: (staffMember.advances || 0) + updatedShift.shortage };
          nextStaff = staff.map(st => st.id === staffMember.id ? staffMemberToUpdate! : st);
        }
      }

      if (orgId) {
        // SaaS Firestore Atomic writeBatch
        const batch = writeBatch(dbFS);
        
        // 1. Shift
        const shiftRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'shifts', updatedShift.id);
        batch.set(shiftRef, updatedShift, { merge: true });

        // 2. Customers
        nextCustomers.forEach((c) => {
          const cRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'customers', c.id);
          batch.set(cRef, c, { merge: true });
        });

        // 3. Suppliers
        nextSuppliers.forEach((s) => {
          const sRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'suppliers', s.id);
          batch.set(sRef, s, { merge: true });
        });

        // 4. Tanks
        nextTanks.forEach((t) => {
          const tRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'tanks', t.id);
          batch.set(tRef, t, { merge: true });
        });

        // 5. Products
        nextProducts.forEach((p) => {
          const pRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'products', p.id);
          batch.set(pRef, p, { merge: true });
        });

        // 6. Banks
        nextBanks.forEach((b) => {
          const bRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'banks', b.id);
          batch.set(bRef, b, { merge: true });
        });

        // 7. Staff & Staff Finance
        if (staffMemberToUpdate && newStaffFinanceEntry) {
          const sRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'staff', staffMemberToUpdate.id);
          batch.set(sRef, staffMemberToUpdate, { merge: true });

          const sfRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'staffFinance', newStaffFinanceEntry.id);
          batch.set(sfRef, newStaffFinanceEntry);
        }

        // 8. Stock Transactions & Inventory Movements
        generatedStockTxns.forEach((tx) => {
          const txRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'stockTxns', tx.id);
          batch.set(txRef, tx);
        });

        generatedMovements.forEach((mov) => {
          const movRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'inventoryMovements', mov.id);
          batch.set(movRef, mov);
        });

        await batch.commit();
      } else {
        // Local mode: save generated transactions and movements to local states/DB
        if (generatedStockTxns.length > 0) {
          setStockTxns((prev) => [...generatedStockTxns, ...prev]);
        }
        if (newStaffFinanceEntry) {
          setStaffFinance((prev) => [newStaffFinanceEntry!, ...prev]);
        }
        // Save the updated shift
        setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
      }

      // Sync React state variables
      setCustomers(nextCustomers);
      setSuppliers(nextSuppliers);
      setTanks(nextTanks);
      setProducts(nextProducts);
      setBanks(nextBanks);
      setStaff(nextStaff);
    } else {
      // Shift is being updated but not closed (e.g. adding single entries during step 3)
      setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
      if (orgId) {
        const bType = getBusinessType(activeStationId);
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'shifts', updatedShift.id, updatedShift);
      }
    }
  };

  const handleAddStockReceipt = async (txn: StockTransaction) => {
    checkPerm('inventory.manage', 'add stock receipt', 'اسٹاک وصول کرنے');
    
    // 1. Add Stock transactions logger row
    setStockTxns((prev) => [txn, ...prev]);

    // 2. Replenish product currentStock quantity and optionally update rate
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === txn.itemId) {
          const newRate = txn.sellingPrice && txn.sellingPrice > 0 ? txn.sellingPrice : p.rate;
          return { ...p, currentStock: p.currentStock + txn.quantity, rate: newRate };
        }
        return p;
      })
    );

    // 3. Replenish tank stock if tankId is present
    if (txn.tankId) {
      setTanks((prevTanks) =>
        prevTanks.map((t) =>
          t.id === txn.tankId ? { ...t, currentStock: t.currentStock + txn.quantity } : t
        )
      );
    }

    // 4. Create InventoryMovement for Tank Refill
    const movementId = `mov_refill_${txn.id}`;
    const movement: InventoryMovement = {
      id: movementId,
      productId: txn.itemId,
      type: 'Tank Refill',
      quantity: txn.quantity,
      date: new Date().toISOString(),
      referenceId: txn.id,
      notes: `Stock Receipt Refill. Supplier: ${txn.supplierId || 'Direct'}`,
      tankId: txn.tankId || undefined,
      orgId: orgId || undefined,
      stationId: activeStationId,
      businessType: getBusinessType(activeStationId),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (orgId) {
      const bType = getBusinessType(activeStationId);
      await firestoreDb.saveDocument(orgId, activeStationId, bType, 'stockTxns', txn.id, txn);
      await firestoreDb.saveDocument(orgId, activeStationId, bType, 'inventoryMovements', movementId, movement);
      
      const product = products.find(p => p.id === txn.itemId);
      if (product) {
        const newRate = txn.sellingPrice && txn.sellingPrice > 0 ? txn.sellingPrice : product.rate;
        const updatedProduct = { ...product, currentStock: product.currentStock + txn.quantity, rate: newRate };
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'products', product.id, updatedProduct);
      }

      if (txn.tankId) {
        const tank = tanks.find(t => t.id === txn.tankId);
        if (tank) {
          const updatedTank = { ...tank, currentStock: tank.currentStock + txn.quantity };
          await firestoreDb.saveDocument(orgId, activeStationId, bType, 'tanks', tank.id, updatedTank);
        }
      }
    }
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    checkPerm('inventory.manage', 'update product stock', 'پراڈکٹ کا اسٹاک تبدیل کرنے');
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, currentStock: newStock } : p))
    );

    if (orgId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        const updatedProduct = { ...product, currentStock: newStock };
        await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'products', productId, updatedProduct);
      }
    }
  };

  const handleUpdateProductRate = async (
    productId: string,
    newRate: number,
    reason: string = 'Market revision Adjustment',
    changedBy: string = 'Admin (Owner)',
    dateStr: string = new Date().toISOString().replace('T', ' ').substring(0, 16)
  ) => {
    checkPerm('pricing.manage', 'manage pricing', 'قیمتوں کا انتظام کرنے');
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === productId) {
          const oldRate = p.rate;
          const change = newRate - oldRate;
          
          // Compute remaining stock of fuel in tanks/products
          const relevantTanks = tanks.filter(t => t.productId === productId);
          const totalStock = relevantTanks.reduce((s, t) => s + t.currentStock, 0) || p.currentStock;
          const impact = change * totalStock;

          // Push rate history entry
          const newRateHistory: RateHistoryEntry = {
            id: 'rh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            productId,
            date: dateStr,
            oldRate,
            newRate,
            change,
            stockAtTime: totalStock,
            impactAmount: Number(impact.toFixed(2)),
            reason,
            changedBy,
            difference: change,
            stockAtChange: totalStock,
            gainLoss: Number(impact.toFixed(2)),
            changedAt: Date.now()
          };
          setRateHistory((prev) => [newRateHistory, ...prev]);

          if (orgId) {
            const bType = getBusinessType(activeStationId);
            firestoreDb.saveDocument(orgId, activeStationId, bType, 'rateHistory', newRateHistory.id, newRateHistory);
            
            const updatedProduct = { ...p, rate: newRate };
            firestoreDb.saveDocument(orgId, activeStationId, bType, 'products', productId, updatedProduct);
          }

          return { ...p, rate: newRate };
        }
        return p;
      })
    );
  };

  const handleAddTank = async (newTank: Tank) => {
    checkPerm('tank.manage', 'add tank', 'ٹینک شامل کرنے');
    setTanks((prev) => [...prev, newTank]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'tanks', newTank.id, newTank);
    }
  };

  const handleUpdateTank = async (updatedTank: Tank) => {
    checkPerm('tank.manage', 'update tank', 'ٹینک تبدیل کرنے');
    setTanks((prev) => prev.map((t) => (t.id === updatedTank.id ? updatedTank : t)));
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'tanks', updatedTank.id, updatedTank);
    }
  };

  const handleDeleteTank = async (id: string) => {
    checkPerm('tank.manage', 'delete tank', 'ٹینک حذف کرنے');
    setTanks((prev) => prev.filter((t) => t.id !== id));
    if (orgId) {
      await firestoreDb.deleteDocument(orgId, activeStationId, 'tanks', id);
    }
  };

  const handleAddNozzle = async (newNozzle: Nozzle) => {
    setNozzles((prev) => [...prev, newNozzle]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'nozzles', newNozzle.id, newNozzle);
    }
  };

  const handleUpdateNozzle = async (updatedNozzle: Nozzle) => {
    setNozzles((prev) => prev.map((n) => (n.id === updatedNozzle.id ? updatedNozzle : n)));
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'nozzles', updatedNozzle.id, updatedNozzle);
    }
  };

  const handleDeleteNozzle = async (id: string) => {
    setNozzles((prev) => prev.filter((n) => n.id !== id));
    if (orgId) {
      await firestoreDb.deleteDocument(orgId, activeStationId, 'nozzles', id);
    }
  };

  const handleAddStaffFinance = async (newEntry: StaffFinanceEntry) => {
    setStaffFinance((prev) => [newEntry, ...prev]);

    const bType = getBusinessType(activeStationId);

    // Downstream synchronization: Issue salary or advance records an outflow expense (salary category)
    if (newEntry.type === 'issue' || newEntry.type === 'advance') {
      const staffMember = staff.find(s => s.id === newEntry.staffId);
      const label = staffMember ? (settings.language === 'ur' ? staffMember.urduName : staffMember.name) : 'Staff';
      const isAdvance = newEntry.type === 'advance';

      const exp: ExpenseEntry = {
        id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        category: 'salary',
        amount: newEntry.amount,
        description: `${isAdvance ? 'Advance/Loan' : 'Salary Payment'} for ${label} (${newEntry.note || ''})`,
        date: newEntry.date,
        paidFrom: (newEntry.mode === 'bank' || newEntry.mode === 'transfer') ? 'bank' : 'cash'
      };
      setStandaloneExpenses((prev) => [exp, ...prev]);

      if (orgId) {
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'standaloneExpenses', exp.id, exp);
      }

      // Deduct from bank account balance if transfer style
      if (newEntry.mode === 'bank' || newEntry.mode === 'transfer') {
        setBanks((prevBanks) => {
          const updatedBanks = prevBanks.map(bk => bk.id === 'b_1' ? { ...bk, balance: bk.balance - newEntry.amount } : bk);
          if (orgId) {
            const bankRef = prevBanks.find(b => b.id === 'b_1');
            if (bankRef) {
              const updatedBk = { ...bankRef, balance: bankRef.balance - newEntry.amount };
              firestoreDb.saveDocument(orgId, activeStationId, bType, 'banks', 'b_1', updatedBk);
            }
          }
          return updatedBanks;
        });
      }
    }

    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, bType, 'staffFinance', newEntry.id, newEntry);
    }
  };

  const handleAddShiftSalaryPayment = async (
    staffId: string,
    amount: number,
    note: string,
    paidFrom: 'cash' | 'bank',
    date: string,
    expenseId: string
  ) => {
    const staffMember = staff.find((s) => s.id === staffId);
    if (!staffMember) return;

    const previousEntries = staffFinance.filter((f) => f.staffId === staffId);
    const accrued = previousEntries.filter((f) => f.type === 'accrual').reduce((sum, x) => sum + x.amount, 0);
    const paid = previousEntries.filter((f) => f.type === 'issue').reduce((sum, x) => sum + x.amount + (x.deductedAdvance || 0), 0);
    const currentPayableBalance = accrued - paid;
    const balanceAfter = Math.max(0, currentPayableBalance - amount);

    const refId = 'SF-SHIFT-' + date.replace(/-/g, '') + '-' + expenseId.replace(/exp_/g, '').substring(0, 4);
    const newFin: StaffFinanceEntry = {
      id: 'sf_' + expenseId,
      staffId,
      date,
      type: 'issue',
      amount,
      balanceAfter,
      reference: refId,
      note: note || 'Paid Salary via Shift Expenses',
      mode: paidFrom === 'bank' ? 'bank' : 'cash',
      deductedAdvance: Math.min(amount, staffMember.advances || 0)
    };

    setStaffFinance((prev) => [newFin, ...prev]);

    const reductionVal = Math.min(amount, staffMember.advances || 0);
    let updatedStaffMember: Staff | undefined;
    setStaff((prevStaff) => {
      return prevStaff.map((s) => {
        if (s.id === staffId) {
          updatedStaffMember = {
            ...s,
            advances: Math.max(0, (s.advances || 0) - reductionVal)
          };
          return updatedStaffMember;
        }
        return s;
      });
    });

    if (orgId) {
      const bType = getBusinessType(activeStationId);
      await firestoreDb.saveDocument(orgId, activeStationId, bType, 'staffFinance', newFin.id, newFin);
      if (updatedStaffMember) {
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'staff', staffId, updatedStaffMember);
      }
    }
  };

  const handleDeleteShiftSalaryPayment = async (expenseId: string) => {
    const entryToRevert = staffFinance.find((f) => f.id === 'sf_' + expenseId);
    if (!entryToRevert) return;

    setStaffFinance((prev) => prev.filter((f) => f.id !== 'sf_' + expenseId));

    let updatedStaffMember: Staff | undefined;
    if (entryToRevert.deductedAdvance && entryToRevert.deductedAdvance > 0) {
      setStaff((prevStaff) => {
        return prevStaff.map((s) => {
          if (s.id === entryToRevert.staffId) {
            updatedStaffMember = {
              ...s,
              advances: (s.advances || 0) + (entryToRevert.deductedAdvance || 0)
            };
            return updatedStaffMember;
          }
          return s;
        });
      });
    }

    if (orgId) {
      const bType = getBusinessType(activeStationId);
      await firestoreDb.deleteDocument(orgId, activeStationId, 'staffFinance', 'sf_' + expenseId);
      if (entryToRevert.deductedAdvance && entryToRevert.deductedAdvance > 0) {
        const staffRef = staff.find(s => s.id === entryToRevert.staffId);
        if (staffRef) {
          const uStaff = { ...staffRef, advances: (staffRef.advances || 0) + (entryToRevert.deductedAdvance || 0) };
          await firestoreDb.saveDocument(orgId, activeStationId, bType, 'staff', entryToRevert.staffId, uStaff);
        }
      }
    }
  };

  const handleAddAttendance = async (records: AttendanceRecord[]) => {
    setAttendance((prev) => {
      // replace existing for safety
      const filtered = prev.filter(p => !records.some(r => r.date === p.date && r.staffId === p.staffId));
      return [...filtered, ...records];
    });
    if (orgId) {
      const bType = getBusinessType(activeStationId);
      for (const rec of records) {
        const docId = `${rec.staffId}_${rec.date}`;
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'attendance', docId, rec);
      }
    }
  };

  const handleAddStandaloneExpense = async (expense: ExpenseEntry) => {
    setStandaloneExpenses((prev) => [expense, ...prev]);
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'standaloneExpenses', expense.id, expense);
    }
  };

  const handleAddLubePosSale = async (sale: LubePosSale) => {
    setLubePosSales((prev) => [sale, ...prev]);

    const bType = getBusinessType(activeStationId);

    if (sale.isRecovery) {
      // It's a payment recovery! Update customer balance by subtracting the recovery amount
      if (sale.customerId) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) => {
            if (customer.id === sale.customerId) {
              const updatedCust = { ...customer, balance: Math.round((customer.balance - sale.total) * 100) / 100 };
              if (orgId) {
                firestoreDb.saveDocument(orgId, activeStationId, bType, 'customers', sale.customerId, updatedCust);
              }
              return updatedCust;
            }
            return customer;
          })
        );
      }
      
      // Update bank or digital account balance if applicable
      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        setBanks((prevBanks) =>
          prevBanks.map((bank) => {
            if (bank.id === sale.bankAccountId) {
              const updatedBk = { ...bank, balance: bank.balance + sale.total };
              if (orgId) {
                firestoreDb.saveDocument(orgId, activeStationId, bType, 'banks', sale.bankAccountId, updatedBk);
              }
              return updatedBk;
            }
            return bank;
          })
        );
      }
      if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        setDigitalAccounts((prevAccounts) =>
          prevAccounts.map((account) => {
            if (account.id === sale.digitalAccountId) {
              const updatedAcc = { ...account, balance: account.balance + sale.total };
              if (orgId) {
                firestoreDb.saveDocument(orgId, activeStationId, bType, 'digitalAccounts', sale.digitalAccountId, updatedAcc);
              }
              return updatedAcc;
            }
            return account;
          })
        );
      }
      if (orgId) {
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'lubePosSales', sale.id, sale);
      }
      return; // Skip product stock and inventory transactions for pure payment recoveries
    }

    if (sale.isReturn) {
      // It's a return/refund!
      // 1. Add returned quantities back to product stock
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const returnedQty = sale.items.reduce((sum, item) => {
            return item.productId === product.id ? sum + item.quantity : sum;
          }, 0);

          if (returnedQty <= 0) {
            return product;
          }

          const finalStock = Number((product.currentStock + returnedQty).toFixed(2));
          const updatedProd = {
            ...product,
            currentStock: finalStock
          };
          if (orgId) {
            firestoreDb.saveDocument(orgId, activeStationId, bType, 'products', product.id, updatedProd);
          }
          return updatedProd;
        })
      );

      // 2. Log adjustment stock transactions (positive quantity since products are coming back)
      const returnTransactions: StockTransaction[] = sale.items.map((item, index) => ({
        id: `stk_return_${sale.id}_${index}`,
        itemId: item.productId,
        type: 'adjustment',
        quantity: item.quantity,
        by: sale.cashierId,
        date: sale.date,
        amount: item.lineTotal,
        sellingPrice: item.unitPrice,
        fuelType: 'Lube Return'
      }));
      setStockTxns((prev) => [...returnTransactions, ...prev]);

      if (orgId) {
        for (const tx of returnTransactions) {
          await firestoreDb.saveDocument(orgId, activeStationId, bType, 'stockTxns', tx.id, tx);
        }
      }

      // 3. Update customer or bank/digital balances (subtract refund amount from outstanding or bank)
      if (sale.paymentMode === 'credit' && sale.customerId) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) => {
            if (customer.id === sale.customerId) {
              const updatedCust = { ...customer, balance: Math.max(0, Math.round((customer.balance - sale.total) * 100) / 100) };
              if (orgId) {
                firestoreDb.saveDocument(orgId, activeStationId, bType, 'customers', sale.customerId, updatedCust);
              }
              return updatedCust;
            }
            return customer;
          })
        );
      }

      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        setBanks((prevBanks) =>
          prevBanks.map((bank) => {
            if (bank.id === sale.bankAccountId) {
              const updatedBk = { ...bank, balance: Math.max(0, bank.balance - sale.total) };
              if (orgId) {
                firestoreDb.saveDocument(orgId, activeStationId, bType, 'banks', sale.bankAccountId, updatedBk);
              }
              return updatedBk;
            }
            return bank;
          })
        );
      }

      if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        setDigitalAccounts((prevAccounts) =>
          prevAccounts.map((account) => {
            if (account.id === sale.digitalAccountId) {
              const updatedAcc = { ...account, balance: Math.max(0, account.balance - sale.total) };
              if (orgId) {
                firestoreDb.saveDocument(orgId, activeStationId, bType, 'digitalAccounts', sale.digitalAccountId, updatedAcc);
              }
              return updatedAcc;
            }
            return account;
          })
        );
      }

      if (orgId) {
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'lubePosSales', sale.id, sale);
      }
      return;
    }

    // Standard POS Sale flow:
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const soldQty = sale.items.reduce((sum, item) => {
          return item.productId === product.id ? sum + item.quantity : sum;
        }, 0);

        if (soldQty <= 0) {
          return product;
        }

        const finalStock = Math.max(0, Number((product.currentStock - soldQty).toFixed(2)));
        const updatedProd = {
          ...product,
          currentStock: finalStock
        };
        if (orgId) {
          firestoreDb.saveDocument(orgId, activeStationId, bType, 'products', product.id, updatedProd);
        }
        return updatedProd;
      })
    );

    const saleTransactions: StockTransaction[] = sale.items.map((item, index) => ({
      id: `stk_sale_${sale.id}_${index}`,
      itemId: item.productId,
      type: 'sale',
      quantity: item.quantity,
      by: sale.cashierId,
      date: sale.date,
      amount: item.lineTotal,
      sellingPrice: item.unitPrice,
      fuelType: 'Lube POS'
    }));
    setStockTxns((prev) => [...saleTransactions, ...prev]);

    if (orgId) {
      for (const tx of saleTransactions) {
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'stockTxns', tx.id, tx);
      }
    }

    if (sale.paymentMode === 'credit' && sale.customerId) {
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) => {
          if (customer.id === sale.customerId) {
            const updatedCust = { ...customer, balance: Math.round((customer.balance + sale.total) * 100) / 100 };
            if (orgId) {
              firestoreDb.saveDocument(orgId, activeStationId, bType, 'customers', sale.customerId, updatedCust);
            }
            return updatedCust;
          }
          return customer;
        })
      );
    }

    if (sale.paymentMode === 'bank' && sale.bankAccountId) {
      setBanks((prevBanks) =>
        prevBanks.map((bank) => {
          if (bank.id === sale.bankAccountId) {
            const updatedBk = { ...bank, balance: bank.balance + sale.total };
            if (orgId) {
              firestoreDb.saveDocument(orgId, activeStationId, bType, 'banks', sale.bankAccountId, updatedBk);
            }
            return updatedBk;
          }
          return bank;
        })
      );
    }

    if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
      setDigitalAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === sale.digitalAccountId) {
            const updatedAcc = { ...account, balance: account.balance + sale.total };
            if (orgId) {
              firestoreDb.saveDocument(orgId, activeStationId, bType, 'digitalAccounts', sale.digitalAccountId, updatedAcc);
            }
            return updatedAcc;
          }
          return account;
        })
      );
    }

    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, bType, 'lubePosSales', sale.id, sale);
    }
  };

  const handleDeleteDebitEntry = async (shiftId: string, entryId: string) => {
    let targetShift: Shift | undefined;
    setShifts((prevShifts) => {
      const updated = prevShifts.map((sh) => {
        if (sh.id !== shiftId) return sh;
        const entry = sh.debitEntries.find((d) => d.id === entryId);
        if (!entry) return sh;

        if (sh.status === 'closed') {
          setCustomers((prevCustomers) =>
            prevCustomers.map((c) => {
              if (c.id === entry.customerId) {
                const updatedCust = { ...c, balance: Math.round((c.balance - entry.amount) * 100) / 100 };
                if (orgId) {
                  firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'customers', entry.customerId, updatedCust);
                }
                return updatedCust;
              }
              return c;
            })
          );
        }

        const updatedShift = {
          ...sh,
          debitEntries: sh.debitEntries.filter((d) => d.id !== entryId)
        };
        targetShift = updatedShift;
        return updatedShift;
      });
      db.saveShifts(activeStationId, updated);
      showToast(settings.language === 'ur' ? 'ڈیبٹ انٹری کامیابی سے حذف ہو گئی۔' : 'Debit entry successfully deleted.', 'success');
      return updated;
    });

    if (orgId && targetShift) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'shifts', shiftId, targetShift);
    }
  };

  const handleDeleteRecoveryEntry = async (shiftId: string, entryId: string) => {
    let targetShift: Shift | undefined;
    setShifts((prevShifts) => {
      const updated = prevShifts.map((sh) => {
        if (sh.id !== shiftId) return sh;
        const entry = sh.recoveryEntries.find((r) => r.id === entryId);
        if (!entry) return sh;

        if (sh.status === 'closed') {
          setCustomers((prevCustomers) =>
            prevCustomers.map((c) => {
              if (c.id === entry.customerId) {
                const updatedCust = { ...c, balance: Math.round((c.balance + entry.amount) * 100) / 100 };
                if (orgId) {
                  firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'customers', entry.customerId, updatedCust);
                }
                return updatedCust;
              }
              return c;
            })
          );
        }

        const updatedShift = {
          ...sh,
          recoveryEntries: sh.recoveryEntries.filter((r) => r.id !== entryId)
        };
        targetShift = updatedShift;
        return updatedShift;
      });
      db.saveShifts(activeStationId, updated);
      showToast(settings.language === 'ur' ? 'وصولی انٹری کامیابی سے حذف ہو گئی۔' : 'Recovery entry successfully deleted.', 'success');
      return updated;
    });

    if (orgId && targetShift) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'shifts', shiftId, targetShift);
    }
  };

  const handleDeleteSupplierPayment = async (shiftId: string, entryId: string) => {
    let targetShift: Shift | undefined;
    setShifts((prevShifts) => {
      const updated = prevShifts.map((sh) => {
        if (sh.id !== shiftId) return sh;
        const entry = sh.supplierPayments.find((p) => p.id === entryId);
        if (!entry) return sh;

        if (sh.status === 'closed') {
          setSuppliers((prevSuppliers) =>
            prevSuppliers.map((s) => {
              if (s.id === entry.supplierId) {
                const updatedSupp = { ...s, balance: Math.round((s.balance + entry.amount) * 100) / 100 };
                if (orgId) {
                  firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'suppliers', entry.supplierId, updatedSupp);
                }
                return updatedSupp;
              }
              return s;
            })
          );
        }

        const updatedShift = {
          ...sh,
          supplierPayments: sh.supplierPayments.filter((p) => p.id !== entryId)
        };
        targetShift = updatedShift;
        return updatedShift;
      });
      db.saveShifts(activeStationId, updated);
      showToast(settings.language === 'ur' ? 'ادائیگی انٹری کامیابی سے حذف ہو گئی۔' : 'Supplier payment entry successfully deleted.', 'success');
      return updated;
    });

    if (orgId && targetShift) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'shifts', shiftId, targetShift);
    }
  };

  const handleAddBank = async (bank: BankAccount) => {
    setBanks((prev) => {
      const updated = [...prev, bank];
      db.saveBankAccounts(activeStationId, updated);
      return updated;
    });
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'banks', bank.id, bank);
    }
  };

  const handleUpdateBanks = async (updatedBanks: BankAccount[]) => {
    setBanks(updatedBanks);
    db.saveBankAccounts(activeStationId, updatedBanks);
    if (orgId) {
      const bType = getBusinessType(activeStationId);
      for (const bank of updatedBanks) {
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'banks', bank.id, bank);
      }
    }
  };

  const handleAddDigitalAccount = async (acc: DigitalAccount) => {
    setDigitalAccounts((prev) => {
      const updated = [...prev, acc];
      db.saveDigitalAccounts(activeStationId, updated);
      return updated;
    });
    if (orgId) {
      await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'digitalAccounts', acc.id, acc);
    }
  };

  const handleUpdateDigitalAccounts = async (updatedAccs: DigitalAccount[]) => {
    setDigitalAccounts(updatedAccs);
    db.saveDigitalAccounts(activeStationId, updatedAccs);
    if (orgId) {
      const bType = getBusinessType(activeStationId);
      for (const acc of updatedAccs) {
        await firestoreDb.saveDocument(orgId, activeStationId, bType, 'digitalAccounts', acc.id, acc);
      }
    }
  };


  

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
