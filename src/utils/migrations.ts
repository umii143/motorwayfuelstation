import { useInventoryStore } from '../stores/useInventoryStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useFinancialStore } from '../stores/useFinancialStore';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JournalEntry, SupplierPayment, StockTransaction, Supplier } from '../types';
import { useShiftStore } from '../stores/useShiftStore';
import { getBusinessTypeForStation } from '../lib/businessScope';

export const migrateAccountsPayable = async (orgId?: string) => {
  const sId = db.getActiveStationId();
  if (!sId) return;

  const migrationKey = `fuelpro_ap_migrated_v1_${sId}`;
  const isMigrated = localStorage.getItem(migrationKey);
  if (isMigrated === 'true') {
    return;
  }

  // eslint-disable-next-line no-console
  console.log('--- STARTING ACCOUNTS PAYABLE RETROACTIVE MIGRATION ---');

  const bType = getBusinessTypeForStation(sId);

  const inventoryStore = useInventoryStore.getState();
  const supplierStore = useSupplierStore.getState();
  const financialStore = useFinancialStore.getState();
  const shiftStore = useShiftStore.getState();

  const stockTxns = inventoryStore.stockTxns;
  const suppliers = supplierStore.suppliers;
  const shifts = shiftStore.shifts;
  
  if (!suppliers || suppliers.length === 0) {
     // eslint-disable-next-line no-console
     console.log('No suppliers found. Skipping migration.');
     localStorage.setItem(migrationKey, 'true');
     return;
  }

  // Find all historical purchases
  const purchases = stockTxns.filter(t => t.type === 'receipt' && t.supplierId);
  // eslint-disable-next-line no-console
  console.log(`Found ${purchases.length} historical stock purchases.`);

  // Find all historical payments inside shifts
  const shiftPayments: SupplierPayment[] = [];
  shifts.forEach(shift => {
     if (shift.supplierPayments) {
        shiftPayments.push(...shift.supplierPayments);
     }
  });
  // eslint-disable-next-line no-console
  console.log(`Found ${shiftPayments.length} historical supplier payments from shifts.`);

  const newJournalEntries: JournalEntry[] = [];
  const updatedSuppliers: Supplier[] = [];

  for (const supplier of suppliers) {
     const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
     const supplierPayments = shiftPayments.filter(p => p.supplierId === supplier.id);
     
     let calculatedBalance = 0;

     // Process Purchases
     supplierPurchases.forEach(txn => {
        // Assume historical entries that don't have amount were recorded improperly, but we try our best.
        // If amount exists, use it, else qty * purchasePrice
        const purchaseVal = txn.amount !== undefined ? txn.amount : (txn.quantity * (txn.purchasePrice || 0));
        const totalBill = purchaseVal + (txn.carriageCost || 0);

        if (totalBill > 0) {
           calculatedBalance += totalBill;
           
           // Only generate a journal entry if it hasn't been generated before (idempotency check)
           const existing = financialStore.journalEntries.find(j => j.referenceId === txn.id && j.type === 'credit' && j.partyType === 'supplier');
           if (!existing) {
              newJournalEntries.push({
                 id: `jr_pur_mig_${txn.id}`,
                 date: txn.date + 'T00:00:00.000Z',
                 partyId: supplier.id,
                 partyType: 'supplier',
                 partyName: supplier.name,
                 type: 'credit',
                 amount: totalBill,
                 description: `[MIGRATED] Stock Purchase (${txn.fuelType || 'Item'}) - Inv: ${txn.invoiceNo || 'N/A'}`,
                 referenceId: txn.id,
                 orgId: orgId || undefined,
                 stationId: sId,
                 businessType: bType,
                 createdAt: Date.now(),
                 updatedAt: Date.now(),
                 isLocked: false
              });
           }
        }
     });

     // Process Payments
     supplierPayments.forEach(pmt => {
        calculatedBalance -= pmt.amount;
        
        const existing = financialStore.journalEntries.find(j => j.referenceId === pmt.id && j.type === 'debit' && j.partyType === 'supplier');
        if (!existing) {
           newJournalEntries.push({
              id: `jr_pay_mig_${pmt.id}`,
              date: new Date().toISOString(), // shift payments historically didn't have exact time in their object, use current or shift date if possible.
              partyId: supplier.id,
              partyType: 'supplier',
              partyName: supplier.name,
              type: 'debit',
              amount: pmt.amount,
              description: `[MIGRATED] Supplier Payment (Mode: ${pmt.mode})`,
              referenceId: pmt.id,
              orgId: orgId || undefined,
              stationId: sId,
              businessType: bType,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isLocked: false
           });
        }
     });

     updatedSuppliers.push({
        ...supplier,
        balance: calculatedBalance
     });
     // eslint-disable-next-line no-console
     console.log(`Supplier [${supplier.name}] balance recalculated: Rs. ${calculatedBalance}`);
  }

  // Save all to stores
  if (newJournalEntries.length > 0) {
     financialStore.setJournalEntries([...newJournalEntries, ...financialStore.journalEntries]);
     newJournalEntries.forEach(entry => {
        if (orgId) {
           firestoreDb.saveDocument(orgId, sId, bType, 'journalEntries', entry.id, entry).catch(() => { /* empty */ });
        }
     });
  }

  updatedSuppliers.forEach(us => {
     supplierStore.handleUpdateSupplier(us, orgId, sId);
  });

  localStorage.setItem(migrationKey, 'true');
  // eslint-disable-next-line no-console
  console.log('--- ACCOUNTS PAYABLE MIGRATION COMPLETED SUCCESSFULLY ---');
};
