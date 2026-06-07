import { create } from 'zustand';
import { BankAccount, DigitalAccount, ExpenseEntry, LubePosSale, JournalEntry, Customer } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';

interface FinancialState {
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  standaloneExpenses: ExpenseEntry[];
  lubePosSales: LubePosSale[];
  journalEntries: JournalEntry[];

  setBanks: (banks: BankAccount[]) => void;
  setDigitalAccounts: (digital: DigitalAccount[]) => void;
  setStandaloneExpenses: (expenses: ExpenseEntry[]) => void;
  setLubePosSales: (sales: LubePosSale[]) => void;
  setJournalEntries: (entries: JournalEntry[]) => void;

  handleAddBank: (bank: BankAccount, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateBanks: (updatedBanks: BankAccount[], orgId?: string, stationId?: string) => Promise<void>;
  handleAddDigitalAccount: (acc: DigitalAccount, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateDigitalAccounts: (updatedAccs: DigitalAccount[], orgId?: string, stationId?: string) => Promise<void>;
  handleAddStandaloneExpense: (expense: ExpenseEntry, orgId?: string, stationId?: string) => Promise<void>;
  handleAddLubePosSale: (sale: LubePosSale, orgId?: string, stationId?: string, handleUpdateCustomerBalanceStore?: (customerId: string, diff: number) => void) => Promise<void>;
}

const getBusinessType = (stationId: string): 'fuel_station' | 'cng' | 'lube' => {
  if (stationId === 'st_lube') return 'lube';
  return 'fuel_station';
};

const generateLubePosJournalEntries = (sale: LubePosSale, sId: string, bType: 'fuel_station' | 'cng' | 'lube', orgId?: string): JournalEntry[] => {
  const entries: JournalEntry[] = [];
  const dateStr = sale.date + 'T' + (sale.time || '12:00:00') + '.000Z';

  if (sale.isRecovery) {
    if (sale.customerId) {
      entries.push({
        id: `jr_rec_${sale.id}_cust`,
        date: dateStr,
        partyId: sale.customerId,
        partyType: 'customer',
        partyName: sale.customerName,
        type: 'credit',
        amount: sale.total,
        description: `Lube POS Recovery Payment (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        entries.push({
          id: `jr_rec_${sale.id}_bank`,
          date: dateStr,
          partyId: sale.bankAccountId,
          partyType: 'bank',
          type: 'debit',
          amount: sale.total,
          description: `Bank Inflow Lube POS Recovery (Inv: ${sale.invoiceNo})`,
          referenceId: sale.id,
          orgId: orgId || undefined,
          stationId: sId,
          businessType: bType,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        entries.push({
          id: `jr_rec_${sale.id}_dig`,
          date: dateStr,
          partyId: sale.digitalAccountId,
          partyType: 'digital',
          type: 'debit',
          amount: sale.total,
          description: `Digital Inflow Lube POS Recovery (Inv: ${sale.invoiceNo})`,
          referenceId: sale.id,
          orgId: orgId || undefined,
          stationId: sId,
          businessType: bType,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else if (sale.paymentMode === 'cash') {
        entries.push({
          id: `jr_rec_${sale.id}_cash`,
          date: dateStr,
          partyType: 'revenue',
          type: 'debit',
          amount: sale.total,
          description: `Cash Inflow Lube POS Recovery (Inv: ${sale.invoiceNo})`,
          referenceId: sale.id,
          orgId: orgId || undefined,
          stationId: sId,
          businessType: bType,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    }
  } else if (sale.isReturn) {
    if (sale.paymentMode === 'credit' && sale.customerId) {
      entries.push({
        id: `jr_ret_${sale.id}_cust`,
        date: dateStr,
        partyId: sale.customerId,
        partyType: 'customer',
        partyName: sale.customerName,
        type: 'credit',
        amount: sale.total,
        description: `Lube POS Return (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } else if (sale.paymentMode === 'bank' && sale.bankAccountId) {
      entries.push({
        id: `jr_ret_${sale.id}_bank`,
        date: dateStr,
        partyId: sale.bankAccountId,
        partyType: 'bank',
        type: 'credit',
        amount: sale.total,
        description: `Bank Outflow Lube POS Refund (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } else if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
      entries.push({
        id: `jr_ret_${sale.id}_dig`,
        date: dateStr,
        partyId: sale.digitalAccountId,
        partyType: 'digital',
        type: 'credit',
        amount: sale.total,
        description: `Digital Outflow Lube POS Refund (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } else if (sale.paymentMode === 'cash') {
      entries.push({
        id: `jr_ret_${sale.id}_cash`,
        date: dateStr,
        partyType: 'expense',
        type: 'credit',
        amount: sale.total,
        description: `Cash Outflow Lube POS Refund (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  } else {
    if (sale.paymentMode === 'credit' && sale.customerId) {
      entries.push({
        id: `jr_sale_${sale.id}_cust`,
        date: dateStr,
        partyId: sale.customerId,
        partyType: 'customer',
        partyName: sale.customerName,
        type: 'debit',
        amount: sale.total,
        description: `Lube POS Credit Sale (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } else if (sale.paymentMode === 'bank' && sale.bankAccountId) {
      entries.push({
        id: `jr_sale_${sale.id}_bank`,
        date: dateStr,
        partyId: sale.bankAccountId,
        partyType: 'bank',
        type: 'debit',
        amount: sale.total,
        description: `Bank Inflow Lube POS Sale (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } else if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
      entries.push({
        id: `jr_sale_${sale.id}_dig`,
        date: dateStr,
        partyId: sale.digitalAccountId,
        partyType: 'digital',
        type: 'debit',
        amount: sale.total,
        description: `Digital Inflow Lube POS Sale (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } else if (sale.paymentMode === 'cash') {
      entries.push({
        id: `jr_sale_${sale.id}_cash`,
        date: dateStr,
        partyType: 'revenue',
        type: 'debit',
        amount: sale.total,
        description: `Cash Inflow Lube POS Sale (Inv: ${sale.invoiceNo})`,
        referenceId: sale.id,
        orgId: orgId || undefined,
        stationId: sId,
        businessType: bType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }
  return entries;
};

export const useFinancialStore = create<FinancialState>((set, get) => ({
  banks: db.getBankAccounts(db.getActiveStationId()),
  digitalAccounts: db.getDigitalAccounts(db.getActiveStationId()),
  standaloneExpenses: db.getStandaloneExpenses(db.getActiveStationId()),
  lubePosSales: db.getLubePosSales(db.getActiveStationId()),
  journalEntries: db.getJournalEntries(db.getActiveStationId()),

  setBanks: (banks) => {
    set({ banks });
    const sId = db.getActiveStationId();
    if (sId) db.saveBankAccounts(sId, banks);
  },
  setDigitalAccounts: (digitalAccounts) => {
    set({ digitalAccounts });
    const sId = db.getActiveStationId();
    if (sId) db.saveDigitalAccounts(sId, digitalAccounts);
  },
  setStandaloneExpenses: (standaloneExpenses) => {
    set({ standaloneExpenses });
    const sId = db.getActiveStationId();
    if (sId) db.saveStandaloneExpenses(sId, standaloneExpenses);
  },
  setLubePosSales: (lubePosSales) => {
    set({ lubePosSales });
    const sId = db.getActiveStationId();
    if (sId) db.saveLubePosSales(sId, lubePosSales);
  },
  setJournalEntries: (journalEntries) => {
    set({ journalEntries });
    const sId = db.getActiveStationId();
    if (sId) db.saveJournalEntries(sId, journalEntries);
  },

  handleAddBank: async (bank, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = [...state.banks, bank];
      db.saveBankAccounts(sId, updated);
      return { banks: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'banks', bank.id, bank);
    }
  },

  handleUpdateBanks: async (updatedBanks, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set({ banks: updatedBanks });
    db.saveBankAccounts(sId, updatedBanks);

    if (orgId) {
      const bType = getBusinessType(sId);
      for (const bank of updatedBanks) {
        await firestoreDb.saveDocument(orgId, sId, bType, 'banks', bank.id, bank);
      }
    }
  },

  handleAddDigitalAccount: async (acc, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = [...state.digitalAccounts, acc];
      db.saveDigitalAccounts(sId, updated);
      return { digitalAccounts: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'digitalAccounts', acc.id, acc);
    }
  },

  handleUpdateDigitalAccounts: async (updatedAccs, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set({ digitalAccounts: updatedAccs });
    db.saveDigitalAccounts(sId, updatedAccs);

    if (orgId) {
      const bType = getBusinessType(sId);
      for (const acc of updatedAccs) {
        await firestoreDb.saveDocument(orgId, sId, bType, 'digitalAccounts', acc.id, acc);
      }
    }
  },

  handleAddStandaloneExpense: async (expense, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = [expense, ...state.standaloneExpenses];
      db.saveStandaloneExpenses(sId, updated);
      return { standaloneExpenses: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'standaloneExpenses', expense.id, expense);
    }
  },

  handleAddLubePosSale: async (sale, orgId, stationId, handleUpdateCustomerBalanceStore) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);

    // Save POS Sale
    set((state) => {
      const updatedSales = [sale, ...state.lubePosSales];
      db.saveLubePosSales(sId, updatedSales);
      return { lubePosSales: updatedSales };
    });

    if (sale.isRecovery) {
      if (sale.customerId && handleUpdateCustomerBalanceStore) {
        handleUpdateCustomerBalanceStore(sale.customerId, -sale.total);
      }
      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        set((state) => {
          const next = state.banks.map(b => b.id === sale.bankAccountId ? { ...b, balance: b.balance + sale.total } : b);
          db.saveBankAccounts(sId, next);
          return { banks: next };
        });
      }
      if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        set((state) => {
          const next = state.digitalAccounts.map(d => d.id === sale.digitalAccountId ? { ...d, balance: d.balance + sale.total } : d);
          db.saveDigitalAccounts(sId, next);
          return { digitalAccounts: next };
        });
      }
    } else if (sale.isReturn) {
      if (sale.paymentMode === 'credit' && sale.customerId && handleUpdateCustomerBalanceStore) {
        handleUpdateCustomerBalanceStore(sale.customerId, -sale.total);
      }
      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        set((state) => {
          const next = state.banks.map(b => b.id === sale.bankAccountId ? { ...b, balance: Math.max(0, b.balance - sale.total) } : b);
          db.saveBankAccounts(sId, next);
          return { banks: next };
        });
      }
      if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        set((state) => {
          const next = state.digitalAccounts.map(d => d.id === sale.digitalAccountId ? { ...d, balance: Math.max(0, d.balance - sale.total) } : d);
          db.saveDigitalAccounts(sId, next);
          return { digitalAccounts: next };
        });
      }
    } else {
      if (sale.paymentMode === 'credit' && sale.customerId && handleUpdateCustomerBalanceStore) {
        handleUpdateCustomerBalanceStore(sale.customerId, sale.total);
      }
      if (sale.paymentMode === 'bank' && sale.bankAccountId) {
        set((state) => {
          const next = state.banks.map(b => b.id === sale.bankAccountId ? { ...b, balance: b.balance + sale.total } : b);
          db.saveBankAccounts(sId, next);
          return { banks: next };
        });
      }
      if (sale.paymentMode === 'digital' && sale.digitalAccountId) {
        set((state) => {
          const next = state.digitalAccounts.map(d => d.id === sale.digitalAccountId ? { ...d, balance: d.balance + sale.total } : d);
          db.saveDigitalAccounts(sId, next);
          return { digitalAccounts: next };
        });
      }
    }

    // Write Journal Entries
    const generatedJournals = generateLubePosJournalEntries(sale, sId, bType, orgId);
    if (generatedJournals.length > 0) {
      set((state) => {
        const nextJournals = [...generatedJournals, ...state.journalEntries];
        db.saveJournalEntries(sId, nextJournals);
        return { journalEntries: nextJournals };
      });
      if (orgId) {
        for (const jr of generatedJournals) {
          await firestoreDb.saveDocument(orgId, sId, bType, 'journalEntries', jr.id, jr);
        }
      }
    }

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, bType, 'lubePosSales', sale.id, sale);
      // Customer and banks are updated in Firestore via context bridge calls to saveDocument
    }
  }
}));
