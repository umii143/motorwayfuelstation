import { create } from 'zustand';
import { Shift, Product, Customer, Supplier, Tank, BankAccount, Staff, StockTransaction, InventoryMovement, StaffFinanceEntry, JournalEntry } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
import { useInventoryStore } from './useInventoryStore';
import { useCustomerStore } from './useCustomerStore';
import { useSupplierStore } from './useSupplierStore';
import { useFinancialStore } from './useFinancialStore';
import { useStaffStore } from './useStaffStore';
import { useStationStore } from './useStationStore';
import { doc, writeBatch } from 'firebase/firestore';
import { dbFS } from '../lib/firebase';
import { fetchWithAuth } from '../lib/api';

interface ShiftState {
  shifts: Shift[];
  setShifts: (shifts: Shift[]) => void;
  handleAddShift: (newShift: Shift, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateShift: (updatedShift: Shift, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleDeleteDebitEntry: (shiftId: string, entryId: string, orgId?: string, stationId?: string) => Promise<void>;
  handleDeleteRecoveryEntry: (shiftId: string, entryId: string, orgId?: string, stationId?: string) => Promise<void>;
  handleDeleteSupplierPayment: (shiftId: string, entryId: string, orgId?: string, stationId?: string) => Promise<void>;
  handleMidShiftSplit: (productId: string, meterReadings: Record<string, number>, orgId?: string, stationId?: string) => Promise<void>;
}

const getBusinessType = (stationId: string): 'fuel_station' | 'cng' | 'lube' => {
  if (stationId === 'st_lube') return 'lube';
  return 'fuel_station';
};

const generateShiftJournalEntries = (
  shift: Shift,
  sId: string,
  bType: 'fuel_station' | 'cng' | 'lube',
  products: Product[],
  staff: Staff[],
  orgId?: string
): JournalEntry[] => {
  const entries: JournalEntry[] = [];
  const dateStr = shift.date + 'T' + (shift.endTime || '16:00:00') + '.000Z';

  shift.debitEntries.forEach((d) => {
    const pName = products.find(p => p.id === d.productId)?.name || 'Fuel';
    entries.push({
      id: `jr_deb_${d.id}`,
      date: dateStr,
      partyId: d.customerId,
      partyType: 'customer',
      type: 'debit',
      amount: d.amount,
      description: `Credit Sale: ${pName} ${d.quantity}L @ Rs. ${d.rate} (Shift #${shift.id})`,
      referenceId: shift.id,
      orgId: orgId || undefined,
      stationId: sId,
      businessType: bType,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  shift.recoveryEntries.forEach((r) => {
    entries.push({
      id: `jr_rec_${r.id}`,
      date: dateStr,
      partyId: r.customerId,
      partyType: 'customer',
      type: 'credit',
      amount: r.amount,
      description: `Payment Recovery via ${r.mode.toUpperCase()} (Shift #${shift.id})`,
      referenceId: shift.id,
      orgId: orgId || undefined,
      stationId: sId,
      businessType: bType,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  shift.supplierPayments.forEach((sp) => {
    entries.push({
      id: `jr_supp_${sp.id}`,
      date: dateStr,
      partyId: sp.supplierId,
      partyType: 'supplier',
      type: 'debit',
      amount: sp.amount,
      description: `Supplier payment (${sp.mode.toUpperCase()}) (Shift #${shift.id})`,
      referenceId: shift.id,
      orgId: orgId || undefined,
      stationId: sId,
      businessType: bType,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  shift.expenseEntries.forEach((exp) => {
    entries.push({
      id: `jr_exp_${exp.id}`,
      date: dateStr,
      partyType: 'expense',
      type: 'debit',
      amount: exp.amount,
      description: `Expense - ${exp.category}: ${exp.description} (Shift #${shift.id})`,
      referenceId: shift.id,
      orgId: orgId || undefined,
      stationId: sId,
      businessType: bType,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  if (shift.shortage && shift.shortage > 0) {
    const staffObj = staff.find(s => s.id === shift.staffId);
    const sName = staffObj ? staffObj.name : 'Crew';
    entries.push({
      id: `jr_short_${shift.id}`,
      date: dateStr,
      partyId: shift.staffId,
      partyType: 'staff',
      partyName: sName,
      type: 'debit',
      amount: shift.shortage,
      description: `Salary Advance via Shift Cash Shortage (Shift #${shift.id})`,
      referenceId: shift.id,
      orgId: orgId || undefined,
      stationId: sId,
      businessType: bType,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  return entries;
};

export const useShiftStore = create<ShiftState>((set, get) => ({
  shifts: db.getShifts(db.getActiveStationId()),

  setShifts: (shifts) => {
    set({ shifts });
    const sId = db.getActiveStationId();
    if (sId) db.saveShifts(sId, shifts);
  },

  handleAddShift: async (newShift, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = [newShift, ...state.shifts];
      db.saveShifts(sId, updated);
      return { shifts: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'shifts', newShift.id, newShift);
    }
  },

  handleMidShiftSplit: async (productId, meterReadings, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    
    // Get current product rate before it is updated
    const product = useInventoryStore.getState().products.find(p => p.id === productId);
    if (!product) return;
    const oldRate = product.rate;
    const now = new Date().toISOString();

    set((state) => {
      const updatedShifts = state.shifts.map(shift => {
        if (shift.status !== 'active') return shift;

        // Check if this shift has any nozzles for this product
        const nozzles = useInventoryStore.getState().nozzles;
        const relevantNozzles = Object.keys(shift.openingReadings).filter(nId => {
          const nz = nozzles.find(n => n.id === nId);
          return nz && nz.productId === productId;
        });

        if (relevantNozzles.length === 0) return shift;

        // Create segments for this product's nozzles
        const newSegments = [...(shift.segments || [])];
        
        relevantNozzles.forEach(nId => {
          const meterClose = meterReadings[nId];
          if (meterClose === undefined) return;

          // Find the last segment for this nozzle to get the meterOpen, OR use shift.openingReadings
          const previousSegments = newSegments.filter(s => s.nozzleId === nId);
          const meterOpen = previousSegments.length > 0 
            ? previousSegments[previousSegments.length - 1].meterClose 
            : shift.openingReadings[nId];

          const litersSold = Math.max(0, meterClose - meterOpen);
          const revenue = litersSold * oldRate;
          
          const segmentIndex = previousSegments.length + 1;
          const startedAt = previousSegments.length > 0 
            ? previousSegments[previousSegments.length - 1].closedAt 
            : shift.date + 'T' + shift.startTime;

          newSegments.push({
            id: `seg_${shift.id}_${nId}_${Date.now()}`,
            shiftId: shift.id,
            nozzleId: nId,
            productId,
            rate: oldRate,
            meterOpen,
            meterClose,
            litersSold,
            revenue,
            segmentIndex,
            startedAt,
            closedAt: now
          });
        });

        const updatedShift = { ...shift, segments: newSegments, activeMidShiftAlert: true };
        
        if (orgId) {
          firestoreDb.saveDocument(orgId, sId, bType, 'shifts', shift.id, updatedShift).catch(console.error);
        }

        return updatedShift;
      });

      db.saveShifts(sId, updatedShifts);
      return { shifts: updatedShifts };
    });
  },

  handleUpdateShift: async (updatedShift, orgId, stationId, checkPerm) => {
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    const showToast = useStationStore.getState().showToast;
    const settings = useStationStore.getState().settings;

    if (updatedShift.status === 'closed') {
      if (checkPerm) checkPerm('shift.close', 'close shift', 'شفٹ بند کرنے');
      
      const nozzles = useInventoryStore.getState().nozzles;
      const tanks = useInventoryStore.getState().tanks;
      const products = useInventoryStore.getState().products;
      const customers = useCustomerStore.getState().customers;
      const suppliers = useSupplierStore.getState().suppliers;
      const banks = useFinancialStore.getState().banks;
      const staff = useStaffStore.getState().staff;
      const journalEntries = useFinancialStore.getState().journalEntries;

      // 1. Group nozzle discharges
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

      // 2. Validate tank stocks
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

      // Validate lube product stocks
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

      // 5. Compute new tank stocks
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
            stationId: sId,
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
            stationId: sId,
            businessType: bType,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          return { ...tk, currentStock: newStock };
        }
        return tk;
      });

      // 5.5 Prepare FIFO Batches
      let nextBatches = [...useInventoryStore.getState().stockBatches];
      const newCOGSRecords: COGSRecord[] = [];

      // 6. Compute new product stocks and deduct from FIFO batches
      const nextProducts = products.map((prod) => {
        let netSoldForFIFO = 0;

        if (prod.type === 'fuel') {
          const totalDisch = productDischarges[prod.id] || 0;
          const testLit = updatedShift.testLiters[prod.id] || 0;
          const netSoldLitres = Math.max(0, totalDisch - testLit);
          if (netSoldLitres > 0) {
            netSoldForFIFO = netSoldLitres;
            prod = { ...prod, currentStock: Math.max(0, Number((prod.currentStock - netSoldLitres).toFixed(2))) };
          }
        } else if (prod.type === 'lube') {
          const lubeTx = updatedShift.lubeSales.reduce((acc, sale) => {
            return sale.itemId === prod.id ? acc + sale.quantity : acc;
          }, 0);
          if (lubeTx > 0) {
            netSoldForFIFO = lubeTx;
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
              stationId: sId,
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
              stationId: sId,
              businessType: bType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });

            prod = { ...prod, currentStock: Math.max(0, Number((prod.currentStock - lubeTx).toFixed(2))) };
          }
        }

        // Apply FIFO Deduction for this product
        if (netSoldForFIFO > 0) {
          let remainingToDeduct = netSoldForFIFO;
          // Sort active batches by date (oldest first)
          const productBatches = nextBatches
             .filter(b => b.productId === prod.id && b.status === 'active')
             .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          for (const batch of productBatches) {
            if (remainingToDeduct <= 0) break;
            const qtyToTake = Math.min(batch.qtyRemaining, remainingToDeduct);
            
            // Update batch
            const batchIndex = nextBatches.findIndex(b => b.id === batch.id);
            if (batchIndex !== -1) {
              const newRemaining = nextBatches[batchIndex].qtyRemaining - qtyToTake;
              nextBatches[batchIndex] = {
                ...nextBatches[batchIndex],
                qtyRemaining: newRemaining,
                status: newRemaining <= 0 ? 'depleted' : 'active'
              };
            }

            // Record COGS
            newCOGSRecords.push({
              id: `cogs_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
              shiftId: updatedShift.id,
              productId: prod.id,
              batchId: batch.id,
              date: updatedShift.date,
              quantitySold: qtyToTake,
              unitLandedCost: batch.landedCost,
              totalCOGS: qtyToTake * batch.landedCost,
              orgId: orgId || undefined,
              stationId: sId,
              businessType: bType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });

            remainingToDeduct -= qtyToTake;
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

      // 8. Handle shortage payroll advances
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
            stationId: sId,
            businessType: bType,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          staffMemberToUpdate = { ...staffMember, advances: (staffMember.advances || 0) + updatedShift.shortage };
          nextStaff = staff.map(st => st.id === staffMember.id ? staffMemberToUpdate! : st);
        }
      }

      // 9. Generate and Write Transaction Journal Entries
      const generatedJournals = generateShiftJournalEntries(updatedShift, sId, bType, products, staff, orgId);

      if (orgId) {
        // SaaS Firestore Atomic writeBatch
        const batch = writeBatch(dbFS);
        
        // Shift
        const shiftRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'shifts', updatedShift.id);
        batch.set(shiftRef, updatedShift, { merge: true });

        // Customers
        nextCustomers.forEach((c) => {
          const cRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'customers', c.id);
          batch.set(cRef, c, { merge: true });
        });

        // Suppliers
        nextSuppliers.forEach((s) => {
          const sRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'suppliers', s.id);
          batch.set(sRef, s, { merge: true });
        });

        // Tanks
        nextTanks.forEach((t) => {
          const tRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'tanks', t.id);
          batch.set(tRef, t, { merge: true });
        });

        // Products
        nextProducts.forEach((p) => {
          const pRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'products', p.id);
          batch.set(pRef, p, { merge: true });
        });

        // Banks
        nextBanks.forEach((b) => {
          const bRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'banks', b.id);
          batch.set(bRef, b, { merge: true });
        });

        // Staff & Staff Finance
        if (staffMemberToUpdate && newStaffFinanceEntry) {
          const sRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'staff', staffMemberToUpdate.id);
          batch.set(sRef, staffMemberToUpdate, { merge: true });

          const sfRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'staffFinance', newStaffFinanceEntry.id);
          batch.set(sfRef, newStaffFinanceEntry);
        }

        // Stock Transactions & Movements
        generatedStockTxns.forEach((tx) => {
          const txRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'stockTxns', tx.id);
          batch.set(txRef, tx);
        });

        generatedMovements.forEach((mov) => {
          const movRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'inventoryMovements', mov.id);
          batch.set(movRef, mov);
        });

        // FIFO Batches & COGS
        nextBatches.forEach((b) => {
          const bRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'stockBatches', b.id);
          batch.set(bRef, b, { merge: true });
        });

        newCOGSRecords.forEach((cogs) => {
          const cogsRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'cogsRecords', cogs.id);
          batch.set(cogsRef, cogs);
        });

        // Journal Entries
        generatedJournals.forEach((jr) => {
          const jrRef = doc(dbFS, 'organizations', orgId, 'stations', sId, 'journalEntries', jr.id);
          batch.set(jrRef, jr);
        });

        await batch.commit();
      } else {
        // Local mode writes
        if (generatedStockTxns.length > 0) {
          useInventoryStore.getState().setStockTxns([...generatedStockTxns, ...useInventoryStore.getState().stockTxns]);
        }
        if (generatedMovements.length > 0) {
          useInventoryStore.getState().setInventoryMovements([...generatedMovements, ...useInventoryStore.getState().inventoryMovements]);
        }
        if (newStaffFinanceEntry) {
          useStaffStore.getState().setStaffFinance([newStaffFinanceEntry, ...useStaffStore.getState().staffFinance]);
        }
        if (generatedJournals.length > 0) {
          const nextJournals = [...generatedJournals, ...journalEntries];
          useFinancialStore.getState().setJournalEntries(nextJournals);
        }
        
        useInventoryStore.getState().setStockBatches(nextBatches);
        if (newCOGSRecords.length > 0) {
          const oldCOGSRecords = useInventoryStore.getState().cogsRecords;
          useInventoryStore.getState().setCOGSRecords([...newCOGSRecords, ...oldCOGSRecords]);
        }
        
        set((state) => ({ shifts: state.shifts.map((s) => (s.id === updatedShift.id ? updatedShift : s)) }));
        db.saveShifts(sId, get().shifts);
      }

      // Update dependent stores
      useCustomerStore.getState().setCustomers(nextCustomers);
      useSupplierStore.getState().setSuppliers(nextSuppliers);
      useInventoryStore.getState().setTanks(nextTanks);
      useInventoryStore.getState().setProducts(nextProducts);
      useFinancialStore.getState().setBanks(nextBanks);
      useStaffStore.getState().setStaff(nextStaff);

      // WhatsApp alerts
      if (settings.whatsappSettings?.enabled && settings.whatsappSettings?.alerts?.shiftClose) {
        try {
          const staffObj = nextStaff.find(s => s.id === updatedShift.staffId);
          const staffName = staffObj ? staffObj.name : 'Staff';
          const msg = `*📊 Shift Closed Successfully*\n\n` +
            `*Staff:* ${staffName}\n` +
            `*Expected Cash:* Rs ${updatedShift.expectedCash.toLocaleString()}\n` +
            `*Submitted Cash:* Rs ${updatedShift.submittedCash.toLocaleString()}\n` +
            `*Variance:* Rs ${(updatedShift.cashVariance || 0).toLocaleString()}\n\n` +
            `_Generated automatically by FuelPro ERP_`;
          fetchWithAuth('/api/wa/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: settings.whatsappSettings.number, message: msg })
          }).catch(() => {});
        } catch(e) {}
      }

    } else {
      set((state) => ({ shifts: state.shifts.map((s) => (s.id === updatedShift.id ? updatedShift : s)) }));
      db.saveShifts(sId, get().shifts);
      if (orgId) {
        await firestoreDb.saveDocument(orgId, sId, bType, 'shifts', updatedShift.id, updatedShift);
      }
    }
  },

  handleDeleteDebitEntry: async (shiftId, entryId, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const showToast = useStationStore.getState().showToast;
    const settings = useStationStore.getState().settings;

    let targetShift: Shift | undefined;
    set((state) => {
      const updated = state.shifts.map((sh) => {
        if (sh.id !== shiftId) return sh;
        const entry = sh.debitEntries.find((d) => d.id === entryId);
        if (!entry) return sh;

        if (sh.status === 'closed') {
          const customers = useCustomerStore.getState().customers;
          const nextCustomers = customers.map((c) => {
            if (c.id === entry.customerId) {
              const updatedCust = { ...c, balance: Math.round((c.balance - entry.amount) * 100) / 100 };
              if (orgId) {
                firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'customers', entry.customerId, updatedCust);
              }
              return updatedCust;
            }
            return c;
          });
          useCustomerStore.getState().setCustomers(nextCustomers);

          // Revert journal entry
          const journalEntries = useFinancialStore.getState().journalEntries;
          const nextJournals = journalEntries.filter(j => j.id !== `jr_deb_${entryId}`);
          useFinancialStore.getState().setJournalEntries(nextJournals);
          if (orgId) {
            firestoreDb.deleteDocument(orgId, sId, 'journalEntries', `jr_deb_${entryId}`);
          }
        }

        const updatedShift = {
          ...sh,
          debitEntries: sh.debitEntries.filter((d) => d.id !== entryId)
        };
        targetShift = updatedShift;
        return updatedShift;
      });
      db.saveShifts(sId, updated);
      showToast(settings.language === 'ur' ? 'ڈیبٹ انٹری کامیابی سے حذف ہو گئی۔' : 'Debit entry successfully deleted.', 'success');
      return { shifts: updated };
    });

    if (orgId && targetShift) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'shifts', shiftId, targetShift);
    }
  },

  handleDeleteRecoveryEntry: async (shiftId, entryId, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const showToast = useStationStore.getState().showToast;
    const settings = useStationStore.getState().settings;

    let targetShift: Shift | undefined;
    set((state) => {
      const updated = state.shifts.map((sh) => {
        if (sh.id !== shiftId) return sh;
        const entry = sh.recoveryEntries.find((r) => r.id === entryId);
        if (!entry) return sh;

        if (sh.status === 'closed') {
          const customers = useCustomerStore.getState().customers;
          const nextCustomers = customers.map((c) => {
            if (c.id === entry.customerId) {
              const updatedCust = { ...c, balance: Math.round((c.balance + entry.amount) * 100) / 100 };
              if (orgId) {
                firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'customers', entry.customerId, updatedCust);
              }
              return updatedCust;
            }
            return c;
          });
          useCustomerStore.getState().setCustomers(nextCustomers);

          // Revert journal entry
          const journalEntries = useFinancialStore.getState().journalEntries;
          const nextJournals = journalEntries.filter(j => j.id !== `jr_rec_${entryId}`);
          useFinancialStore.getState().setJournalEntries(nextJournals);
          if (orgId) {
            firestoreDb.deleteDocument(orgId, sId, 'journalEntries', `jr_rec_${entryId}`);
          }
        }

        const updatedShift = {
          ...sh,
          recoveryEntries: sh.recoveryEntries.filter((r) => r.id !== entryId)
        };
        targetShift = updatedShift;
        return updatedShift;
      });
      db.saveShifts(sId, updated);
      showToast(settings.language === 'ur' ? 'وصولی انٹری کامیابی سے حذف ہو گئی۔' : 'Recovery entry successfully deleted.', 'success');
      return { shifts: updated };
    });

    if (orgId && targetShift) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'shifts', shiftId, targetShift);
    }
  },

  handleDeleteSupplierPayment: async (shiftId, entryId, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const showToast = useStationStore.getState().showToast;
    const settings = useStationStore.getState().settings;

    let targetShift: Shift | undefined;
    set((state) => {
      const updated = state.shifts.map((sh) => {
        if (sh.id !== shiftId) return sh;
        const entry = sh.supplierPayments.find((p) => p.id === entryId);
        if (!entry) return sh;

        if (sh.status === 'closed') {
          const suppliers = useSupplierStore.getState().suppliers;
          const nextSuppliers = suppliers.map((s) => {
            if (s.id === entry.supplierId) {
              const updatedSupp = { ...s, balance: Math.round((s.balance + entry.amount) * 100) / 100 };
              if (orgId) {
                firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'suppliers', entry.supplierId, updatedSupp);
              }
              return updatedSupp;
            }
            return s;
          });
          useSupplierStore.getState().setSuppliers(nextSuppliers);

          // Revert journal entry
          const journalEntries = useFinancialStore.getState().journalEntries;
          const nextJournals = journalEntries.filter(j => j.id !== `jr_supp_${entryId}`);
          useFinancialStore.getState().setJournalEntries(nextJournals);
          if (orgId) {
            firestoreDb.deleteDocument(orgId, sId, 'journalEntries', `jr_supp_${entryId}`);
          }
        }

        const updatedShift = {
          ...sh,
          supplierPayments: sh.supplierPayments.filter((p) => p.id !== entryId)
        };
        targetShift = updatedShift;
        return updatedShift;
      });
      db.saveShifts(sId, updated);
      showToast(settings.language === 'ur' ? 'ادائیگی انٹری کامیابی سے حذف ہو گئی۔' : 'Supplier payment entry successfully deleted.', 'success');
      return { shifts: updated };
    });

    if (orgId && targetShift) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'shifts', shiftId, targetShift);
    }
  }
}));
