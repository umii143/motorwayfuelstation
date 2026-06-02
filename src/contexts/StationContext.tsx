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
  LubePosSale
} from '../types';
import { db } from '../data/db';

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
  handleAddSupplier: (newSupplier: Supplier) => void;
  handleUpdateSupplier: (updatedSupplier: Supplier) => void;
  handleAddShift: (newShift: Shift) => void;
  handleUpdateShift: (updatedShift: Shift) => void;
  handleAddStockReceipt: (txn: StockTransaction) => void;
  handleUpdateProductStock: (productId: string, newStock: number) => void;
  handleUpdateProductRate: (productId: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string) => void;
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
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
// ==========================================
  // MULTI-STATION (MULTI-BRANCH) ARCHITECTURE
  // ==========================================
  const [activeStationId, setActiveStationId] = useState<string>(() => db.getActiveStationId());
  const [stations, setStations] = useState<Station[]>(() => db.getStationsList());

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

  // Re-load all states dynamically and atomically when activeStationId changes
  useEffect(() => {
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
  }, [activeStationId]);

  // Synchronize dynamic lists to active station's local storage partition ONLY when matching lock reference
  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveSettings(activeStationId, settings);
    }
  }, [settings, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveStaffList(activeStationId, staff);
    }
  }, [staff, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveProducts(activeStationId, products);
    }
  }, [products, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.savePumps(activeStationId, pumps);
    }
  }, [pumps, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveNozzles(activeStationId, nozzles);
    }
  }, [nozzles, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveCustomers(activeStationId, customers);
    }
  }, [customers, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveSuppliers(activeStationId, suppliers);
    }
  }, [suppliers, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveShifts(activeStationId, shifts);
    }
  }, [shifts, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveBankAccounts(activeStationId, banks);
    }
  }, [banks, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveDigitalAccounts(activeStationId, digitalAccounts);
    }
  }, [digitalAccounts, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveStockTransactions(activeStationId, stockTxns);
    }
  }, [stockTxns, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveTanks(activeStationId, tanks);
    }
  }, [tanks, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveRateHistory(activeStationId, rateHistory);
    }
  }, [rateHistory, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveStaffFinance(activeStationId, staffFinance);
    }
  }, [staffFinance, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveAttendance(activeStationId, attendance);
    }
  }, [attendance, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveStandaloneExpenses(activeStationId, standaloneExpenses);
    }
  }, [standaloneExpenses, activeStationId]);

  useEffect(() => {
    if (activeStationId === currentStationIdRef.current) {
      db.saveLubePosSales(activeStationId, lubePosSales);
    }
  }, [lubePosSales, activeStationId]);

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
      alert('The core default station cannot be deleted.');
      return;
    }
    
    if (confirm(settings.language === 'ur' ? 'کیا آپ واقعی اس اسٹیشن کا سارا ڈیٹا ہمیشہ کے لیے حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to permanently delete this station and all its isolated records? This cannot be undone.')) {
      setStations((prev) => prev.filter((s) => s.id !== stationId));
      db.clearStationData(stationId);

      if (activeStationId === stationId) {
        db.setActiveStationId('st_default');
        setActiveStationId('st_default');
      }
    }
  };

  const handleSwitchStation = (stationId: string) => {
    db.setActiveStationId(stationId);
    setActiveStationId(stationId);
  };


  // ==========================================
  // MUTATION CALLBACK WORKFLOWS
  // ==========================================

  const handleUpdateSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings);
  };

  const handleAddStaff = (newStaff: Staff) => {
    setStaff((prev) => [...prev, newStaff]);
  };

  const handleUpdateStaff = (updatedMember: Staff) => {
    setStaff((prev) => prev.map((s) => (s.id === updatedMember.id ? updatedMember : s)));
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [...prev, newCustomer]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
  };

  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [...prev, newSupplier]);
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s)));
  };

  const handleAddShift = (newShift: Shift) => {
    setShifts((prev) => [newShift, ...prev]);
  };

  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));

    // On final closing of a shift, execute downstream integrations:
    // 1. Update customer credit book outstandings
    // 2. Adjust physical stock levels
    // 3. Update bank account sums based on bank deposit cash entries
    if (updatedShift.status === 'closed') {
      // Direct Customer Balances (Credits add to balance, recoveries subtract)
      setCustomers((prevCustomers) => {
        return prevCustomers.map((cust) => {
          let balanceDiff = 0;
          updatedShift.debitEntries.forEach((d) => {
            if (d.customerId === cust.id) {
              balanceDiff += d.amount;
            }
          });
          updatedShift.recoveryEntries.forEach((r) => {
            if (r.customerId === cust.id) {
              balanceDiff -= r.amount;
            }
          });

          return {
            ...cust,
            balance: cust.balance + balanceDiff
          };
        });
      });

      // Supplier Payments (Subtract payment amounts from supplier payables)
      setSuppliers((prevSuppliers) => {
        return prevSuppliers.map((supp) => {
          let paidDiff = 0;
          updatedShift.supplierPayments.forEach((p) => {
            if (p.supplierId === supp.id) {
              paidDiff += p.amount;
            }
          });
          return {
            ...supp,
            balance: Math.max(0, supp.balance - paidDiff)
          };
        });
      });

      // Deduct sold fuel/lube stocks
      setProducts((prevProducts) => {
        return prevProducts.map((prod) => {
          let litresSold = 0;

          // For nozzles related to this product, audit reading difference
          nozzles.forEach((nz) => {
            if (nz.productId === prod.id) {
              const openR = updatedShift.openingReadings[nz.id] || 0;
              const closeR = updatedShift.closingReadings[nz.id] || 0;
              if (closeR >= openR) {
                litresSold += closeR - openR;
              }
            }
          });

          // Test delivery offset (subtract meter tests from true commercial sales)
          const testLit = updatedShift.testLiters[prod.id] || 0;
          const netSoldLitres = Math.max(0, litresSold - testLit);

          // For lubes
          const lubeTx = updatedShift.lubeSales.reduce((acc, sale) => {
            return sale.itemId === prod.id ? acc + sale.quantity : acc;
          }, 0);

          const finalStock = Math.max(0, prod.currentStock - netSoldLitres - lubeTx);

          return {
            ...prod,
            currentStock: Number(finalStock.toFixed(2))
          };
        });
      });

      // Update Bank Balances
      setBanks((prevBanks) => {
        return prevBanks.map((bk) => {
          let bankDelta = 0;

          // Deposits made into this bank inside shift
          updatedShift.bankCashEntries.forEach((bc) => {
            if (bc.bankAccountId === bk.id) {
              bankDelta += bc.amount;
            }
          });

          // Checks/drawings paid to supplier from this bank
          updatedShift.supplierPayments.forEach((p) => {
            if (p.bankAccountId === bk.id) {
              bankDelta -= p.amount;
            }
          });

          return {
            ...bk,
            balance: bk.balance + bankDelta
          };
        });
      });

      // Downstream integration for salesman discrepancy (Shortage tracking assigned to payroll advances)
      if (updatedShift.shortage && updatedShift.shortage > 0) {
        const staffMember = staff.find((st) => st.id === updatedShift.staffId);
        if (staffMember) {
          const refId = 'SF-SHORT-' + updatedShift.id;
          const newFin: StaffFinanceEntry = {
            id: 'sf_short_' + Date.now(),
            staffId: updatedShift.staffId,
            date: updatedShift.date,
            type: 'advance',
            amount: updatedShift.shortage,
            balanceAfter: 0, // decouples running salary payable balances
            reference: refId,
            note: `Shortage Cash Discrepancy assigned to Operator from Shift Check #${updatedShift.id}`
          };
          setStaffFinance((prev) => [newFin, ...prev]);

          setStaff((prevStaff) => {
            return prevStaff.map((st) => {
              if (st.id === updatedShift.staffId) {
                return {
                  ...st,
                  advances: (st.advances || 0) + updatedShift.shortage
                };
              }
              return st;
            });
          });
        }
      }
    }
  };

  const handleAddStockReceipt = (txn: StockTransaction) => {
    // 1. Add Stock transactions logger row
    setStockTxns((prev) => [txn, ...prev]);

    // 2. Replenish product currentStock quantity
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === txn.itemId ? { ...p, currentStock: p.currentStock + txn.quantity } : p
      )
    );
  };

  const handleUpdateProductStock = (productId: string, newStock: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, currentStock: newStock } : p))
    );
  };

  const handleUpdateProductRate = (
    productId: string,
    newRate: number,
    reason: string = 'Market revision Adjustment',
    changedBy: string = 'Admin (Owner)',
    dateStr: string = new Date().toISOString().replace('T', ' ').substring(0, 16)
  ) => {
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
            changedBy
          };
          setRateHistory((prev) => [newRateHistory, ...prev]);

          return { ...p, rate: newRate };
        }
        return p;
      })
    );
  };

  const handleAddTank = (newTank: Tank) => {
    setTanks((prev) => [...prev, newTank]);
  };

  const handleUpdateTank = (updatedTank: Tank) => {
    setTanks((prev) => prev.map((t) => (t.id === updatedTank.id ? updatedTank : t)));
  };

  const handleDeleteTank = (id: string) => {
    setTanks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddNozzle = (newNozzle: Nozzle) => {
    setNozzles((prev) => [...prev, newNozzle]);
  };

  const handleUpdateNozzle = (updatedNozzle: Nozzle) => {
    setNozzles((prev) => prev.map((n) => (n.id === updatedNozzle.id ? updatedNozzle : n)));
  };

  const handleDeleteNozzle = (id: string) => {
    setNozzles((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAddStaffFinance = (newEntry: StaffFinanceEntry) => {
    setStaffFinance((prev) => [newEntry, ...prev]);

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

      // Deduct from bank account balance if transfer style
      if (newEntry.mode === 'bank' || newEntry.mode === 'transfer') {
        setBanks((prevBanks) =>
          prevBanks.map(bk => bk.id === 'b_1' ? { ...bk, balance: bk.balance - newEntry.amount } : bk)
        );
      }
    }
  };

  const handleAddShiftSalaryPayment = (
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
    setStaff((prevStaff) => {
      return prevStaff.map((s) => {
        if (s.id === staffId) {
          return {
            ...s,
            advances: Math.max(0, (s.advances || 0) - reductionVal)
          };
        }
        return s;
      });
    });
  };

  const handleDeleteShiftSalaryPayment = (expenseId: string) => {
    const entryToRevert = staffFinance.find((f) => f.id === 'sf_' + expenseId);
    if (!entryToRevert) return;

    setStaffFinance((prev) => prev.filter((f) => f.id !== 'sf_' + expenseId));

    if (entryToRevert.deductedAdvance && entryToRevert.deductedAdvance > 0) {
      setStaff((prevStaff) => {
        return prevStaff.map((s) => {
          if (s.id === entryToRevert.staffId) {
            return {
              ...s,
              advances: (s.advances || 0) + (entryToRevert.deductedAdvance || 0)
            };
          }
          return s;
        });
      });
    }
  };

  const handleAddAttendance = (records: AttendanceRecord[]) => {
    setAttendance((prev) => {
      // replace existing for safety
      const filtered = prev.filter(p => !records.some(r => r.date === p.date && r.staffId === p.staffId));
      return [...filtered, ...records];
    });
  };

  const handleAddStandaloneExpense = (expense: ExpenseEntry) => {
    setStandaloneExpenses((prev) => [expense, ...prev]);
  };

  const handleAddLubePosSale = (sale: LubePosSale) => {
    setLubePosSales((prev) => [sale, ...prev]);

    if (sale.isRecovery) {
      // It's a payment recovery! Update customer balance by subtracting the recovery amount
      if (sale.customerId) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.id === sale.customerId
              ? { ...customer, balance: Math.round((customer.balance - sale.total) * 100) / 100 }
              : customer
          )
        );
      }
      
      // Update bank or digital account balance if applicable
      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        setBanks((prevBanks) =>
          prevBanks.map((bank) =>
            bank.id === sale.bankAccountId
              ? { ...bank, balance: bank.balance + sale.total }
              : bank
          )
        );
      }
      if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        setDigitalAccounts((prevAccounts) =>
          prevAccounts.map((account) =>
            account.id === sale.digitalAccountId
              ? { ...account, balance: account.balance + sale.total }
              : account
          )
        );
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

          return {
            ...product,
            currentStock: Number((product.currentStock + returnedQty).toFixed(2))
          };
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

      // 3. Update customer or bank/digital balances (subtract refund amount from outstanding or bank)
      if (sale.paymentMode === 'credit' && sale.customerId) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.id === sale.customerId
              ? { ...customer, balance: Math.max(0, Math.round((customer.balance - sale.total) * 100) / 100) }
              : customer
          )
        );
      }

      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        setBanks((prevBanks) =>
          prevBanks.map((bank) =>
            bank.id === sale.bankAccountId
              ? { ...bank, balance: Math.max(0, bank.balance - sale.total) }
              : bank
          )
        );
      }

      if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        setDigitalAccounts((prevAccounts) =>
          prevAccounts.map((account) =>
            account.id === sale.digitalAccountId
              ? { ...account, balance: Math.max(0, account.balance - sale.total) }
              : account
          )
        );
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

        return {
          ...product,
          currentStock: Math.max(0, Number((product.currentStock - soldQty).toFixed(2)))
        };
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

    if (sale.paymentMode === 'credit' && sale.customerId) {
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.id === sale.customerId
            ? { ...customer, balance: Math.round((customer.balance + sale.total) * 100) / 100 }
            : customer
        )
      );
    }

    if (sale.paymentMode === 'bank' && sale.bankAccountId) {
      setBanks((prevBanks) =>
        prevBanks.map((bank) =>
          bank.id === sale.bankAccountId
            ? { ...bank, balance: bank.balance + sale.total }
            : bank
        )
      );
    }

    if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
      setDigitalAccounts((prevAccounts) =>
        prevAccounts.map((account) =>
          account.id === sale.digitalAccountId
            ? { ...account, balance: account.balance + sale.total }
            : account
        )
      );
    }
  };

  const handleAddBank = (bank: BankAccount) => {
    setBanks((prev) => {
      const updated = [...prev, bank];
      db.saveBankAccounts(activeStationId, updated);
      return updated;
    });
  };

  const handleUpdateBanks = (updatedBanks: BankAccount[]) => {
    setBanks(updatedBanks);
    db.saveBankAccounts(activeStationId, updatedBanks);
  };

  const handleAddDigitalAccount = (acc: DigitalAccount) => {
    setDigitalAccounts((prev) => {
      const updated = [...prev, acc];
      db.saveDigitalAccounts(activeStationId, updated);
      return updated;
    });
  };

  const handleUpdateDigitalAccounts = (updatedAccs: DigitalAccount[]) => {
    setDigitalAccounts(updatedAccs);
    db.saveDigitalAccounts(activeStationId, updatedAccs);
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
    handleAddSupplier,
    handleUpdateSupplier,
    handleAddShift,
    handleUpdateShift,
    handleAddStockReceipt,
    handleUpdateProductStock,
    handleUpdateProductRate,
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
    handleUpdateDigitalAccounts
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
