import { Shift } from '../../types';
import { useCustomerStore } from '../../stores/useCustomerStore';
import { useSupplierStore } from '../../stores/useSupplierStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useFinancialStore } from '../../stores/useFinancialStore';
import {
  processCreditSale,
  processRecovery,
  processSupplierPayment,
  processBankDeposit,
  processDigitalPayment,
  processDiscount,
  processExpense,
  processShiftOpen,
  processShiftClose
} from './operationalCore';
import { getAllCustomerBalances, getAllSupplierBalances } from './ledgerEngine';
import { getTreasuryBalance } from './treasuryEngine';
import { useStationStore } from '../../stores/useStationStore';
import {
  addDriftLog,
  classifyDriftSeverity,
  updateShadowStats
} from './integrityDriftLog';

/**
 * Executes Operational Core transactions in the background for Phase 2: Shadow Mode Validation.
 * This ensures the new Core can handle all shift events simultaneously without affecting the UI.
 * Powered by Umar Ali ⚡
 */
export async function dispatchShiftToOperationalCore(
  shift: Shift,
  stationId: string,
  branchId: string = 'default',
  _orgId?: string
) {
  try {
    const customers = useCustomerStore.getState().customers;
    const suppliers = useSupplierStore.getState().suppliers;
    const products = useInventoryStore.getState().products;
    const banks = useFinancialStore.getState().banks;
    const nozzles = useInventoryStore.getState().nozzles;

    // eslint-disable-next-line no-console
    console.log(`[Shadow Mode] Shift #${shift.id} Validation Phase Completed.`);

    const date = shift.date;

    // 1. Shift Open
    await processShiftOpen(shift.id, stationId, branchId, date);

    // 2. Credit Sales
    for (const d of shift.debitEntries || []) {
      const customer = customers.find((c) => c.id === d.customerId);
      const product = products.find((p) => p.id === d.productId);
      if (customer && product) {
        await processCreditSale(shift.id, stationId, branchId, {
          customerId: d.customerId,
          customerName: customer.name,
          productId: d.productId,
          productName: product.name,
          quantity: d.quantity,
          rate: d.rate,
          amount: d.amount,
          note: d.note || ''
        }, date);
      }
    }

    // 3. Recoveries
    for (const r of shift.recoveryEntries || []) {
      const customer = customers.find((c) => c.id === r.customerId);
      if (customer) {
        await processRecovery(shift.id, stationId, branchId, {
          customerId: r.customerId,
          customerName: customer.name,
          amount: r.amount,
          mode: r.mode,
          reference: r.reference || ''
        }, date);
      }
    }

    // 4. Supplier Payments
    for (const sp of shift.supplierPayments || []) {
      const supplier = suppliers.find((s) => s.id === sp.supplierId);
      if (supplier) {
        await processSupplierPayment(shift.id, stationId, branchId, {
          supplierId: sp.supplierId,
          supplierName: supplier.name,
          amount: sp.amount,
          mode: sp.mode === 'cash' ? 'cash' : 'transfer',
          bankAccountId: sp.bankAccountId,
          reference: sp.reference || ''
        }, date);
      }
    }

    // 5. Bank Deposits
    for (const bd of shift.bankCashEntries || []) {
      const bank = banks.find((b) => b.id === bd.bankAccountId);
      if (bank) {
        await processBankDeposit(shift.id, stationId, branchId, {
          bankAccountId: bd.bankAccountId,
          bankName: bank.name,
          amount: bd.amount,
          reference: bd.reference || ''
        }, date);
      }
    }

    // 6. Digital Payments
    for (const dp of shift.digitalCashEntries || []) {
      const method = dp.method === 'jazzcash' || dp.method === 'easypaisa' || dp.method === 'pos'
        ? dp.method
        : 'pos';
      await processDigitalPayment(shift.id, stationId, branchId, {
        method,
        amount: dp.amount,
        transactionId: dp.transactionId || '',
        accountHolder: dp.accountHolder || ''
      }, date);
    }

    // 7. Discounts
    for (const ds of shift.discountEntries || []) {
      await processDiscount(shift.id, stationId, branchId, {
        customerName: ds.customerName,
        amount: ds.amount,
        type: ds.type as 'cash' | 'volume',
        reason: ds.reason,
        approvedBy: ds.approvedBy || 'system',
        productId: ds.productId
      }, date);
    }

    // 9. Expenses
    for (const exp of shift.expenseEntries || []) {
      await processExpense(shift.id, stationId, branchId, {
        category: exp.category || 'Uncategorized',
        amount: exp.amount,
        description: exp.description || 'Shift Expense',
        paidFrom: 'shift_cash'
      }, date);
    }

    // 10. Shift Close
    await processShiftClose(shift, stationId, branchId, nozzles, products);

    // Phase 3: Parallel Verification with full Drift Log
    await compareLegacyVsOperationalCore(stationId, shift.id);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[Shadow Mode] Operational Core Pipeline Failed for Shift #${shift.id}:`, error);
  }
}

