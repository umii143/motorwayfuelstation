import { create } from 'zustand';
import { BankAccount, DigitalAccount, ExpenseEntry, LubePosSale, JournalEntry, Customer } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
import { getBusinessTypeForStation, isolateLubePosSales, isolateTenantRecords, withBusinessScope } from '../lib/businessScope';

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
  handleAddJournalEntry: (entry: JournalEntry, orgId?: string, stationId?: string) => Promise<void>;
}

const getBusinessType = (stationId: string): 'fuel_station' | 'cng' | 'lube' => {
  return getBusinessTypeForStation(stationId);
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
    const sId = db.getActiveStationId();
    const scopedBanks = isolateTenantRecords(banks, sId);
    set({ banks: scopedBanks });
    if (sId) db.saveBankAccounts(sId, scopedBanks);
  },
  setDigitalAccounts: (digitalAccounts) => {
    const sId = db.getActiveStationId();
    const scopedDigitalAccounts = isolateTenantRecords(digitalAccounts, sId);
    set({ digitalAccounts: scopedDigitalAccounts });
    if (sId) db.saveDigitalAccounts(sId, scopedDigitalAccounts);
  },
  setStandaloneExpenses: (standaloneExpenses) => {
    const sId = db.getActiveStationId();
    const scopedExpenses = isolateTenantRecords(standaloneExpenses, sId);
    set({ standaloneExpenses: scopedExpenses });
    if (sId) db.saveStandaloneExpenses(sId, scopedExpenses);
  },
  setLubePosSales: (lubePosSales) => {
    const sId = db.getActiveStationId();
    const scopedLubeSales = isolateLubePosSales(lubePosSales, sId);
    set({ lubePosSales: scopedLubeSales });
    if (sId) db.saveLubePosSales(sId, scopedLubeSales);
  },
  setJournalEntries: (journalEntries) => {
    const sId = db.getActiveStationId();
    const scopedJournalEntries = isolateTenantRecords(journalEntries, sId);
    set({ journalEntries: scopedJournalEntries });
    if (sId) db.saveJournalEntries(sId, scopedJournalEntries);
  },

  handleAddBank: async (bank, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const scopedBank = withBusinessScope(bank, sId, orgId);
    set((state) => {
      const updated = isolateTenantRecords([...state.banks, scopedBank], sId, orgId);
      db.saveBankAccounts(sId, updated);
      return { banks: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'banks', scopedBank.id, scopedBank);
    }
  },

  handleUpdateBanks: async (updatedBanks, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const scopedBanks = isolateTenantRecords(updatedBanks, sId, orgId);
    set({ banks: scopedBanks });
    db.saveBankAccounts(sId, scopedBanks);

    if (orgId) {
      const bType = getBusinessType(sId);
      for (const bank of scopedBanks) {
        await firestoreDb.saveDocument(orgId, sId, bType, 'banks', bank.id, bank);
      }
    }
  },

  handleAddDigitalAccount: async (acc, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const scopedAccount = withBusinessScope(acc, sId, orgId);
    set((state) => {
      const updated = isolateTenantRecords([...state.digitalAccounts, scopedAccount], sId, orgId);
      db.saveDigitalAccounts(sId, updated);
      return { digitalAccounts: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'digitalAccounts', scopedAccount.id, scopedAccount);
    }
  },

  handleUpdateDigitalAccounts: async (updatedAccs, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const scopedAccounts = isolateTenantRecords(updatedAccs, sId, orgId);
    set({ digitalAccounts: scopedAccounts });
    db.saveDigitalAccounts(sId, scopedAccounts);

    if (orgId) {
      const bType = getBusinessType(sId);
      for (const acc of scopedAccounts) {
        await firestoreDb.saveDocument(orgId, sId, bType, 'digitalAccounts', acc.id, acc);
      }
    }
  },

  handleAddStandaloneExpense: async (expense, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const scopedExpense = withBusinessScope(expense, sId, orgId);
    set((state) => {
      const updated = isolateTenantRecords([scopedExpense, ...state.standaloneExpenses], sId, orgId);
      db.saveStandaloneExpenses(sId, updated);
      return { standaloneExpenses: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'standaloneExpenses', scopedExpense.id, scopedExpense);
    }
  },

  handleAddLubePosSale: async (sale, orgId, stationId, handleUpdateCustomerBalanceStore) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    if (bType !== 'lube') {
      console.warn('Blocked Lube POS sale outside the lube business scope.', { stationId: sId });
      return;
    }
    sale = withBusinessScope(sale, sId, orgId);

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

    if (!sale.isRecovery) {
      const stockDirection = sale.isReturn ? 1 : -1;
      try {
        const { useInventoryStore } = await import('./useInventoryStore');
        const inventoryStore = useInventoryStore.getState();
        const nextProducts = inventoryStore.products.map((product) => {
          const quantity = sale.items
            .filter((item) => item.productId === product.id)
            .reduce((sum, item) => sum + item.quantity, 0);

          if (quantity === 0) return product;

          return {
            ...product,
            currentStock: Math.max(0, Number((product.currentStock + stockDirection * quantity).toFixed(2)))
          };
        });

        useInventoryStore.setState({ products: nextProducts });
        db.saveProducts(sId, nextProducts);

        if (orgId) {
          for (const product of nextProducts) {
            if (sale.items.some((item) => item.productId === product.id)) {
              await firestoreDb.saveDocument(orgId, sId, bType, 'products', product.id, product);
            }
          }
        }
      } catch (err) {
        console.error('Failed to update lube POS inventory stock:', err);
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
  },

  handleAddJournalEntry: async (entry, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    set((state) => {
      const next = [entry, ...state.journalEntries];
      db.saveJournalEntries(sId, next);
      return { journalEntries: next };
    });
    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, bType, 'journalEntries', entry.id, entry);
    }
  }
}));
