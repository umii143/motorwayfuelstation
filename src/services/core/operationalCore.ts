/**
 * FuelPro EOC — Operational Core
 * THE single entry point for all business events.
 * No UI component mutates data directly. Everything passes through here.
 *
 * Pipeline per transaction:
 *   1. Period Check (is the date in an open period?)
 *   2. Approval Check (does this need manager/owner approval?)
 *   3. Journal Engine (double-entry DR+CR)
 *   4. Ledger Engine (running balances per party)
 *   5. Treasury Engine (cash account movements)
 *   6. Audit Engine (operational timeline event)
 *   7. Event Bus (broadcast to all subscribers)
 *
 * Powered by Umar Ali ⚡
 */

import { Shift, Nozzle, Product } from '../../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createDoubleEntry, TxnMeta, JOURNAL_RULES, lockShiftJournals } from './journalEngine';
import {
  postCreditSaleToCustomerLedger,
  postRecoveryToCustomerLedger,
  postPaymentToSupplierLedger,
  postToExpenseLedger,
  postCashIn, postCashOut,
} from './ledgerEngine';
import { recordCashIn, recordCashOut, initTreasuryAccounts } from './treasuryEngine';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { checkApprovalRequirement, isTransactionApproved } from './approvalEngine';
import { reverseTransaction } from './reversalEngine';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { checkPeriodOpen, getOrCreatePeriod, PeriodLockedException } from './periodEngine';
import { reconcileShift } from './reconciliationEngine';
import { analyzeShiftRisk } from './fraudEngine';
import { computeIntegrityScore } from './integrityEngine';
import { createDailySnapshot } from './snapshotEngine';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { logShiftEvent, ShiftEventType } from './auditEngine';
import { eventBus, EOC_EVENTS } from './eventBus';
import { useAuthStore } from '../../stores/useAuthStore';
import { countShiftReversals } from './reversalEngine';
import { getPendingApprovals } from './approvalEngine';
import { safeGetItem, safeSetItem } from './coreStorage';

// ─── EOC Transaction ──────────────────────────────────────────────────────────

export type EOCTxnType =
  | 'credit_sale' | 'recovery' | 'expense' | 'bank_deposit'
  | 'digital_payment' | 'supplier_payment' | 'discount'
  | 'salary_payment' | 'owner_drawing';

export type TransactionStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'posted' | 'locked' | 'archived';