/**
 * Phase 3: Parallel Verification & Integrity Center Integration.
 * Compares Legacy State vs Operational Core balances.
 * Writes all mismatches to the IntegrityDriftLog (immutable).
 */
export async function compareLegacyVsOperationalCore(stationId: string, shiftId: string = 'manual') {
  try {
    const showToast = useStationStore.getState().showToast;
    const legacyCustomers = useCustomerStore.getState().customers;
    const legacySuppliers = useSupplierStore.getState().suppliers;
    const legacyBanks = useFinancialStore.getState().banks;

    const newCustomerBals = await getAllCustomerBalances(stationId);
    const newSupplierBals = await getAllSupplierBalances(stationId);

    let hasMismatch = false;
    let criticalFound = false;

    // ── 1. Customer Balances ────────────────────────────────────────────────
    for (const c of legacyCustomers) {
      const legacyBal = Math.round((c.balance || 0) * 100) / 100;
      const newBal = Math.round((newCustomerBals[c.id] || 0) * 100) / 100;
      const diff = Math.abs(legacyBal - newBal);
      if (diff > 0.05) {
        hasMismatch = true;
        const severity = classifyDriftSeverity('customer', diff);
        addDriftLog(stationId, {
          shiftId,
          timestamp: new Date().toISOString(),
          module: 'customer',
          legacyValue: legacyBal,
          operationalValue: newBal,
          difference: diff,
          severity,
          stationId,
          description: `Customer "${c.name}" balance mismatch: Legacy PKR ${legacyBal.toLocaleString()} vs EOC PKR ${newBal.toLocaleString()}`,
        });
        if (severity === 'CRITICAL') criticalFound = true;
      }
    }

    // ── 2. Supplier Balances ────────────────────────────────────────────────
    for (const s of legacySuppliers) {
      const legacyBal = Math.round((s.balance || 0) * 100) / 100;
      const newBal = Math.round((newSupplierBals[s.id] || 0) * 100) / 100;
      const diff = Math.abs(legacyBal - newBal);
      if (diff > 0.05) {
        hasMismatch = true;
        const severity = classifyDriftSeverity('supplier', diff);
        addDriftLog(stationId, {
          shiftId,
          timestamp: new Date().toISOString(),
          module: 'supplier',
          legacyValue: legacyBal,
          operationalValue: newBal,
          difference: diff,
          severity,
          stationId,
          description: `Supplier "${s.name}" balance mismatch: Legacy PKR ${legacyBal.toLocaleString()} vs EOC PKR ${newBal.toLocaleString()}`,
        });
        if (severity === 'CRITICAL') criticalFound = true;
      }
    }

    // ── 3. Bank Balances ────────────────────────────────────────────────────
    for (const b of legacyBanks) {
      const legacyBal = Math.round((b.balance || 0) * 100) / 100;
      const eocBal = await getTreasuryBalance(stationId, b.id as any);
      const roundedEocBal = Math.round((eocBal || 0) * 100) / 100;
      const diff = Math.abs(legacyBal - roundedEocBal);
      if (diff > 0.05) {
        hasMismatch = true;
        const severity = classifyDriftSeverity('bank', diff);
        addDriftLog(stationId, {
          shiftId,
          timestamp: new Date().toISOString(),
          module: 'bank',
          legacyValue: legacyBal,
          operationalValue: roundedEocBal,
          difference: diff,
          severity,
          stationId,
          description: `Bank "${b.name}" balance mismatch: Legacy PKR ${legacyBal.toLocaleString()} vs EOC PKR ${roundedEocBal.toLocaleString()}`,
        });
        criticalFound = true; // Bank drift is always CRITICAL
      }
    }

    // ── Update Shadow Stats ─────────────────────────────────────────────────
    updateShadowStats(stationId, !hasMismatch);

    if (hasMismatch) {
      const msg = criticalFound
        ? `🚨 CRITICAL Integrity Alert: Financial drift detected! Open Integrity Center immediately.`
        : `⚠️ Integrity Warning: Minor drift detected. Review in Integrity Center.`;
      console.warn('[INTEGRITY ALERT]', msg);
      showToast(msg, 'error');
    } else {
      console.log('[INTEGRITY CHECK] ✅ Passed. Legacy perfectly matches Operational Core.');
    }

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[Shadow Mode] Critical Error in shift #${shiftId}:`, error);
  }
}
