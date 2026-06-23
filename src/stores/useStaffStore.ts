import { create } from 'zustand';
import { Staff, StaffFinanceEntry, AttendanceRecord, ExpenseEntry, BankAccount, SalaryTransaction, StaffLoan, SalaryAdvance } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
import { getBusinessTypeForStation, isolateTenantRecords, withBusinessScope } from '../lib/businessScope';

interface StaffState {
  staff: Staff[];
  staffFinance: StaffFinanceEntry[];
  attendance: AttendanceRecord[];

  setStaff: (staff: Staff[]) => void;
  setStaffFinance: (staffFinance: StaffFinanceEntry[]) => void;
  setAttendance: (attendance: AttendanceRecord[]) => void;

  handleAddStaff: (newStaff: Staff, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateStaff: (updatedMember: Staff, orgId?: string, stationId?: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleAddStaffFinance: (newEntry: StaffFinanceEntry, orgId?: string, stationId?: string, settings?: any, handleAddStandaloneExpenseStore?: (exp: ExpenseEntry) => void, handleUpdateBanksStore?: (banks: BankAccount[]) => void, banks?: BankAccount[]) => Promise<void>;
  handleAddShiftSalaryPayment: (staffId: string, amount: number, note: string, paidFrom: 'cash' | 'bank', date: string, expenseId: string, orgId?: string, stationId?: string) => Promise<void>;
  handleDeleteShiftSalaryPayment: (expenseId: string, orgId?: string, stationId?: string) => Promise<void>;
  salaryTransactions: SalaryTransaction[];
  staffLoans: StaffLoan[];
  salaryAdvances: SalaryAdvance[];

  setSalaryTransactions: (txns: SalaryTransaction[]) => void;
  setStaffLoans: (loans: StaffLoan[]) => void;
  setSalaryAdvances: (advances: SalaryAdvance[]) => void;

  handleAddSalaryTransaction: (txn: SalaryTransaction, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateSalaryTransaction: (txn: SalaryTransaction, orgId?: string, stationId?: string) => Promise<void>;
  
  handleAddStaffLoan: (loan: StaffLoan, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateStaffLoan: (loan: StaffLoan, orgId?: string, stationId?: string) => Promise<void>;
  
  handleAddSalaryAdvance: (advance: SalaryAdvance, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateSalaryAdvance: (advance: SalaryAdvance, orgId?: string, stationId?: string) => Promise<void>;

  handleAddAttendance: (records: AttendanceRecord[], orgId?: string, stationId?: string) => Promise<void>;
}

const getBusinessType = (stationId: string): 'fuel_station' | 'cng' | 'lube' => {
  return getBusinessTypeForStation(stationId);
};

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: db.getStaffList(db.getActiveStationId()),
  staffFinance: db.getStaffFinance(db.getActiveStationId()),
  attendance: db.getAttendance(db.getActiveStationId()),
  salaryTransactions: db.getSalaryTransactions(db.getActiveStationId()),
  staffLoans: db.getStaffLoans(db.getActiveStationId()),
  salaryAdvances: db.getSalaryAdvances(db.getActiveStationId()),

  setStaff: (staff) => {
    const sId = db.getActiveStationId();
    const scopedStaff = isolateTenantRecords(staff, sId);
    set({ staff: scopedStaff });
    if (sId) db.saveStaffList(sId, scopedStaff);
  },
  setStaffFinance: (staffFinance) => {
    const sId = db.getActiveStationId();
    const scopedFinance = isolateTenantRecords(staffFinance, sId);
    set({ staffFinance: scopedFinance });
    if (sId) db.saveStaffFinance(sId, scopedFinance);
  },
  setAttendance: (attendance) => {
    const sId = db.getActiveStationId();
    const scopedAttendance = isolateTenantRecords(attendance, sId);
    set({ attendance: scopedAttendance });
    if (sId) db.saveAttendance(sId, scopedAttendance);
  },
  setSalaryTransactions: (salaryTransactions) => {
    const sId = db.getActiveStationId();
    const scoped = isolateTenantRecords(salaryTransactions, sId);
    set({ salaryTransactions: scoped });
    if (sId) db.saveSalaryTransactions(sId, scoped);
  },
  setStaffLoans: (staffLoans) => {
    const sId = db.getActiveStationId();
    const scoped = isolateTenantRecords(staffLoans, sId);
    set({ staffLoans: scoped });
    if (sId) db.saveStaffLoans(sId, scoped);
  },
  setSalaryAdvances: (salaryAdvances) => {
    const sId = db.getActiveStationId();
    const scoped = isolateTenantRecords(salaryAdvances, sId);
    set({ salaryAdvances: scoped });
    if (sId) db.saveSalaryAdvances(sId, scoped);
  },

  handleAddStaff: async (newStaff, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const activeBType = getBusinessType(sId);
    const staffWithBType: Staff = withBusinessScope(newStaff, sId, orgId);

    set((state) => {
      const updated = [...state.staff, staffWithBType];
      db.saveStaffList(sId, updated);
      return { staff: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, activeBType, 'staff', newStaff.id, staffWithBType);
    }
  },

  handleUpdateStaff: async (updatedMember, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const activeBType = getBusinessType(sId);
    const staffWithBType: Staff = withBusinessScope(updatedMember, sId, orgId);

    set((state) => {
      const updated = state.staff.map((s) => (s.id === updatedMember.id ? staffWithBType : s));
      db.saveStaffList(sId, updated);
      return { staff: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, activeBType, 'staff', updatedMember.id, staffWithBType);
    }
  },

  handleAddStaffFinance: async (newEntry, orgId, stationId, settings, handleAddStandaloneExpenseStore, handleUpdateBanksStore, banks) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);

    set((state) => {
      const updated = [newEntry, ...state.staffFinance];
      db.saveStaffFinance(sId, updated);
      return { staffFinance: updated };
    });

    if (newEntry.type === 'issue' || newEntry.type === 'advance') {
      const staffMember = get().staff.find(s => s.id === newEntry.staffId);
      const label = staffMember ? (settings?.language === 'ur' ? staffMember.urduName : staffMember.name) : 'Staff';
      const isAdvance = newEntry.type === 'advance';

      const exp: ExpenseEntry = {
        id: 'exp_' + Date.now() + '_' + crypto.randomUUID().split('-')[0],
        category: 'salary',
        amount: newEntry.amount,
        description: `${isAdvance ? 'Advance/Loan' : 'Salary Payment'} for ${label} (${newEntry.note || ''})`,
        date: newEntry.date,
        paidFrom: (newEntry.mode === 'bank' || newEntry.mode === 'transfer') ? 'bank' : 'cash'
      };

      if (handleAddStandaloneExpenseStore) {
        handleAddStandaloneExpenseStore(exp);
      }

      if ((newEntry.mode === 'bank' || newEntry.mode === 'transfer') && banks && handleUpdateBanksStore) {
        const updatedBanks = banks.map(bk => bk.id === 'b_1' ? { ...bk, balance: bk.balance - newEntry.amount } : bk);
        handleUpdateBanksStore(updatedBanks);
      }
    }

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, bType, 'staffFinance', newEntry.id, newEntry);
    }
  },

  handleAddShiftSalaryPayment: async (staffId, amount, note, paidFrom, date, expenseId, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const staffMember = get().staff.find((s) => s.id === staffId);
    if (!staffMember) return;

    const previousEntries = get().staffFinance.filter((f) => f.staffId === staffId);
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

    set((state) => {
      const updatedSF = [newFin, ...state.staffFinance];
      db.saveStaffFinance(sId, updatedSF);
      return { staffFinance: updatedSF };
    });

    const reductionVal = Math.min(amount, staffMember.advances || 0);
    let updatedStaffMember: Staff | undefined;
    
    set((state) => {
      const updatedStaff = state.staff.map((s) => {
        if (s.id === staffId) {
          updatedStaffMember = {
            ...s,
            advances: Math.max(0, (s.advances || 0) - reductionVal)
          };
          return updatedStaffMember;
        }
        return s;
      });
      db.saveStaffList(sId, updatedStaff);
      return { staff: updatedStaff };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, bType, 'staffFinance', newFin.id, newFin);
      if (updatedStaffMember) {
        await firestoreDb.saveDocument(orgId, sId, bType, 'staff', staffId, updatedStaffMember);
      }
    }
  },

  handleDeleteShiftSalaryPayment: async (expenseId, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const entryToRevert = get().staffFinance.find((f) => f.id === 'sf_' + expenseId);
    if (!entryToRevert) return;

    set((state) => {
      const updatedSF = state.staffFinance.filter((f) => f.id !== 'sf_' + expenseId);
      db.saveStaffFinance(sId, updatedSF);
      return { staffFinance: updatedSF };
    });

    let updatedStaffMember: Staff | undefined;
    if (entryToRevert.deductedAdvance && entryToRevert.deductedAdvance > 0) {
      set((state) => {
        const updatedStaff = state.staff.map((s) => {
          if (s.id === entryToRevert.staffId) {
            updatedStaffMember = {
              ...s,
              advances: (s.advances || 0) + (entryToRevert.deductedAdvance || 0)
            };
            return updatedStaffMember;
          }
          return s;
        });
        db.saveStaffList(sId, updatedStaff);
        return { staff: updatedStaff };
      });
    }

    if (orgId) {
      await firestoreDb.deleteDocument(orgId, sId, 'staffFinance', 'sf_' + expenseId);
      if (entryToRevert.deductedAdvance && entryToRevert.deductedAdvance > 0) {
        const staffRef = get().staff.find(s => s.id === entryToRevert.staffId);
        if (staffRef) {
          const uStaff = { ...staffRef, advances: (staffRef.advances || 0) + (entryToRevert.deductedAdvance || 0) };
          await firestoreDb.saveDocument(orgId, sId, bType, 'staff', entryToRevert.staffId, uStaff);
        }
      }
    }
  },

  handleAddAttendance: async (records, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);

    set((state) => {
      const filtered = state.attendance.filter(p => !records.some(r => r.date === p.date && r.staffId === p.staffId));
      const nextAttendance = [...filtered, ...records];
      db.saveAttendance(sId, nextAttendance);
      return { attendance: nextAttendance };
    });

    if (orgId) {
      for (const rec of records) {
        const docId = `${rec.staffId}_${rec.date}`;
        await firestoreDb.saveDocument(orgId, sId, bType, 'attendance', docId, rec);
      }
    }
  },

  handleAddSalaryTransaction: async (txn, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const scoped = withBusinessScope(txn, sId, orgId);
    set((state) => {
      const updated = [scoped, ...state.salaryTransactions];
      db.saveSalaryTransactions(sId, updated);
      return { salaryTransactions: updated };
    });
    if (orgId) await firestoreDb.saveDocument(orgId, sId, bType, 'salaryTransactions', scoped.id, scoped);
  },
  handleUpdateSalaryTransaction: async (txn, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const scoped = withBusinessScope(txn, sId, orgId);
    set((state) => {
      const updated = state.salaryTransactions.map(t => t.id === scoped.id ? scoped : t);
      db.saveSalaryTransactions(sId, updated);
      return { salaryTransactions: updated };
    });
    if (orgId) await firestoreDb.saveDocument(orgId, sId, bType, 'salaryTransactions', scoped.id, scoped);
  },

  handleAddStaffLoan: async (loan, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const scoped = withBusinessScope(loan, sId, orgId);
    set((state) => {
      const updated = [scoped, ...state.staffLoans];
      db.saveStaffLoans(sId, updated);
      return { staffLoans: updated };
    });
    if (orgId) await firestoreDb.saveDocument(orgId, sId, bType, 'staffLoans', scoped.id, scoped);
  },
  handleUpdateStaffLoan: async (loan, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const scoped = withBusinessScope(loan, sId, orgId);
    set((state) => {
      const updated = state.staffLoans.map(t => t.id === scoped.id ? scoped : t);
      db.saveStaffLoans(sId, updated);
      return { staffLoans: updated };
    });
    if (orgId) await firestoreDb.saveDocument(orgId, sId, bType, 'staffLoans', scoped.id, scoped);
  },

  handleAddSalaryAdvance: async (adv, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const scoped = withBusinessScope(adv, sId, orgId);
    set((state) => {
      const updated = [scoped, ...state.salaryAdvances];
      db.saveSalaryAdvances(sId, updated);
      return { salaryAdvances: updated };
    });
    if (orgId) await firestoreDb.saveDocument(orgId, sId, bType, 'salaryAdvances', scoped.id, scoped);
  },
  handleUpdateSalaryAdvance: async (adv, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const scoped = withBusinessScope(adv, sId, orgId);
    set((state) => {
      const updated = state.salaryAdvances.map(t => t.id === scoped.id ? scoped : t);
      db.saveSalaryAdvances(sId, updated);
      return { salaryAdvances: updated };
    });
    if (orgId) await firestoreDb.saveDocument(orgId, sId, bType, 'salaryAdvances', scoped.id, scoped);
  }
}));