export interface EOCTransaction {
  id: string;
  type: EOCTxnType;
  status: TransactionStatus;
  shiftId: string;
  stationId: string;
  branchId: string;
  amount: number;
  payload: Record<string, unknown>;
  journalDrId?: string;
  journalCrId?: string;
  approvalRequestId?: string;
  createdBy: string;
  createdAt: string;
  postedAt?: string;
  reversedAt?: string;
  reversalId?: string;
  description: string;
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreditSalePayload { customerId: string; customerName: string; productId: string; productName: string; quantity: number; rate: number; amount: number; note: string; }
export interface RecoveryPayload { customerId: string; customerName: string; amount: number; mode: string; reference: string; }
export interface ExpensePayload { category: string; amount: number; description: string; paidFrom: 'shift_cash' | 'main_safe' | 'owner_cash' | 'bank'; staffId?: string; }
export interface BankDepositPayload { bankAccountId: string; bankName: string; amount: number; reference: string; }
export interface DigitalPaymentPayload { method: 'jazzcash' | 'easypaisa' | 'pos'; amount: number; transactionId: string; accountHolder: string; }
export interface SupplierPaymentPayload { supplierId: string; supplierName: string; amount: number; mode: 'cash' | 'transfer'; bankAccountId?: string; reference: string; }
export interface DiscountPayload { customerName: string; amount: number; type: 'cash' | 'volume'; reason: string; approvedBy: string; productId?: string; }

export interface ShiftClosePayload { submittedCash: number; expectedCash: number; shortage: number; overage: number; }

// ─── Transaction Registry ─────────────────────────────────────────────────────

const _txnKey = (stationId: string) => `fuelpro_eoc_transactions_${stationId}`;

async function _saveTxn(stationId: string, txn: EOCTransaction): Promise<void> {
  const raw = await safeGetItem(_txnKey(stationId));
  const all: EOCTransaction[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex(t => t.id === txn.id);
  if (idx !== -1) all[idx] = txn; else all.push(txn);
  await safeSetItem(_txnKey(stationId), JSON.stringify(all));
}

function _makeTxnId(type: EOCTxnType): string {
  return `eoc_${type}_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
}

function _getCurrentUser(): { name: string; role: string } {
  const u = useAuthStore.getState().user;
  return { name: u?.name ?? 'System', role: u?.role ?? 'system' };
}

// ─── 1. Credit Sale ───────────────────────────────────────────────────────────

export async function processCreditSale(
  shiftId: string, stationId: string, branchId: string,
  payload: CreditSalePayload, date: string
): Promise<EOCTransaction> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();
  const txnId = _makeTxnId('credit_sale');
  const now = new Date().toISOString();

  const meta: TxnMeta = { txnId, shiftId, stationId, branchId, description: `Credit Sale — ${payload.customerName} — ${payload.productName} ${payload.quantity}L`, performedBy: user.name, timestamp: now };

  // Journal: DR Accounts Receivable, CR Fuel Revenue
  const pair = await createDoubleEntry(
    { account: 'accounts_receivable', partyId: payload.customerId, partyType: 'customer', partyName: payload.customerName, amount: payload.amount, type: 'debit' },
    { account: 'fuel_revenue', partyId: shiftId, partyType: 'shift', partyName: 'Fuel Revenue', amount: payload.amount, type: 'credit' },
    meta
  );

  // Ledger: Customer receivable increases
  await postCreditSaleToCustomerLedger(payload.customerId, payload.customerName, payload.amount, txnId, pair.debitEntry.id, shiftId, stationId, branchId);

  // Audit
  await logShiftEvent('credit_sale', shiftId, stationId, branchId, `Credit Sale — ${payload.productName} ${payload.quantity}L`, { amount: payload.amount, partyName: payload.customerName, partyType: 'customer', txnId });

  const txn: EOCTransaction = { id: txnId, type: 'credit_sale', status: 'posted', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, journalDrId: pair.debitEntry.id, journalCrId: pair.creditEntry.id, createdBy: user.name, createdAt: now, postedAt: now, description: meta.description };
  await _saveTxn(stationId, txn);
  eventBus.emit(EOC_EVENTS.CREDIT_SALE_CREATED, { txnId, payload }, stationId, branchId, user.name, shiftId);
  return txn;
}

// ─── 2. Recovery ──────────────────────────────────────────────────────────────

export async function processRecovery(
  shiftId: string, stationId: string, branchId: string,
  payload: RecoveryPayload, date: string
): Promise<EOCTransaction> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();
  const txnId = _makeTxnId('recovery');
  const now = new Date().toISOString();

  const meta: TxnMeta = { txnId, shiftId, stationId, branchId, description: `Recovery — ${payload.customerName} — ${payload.mode}`, performedBy: user.name, timestamp: now };

  // Journal: DR Cash Drawer, CR Accounts Receivable
  const pair = await createDoubleEntry(
    { account: 'cash_drawer', partyId: 'shift_cash', partyType: 'shift', partyName: 'Cash Drawer', amount: payload.amount, type: 'debit' },
    { account: 'accounts_receivable', partyId: payload.customerId, partyType: 'customer', partyName: payload.customerName, amount: payload.amount, type: 'credit' },
    meta
  );

  // Ledger: Customer receivable decreases, Cash increases
  await postRecoveryToCustomerLedger(payload.customerId, payload.customerName, payload.amount, txnId, pair.creditEntry.id, shiftId, stationId, branchId);
  await postCashIn('shift_cash', payload.amount, txnId, pair.debitEntry.id, shiftId, stationId, branchId, `Recovery from ${payload.customerName}`);

  // Treasury
  await recordCashIn(stationId, 'cash_drawer', payload.amount, txnId, 'recovery', `Recovery — ${payload.customerName}`, user.name, shiftId);

  await logShiftEvent('recovery', shiftId, stationId, branchId, `Recovery Received — ${payload.customerName}`, { amount: payload.amount, partyName: payload.customerName, txnId });

  const txn: EOCTransaction = { id: txnId, type: 'recovery', status: 'posted', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, journalDrId: pair.debitEntry.id, journalCrId: pair.creditEntry.id, createdBy: user.name, createdAt: now, postedAt: now, description: meta.description };
  await _saveTxn(stationId, txn);
  eventBus.emit(EOC_EVENTS.RECOVERY_RECEIVED, { txnId, payload }, stationId, branchId, user.name, shiftId);
  return txn;
}

// ─── 3. Expense ───────────────────────────────────────────────────────────────

export async function processExpense(
  shiftId: string, stationId: string, branchId: string,
  payload: ExpensePayload, date: string
): Promise<EOCTransaction> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();
  const txnId = _makeTxnId('expense');
  const now = new Date().toISOString();

  // Approval check for large expenses
  const approvalDecision = await checkApprovalRequirement(stationId, branchId, 'expense', payload.amount, user.name, txnId);
  if (!approvalDecision.approved) {
    const pendingTxn: EOCTransaction = { id: txnId, type: 'expense', status: 'pending_approval', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, approvalRequestId: approvalDecision.request?.id, createdBy: user.name, createdAt: now, description: `Expense — ${payload.description}` };
    await _saveTxn(stationId, pendingTxn);
    eventBus.emit(EOC_EVENTS.APPROVAL_REQUESTED, { txnId, rule: approvalDecision.rule }, stationId, branchId, user.name, shiftId);
    return pendingTxn;
  }

  const meta: TxnMeta = { txnId, shiftId, stationId, branchId, description: `Expense — ${payload.description}`, performedBy: user.name, timestamp: now };
  const crAccount = payload.paidFrom === 'bank' ? 'bank' : 'cash_drawer';

  const pair = await createDoubleEntry(
    { account: payload.category === 'salary' ? 'salary_expense' : 'operating_expense', amount: payload.amount, type: 'debit' },
    { account: crAccount, partyId: payload.paidFrom, amount: payload.amount, type: 'credit' },
    meta
  );

  await postToExpenseLedger(payload.category, payload.amount, txnId, pair.debitEntry.id, shiftId, stationId, branchId, payload.description);
  await postCashOut(payload.paidFrom, payload.amount, txnId, pair.creditEntry.id, shiftId, stationId, branchId, `Expense: ${payload.description}`);
  await recordCashOut(stationId, payload.paidFrom as any, payload.amount, txnId, 'expense', `Expense: ${payload.description}`, user.name, shiftId);
  await logShiftEvent('expense', shiftId, stationId, branchId, `Expense — ${payload.description}`, { amount: payload.amount, txnId });

  const txn: EOCTransaction = { id: txnId, type: 'expense', status: 'posted', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, journalDrId: pair.debitEntry.id, journalCrId: pair.creditEntry.id, createdBy: user.name, createdAt: now, postedAt: now, description: meta.description };
  await _saveTxn(stationId, txn);
  eventBus.emit(EOC_EVENTS.EXPENSE_POSTED, { txnId, payload }, stationId, branchId, user.name, shiftId);
  return txn;
}

// ─── 4. Bank Deposit ─────────────────────────────────────────────────────────

export async function processBankDeposit(
  shiftId: string, stationId: string, branchId: string,
  payload: BankDepositPayload, date: string
): Promise<EOCTransaction> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();
  const txnId = _makeTxnId('bank_deposit');
  const now = new Date().toISOString();

  const meta: TxnMeta = { txnId, shiftId, stationId, branchId, description: `Bank Deposit — ${payload.bankName} — Ref: ${payload.reference}`, performedBy: user.name, timestamp: now };

  const pair = await createDoubleEntry(
    { account: 'bank', partyId: payload.bankAccountId, partyName: payload.bankName, amount: payload.amount, type: 'debit' },
    { account: 'cash_drawer', partyId: 'shift_cash', amount: payload.amount, type: 'credit' },
    meta
  );

  await postCashOut('shift_cash', payload.amount, txnId, pair.creditEntry.id, shiftId, stationId, branchId, `Bank Deposit to ${payload.bankName}`);
  await recordCashOut(stationId, 'cash_drawer', payload.amount, txnId, 'bank_deposit', `Bank Deposit — ${payload.bankName}`, user.name, shiftId);
  await recordCashIn(stationId, 'bank', payload.amount, txnId, 'bank_deposit', `Deposit from shift — Ref: ${payload.reference}`, user.name, shiftId);
  await logShiftEvent('bank_deposit', shiftId, stationId, branchId, `Bank Deposit — ${payload.bankName}`, { amount: payload.amount, txnId });

  const txn: EOCTransaction = { id: txnId, type: 'bank_deposit', status: 'posted', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, journalDrId: pair.debitEntry.id, journalCrId: pair.creditEntry.id, createdBy: user.name, createdAt: now, postedAt: now, description: meta.description };
  await _saveTxn(stationId, txn);
  eventBus.emit(EOC_EVENTS.BANK_DEPOSIT, { txnId, payload }, stationId, branchId, user.name, shiftId);
  return txn;
}

// ─── 5. Digital Payment ───────────────────────────────────────────────────────

export async function processDigitalPayment(
  shiftId: string, stationId: string, branchId: string,
  payload: DigitalPaymentPayload, date: string
): Promise<EOCTransaction> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();
  const txnId = _makeTxnId('digital_payment');
  const now = new Date().toISOString();
  const walletType = payload.method === 'jazzcash' ? 'jazzcash' : payload.method === 'easypaisa' ? 'easypaisa' : 'pos_terminal';

  const meta: TxnMeta = { txnId, shiftId, stationId, branchId, description: `Digital Payment — ${payload.method.toUpperCase()} — Ref: ${payload.transactionId}`, performedBy: user.name, timestamp: now };

  const pair = await createDoubleEntry(
    { account: 'digital_wallet', partyId: payload.method, partyName: payload.method, amount: payload.amount, type: 'debit' },
    { account: 'cash_drawer', partyId: 'shift_cash', amount: payload.amount, type: 'credit' },
    meta
  );

  await postCashOut('shift_cash', payload.amount, txnId, pair.creditEntry.id, shiftId, stationId, branchId, `Digital: ${payload.method}`);
  await recordCashOut(stationId, 'cash_drawer', payload.amount, txnId, 'digital', `${payload.method} payment`, user.name, shiftId);
  await recordCashIn(stationId, walletType as any, payload.amount, txnId, 'digital', `${payload.method} — ${payload.transactionId}`, user.name, shiftId);
  await logShiftEvent('digital_payment', shiftId, stationId, branchId, `Digital Payment — ${payload.method.toUpperCase()}`, { amount: payload.amount, txnId });

  const txn: EOCTransaction = { id: txnId, type: 'digital_payment', status: 'posted', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, journalDrId: pair.debitEntry.id, journalCrId: pair.creditEntry.id, createdBy: user.name, createdAt: now, postedAt: now, description: meta.description };
  await _saveTxn(stationId, txn);
  eventBus.emit(EOC_EVENTS.DIGITAL_PAYMENT, { txnId, payload }, stationId, branchId, user.name, shiftId);
  return txn;
}

// ─── 6. Supplier Payment ──────────────────────────────────────────────────────

export async function processSupplierPayment(
  shiftId: string, stationId: string, branchId: string,
  payload: SupplierPaymentPayload, date: string
): Promise<EOCTransaction> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();
  const txnId = _makeTxnId('supplier_payment');
  const now = new Date().toISOString();

  // APPROVAL GATE — supplier payments need manager/owner
  const approvalDecision = await checkApprovalRequirement(stationId, branchId, 'supplier_payment', payload.amount, user.name, txnId);
  if (!approvalDecision.approved) {
    const pendingTxn: EOCTransaction = { id: txnId, type: 'supplier_payment', status: 'pending_approval', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, approvalRequestId: approvalDecision.request?.id, createdBy: user.name, createdAt: now, description: `Supplier Payment — ${payload.supplierName}` };
    await _saveTxn(stationId, pendingTxn);
    eventBus.emit(EOC_EVENTS.APPROVAL_REQUESTED, { txnId, payload, rule: approvalDecision.rule, message: approvalDecision.message }, stationId, branchId, user.name, shiftId);
    return pendingTxn;
  }

  const meta: TxnMeta = { txnId, shiftId, stationId, branchId, description: `Supplier Payment — ${payload.supplierName} — Ref: ${payload.reference}`, performedBy: user.name, timestamp: now };
  const crAccount = payload.mode === 'transfer' ? 'bank' : 'cash_drawer';

  const pair = await createDoubleEntry(
    { account: 'accounts_payable', partyId: payload.supplierId, partyType: 'supplier', partyName: payload.supplierName, amount: payload.amount, type: 'debit' },
    { account: crAccount, amount: payload.amount, type: 'credit' },
    meta
  );

  await postPaymentToSupplierLedger(payload.supplierId, payload.supplierName, payload.amount, txnId, pair.debitEntry.id, shiftId, stationId, branchId);
  if (payload.mode === 'cash') {
    await postCashOut('shift_cash', payload.amount, txnId, pair.creditEntry.id, shiftId, stationId, branchId, `Supplier: ${payload.supplierName}`);
    await recordCashOut(stationId, 'cash_drawer', payload.amount, txnId, 'supplier_payment', `Supplier Payment — ${payload.supplierName}`, user.name, shiftId);
  }
  await logShiftEvent('supplier_payment', shiftId, stationId, branchId, `Supplier Payment — ${payload.supplierName}`, { amount: payload.amount, partyName: payload.supplierName, txnId });

  const txn: EOCTransaction = { id: txnId, type: 'supplier_payment', status: 'posted', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, journalDrId: pair.debitEntry.id, journalCrId: pair.creditEntry.id, createdBy: user.name, createdAt: now, postedAt: now, description: meta.description };
  await _saveTxn(stationId, txn);
  eventBus.emit(EOC_EVENTS.SUPPLIER_PAYMENT, { txnId, payload }, stationId, branchId, user.name, shiftId);
  return txn;
}

// ─── 7. Discount ──────────────────────────────────────────────────────────────

export async function processDiscount(
  shiftId: string, stationId: string, branchId: string,
  payload: DiscountPayload, date: string
): Promise<EOCTransaction> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();
  const txnId = _makeTxnId('discount');
  const now = new Date().toISOString();

  const approvalDecision = await checkApprovalRequirement(stationId, branchId, 'discount', payload.amount, user.name, txnId);
  if (!approvalDecision.approved) {
    const pendingTxn: EOCTransaction = { id: txnId, type: 'discount', status: 'pending_approval', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, approvalRequestId: approvalDecision.request?.id, createdBy: user.name, createdAt: now, description: `Discount — ${payload.customerName}` };
    await _saveTxn(stationId, pendingTxn);
    return pendingTxn;
  }

  const meta: TxnMeta = { txnId, shiftId, stationId, branchId, description: `Discount — ${payload.customerName} — ${payload.reason}`, performedBy: user.name, timestamp: now };

  const pair = await createDoubleEntry(
    { account: 'discount_expense', amount: payload.amount, type: 'debit' },
    { account: 'fuel_revenue', amount: payload.amount, type: 'credit' },
    meta
  );

  await logShiftEvent('discount', shiftId, stationId, branchId, `Discount — ${payload.customerName}`, { amount: payload.amount, partyName: payload.customerName, txnId });

  const txn: EOCTransaction = { id: txnId, type: 'discount', status: 'posted', shiftId, stationId, branchId, amount: payload.amount, payload: payload as any, journalDrId: pair.debitEntry.id, journalCrId: pair.creditEntry.id, createdBy: user.name, createdAt: now, postedAt: now, description: meta.description };
  await _saveTxn(stationId, txn);
  eventBus.emit(EOC_EVENTS.DISCOUNT_POSTED, { txnId, payload }, stationId, branchId, user.name, shiftId);
  return txn;
}


// ─── 9. Reverse Transaction ───────────────────────────────────────────────────

export async function processReversal(
  originalTxnId: string,
  reason: string,
  shiftId: string,
  stationId: string,
  branchId: string,
  date: string
): Promise<void> {
  await checkPeriodOpen(stationId, date);
  const user = _getCurrentUser();

  const reversal = await reverseTransaction(originalTxnId, reason, user.name, stationId, branchId, shiftId);

  // Mark original txn as archived
  const raw = await safeGetItem(_txnKey(stationId));
  if (raw) {
    const all: EOCTransaction[] = JSON.parse(raw);
    const idx = all.findIndex(t => t.id === originalTxnId);
    if (idx !== -1) {
      all[idx].status = 'archived';
      all[idx].reversedAt = new Date().toISOString();
      all[idx].reversalId = reversal.id;
      await safeSetItem(_txnKey(stationId), JSON.stringify(all));
    }
  }

  await logShiftEvent('credit_sale_reversed', shiftId, stationId, branchId, `Reversal — ${reason}`, { txnId: originalTxnId });
  eventBus.emit(EOC_EVENTS.CREDIT_SALE_REVERSED, { originalTxnId, reason, reversal }, stationId, branchId, user.name, shiftId);
}

// ─── 10. Shift Open ───────────────────────────────────────────────────────────

export async function processShiftOpen(
  shiftId: string, stationId: string, branchId: string, date: string
): Promise<void> {
  await checkPeriodOpen(stationId, date);
  await getOrCreatePeriod(stationId, date);
  await initTreasuryAccounts(stationId);
  const user = _getCurrentUser();
  await logShiftEvent('shift_opened', shiftId, stationId, branchId, 'Shift Opened', { performedBy: user.name });
  eventBus.emit(EOC_EVENTS.SHIFT_OPENED, { shiftId, date }, stationId, branchId, user.name, shiftId);
}

// ─── 11. Shift Close ─────────────────────────────────────────────────────────

export async function processShiftClose(
  shift: Shift,
  stationId: string,
  branchId: string,
  nozzles: Nozzle[],
  products: Product[]
): Promise<{
  reconciliationReport: ReturnType<typeof reconcileShift> extends Promise<infer T> ? T : never;
  riskScore: Awaited<ReturnType<typeof analyzeShiftRisk>>;
}> {
  const user = _getCurrentUser();

  // Lock all journals for this shift
  await lockShiftJournals(shift.id, stationId);

  // Reconciliation
  const [recon, reversals, pendingApprovals] = await Promise.all([
    reconcileShift(shift, nozzles, products, stationId),
    countShiftReversals(shift.id, stationId),
    getPendingApprovals(stationId),
  ]);

  // Fraud Analysis
  const riskScore = await analyzeShiftRisk(shift, stationId, reversals, user.name);

  // Integrity Score (daily)
  const date = shift.date;
  await computeIntegrityScore(stationId, date, [recon], {
    pendingApprovals: pendingApprovals.length,
    reversalCount: reversals,
  });

  // Daily snapshot on shift close
  await createDailySnapshot(stationId, user.name);

  await logShiftEvent('shift_closed', shift.id, stationId, branchId, `Shift Closed — Integrity Score: ${recon.integrityScore}`, { amount: shift.submittedCash, metadata: { integrityScore: recon.integrityScore, riskScore: riskScore.score } });
  eventBus.emit(EOC_EVENTS.SHIFT_CLOSED, { shift, recon, riskScore }, stationId, branchId, user.name, shift.id);

  return { reconciliationReport: recon as any, riskScore };
}

// ─── Query ────────────────────────────────────────────────────────────────────

/** Get all EOC transactions for a shift. */
export async function getShiftTransactions(shiftId: string, stationId: string): Promise<EOCTransaction[]> {
  const raw = await safeGetItem(_txnKey(stationId));
  if (!raw) return [];
  const all: EOCTransaction[] = JSON.parse(raw);
  return all.filter(t => t.shiftId === shiftId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Get all pending transactions (pending approval). */
export async function getPendingTransactions(stationId: string): Promise<EOCTransaction[]> {
  const raw = await safeGetItem(_txnKey(stationId));
  if (!raw) return [];
  const all: EOCTransaction[] = JSON.parse(raw);
  return all.filter(t => t.status === 'pending_approval');
}
