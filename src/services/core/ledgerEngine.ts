/**
 * FuelPro EOC — Ledger Engine
 * Independent running-balance ledgers per party type.
 * Every entry references a transactionId (Journal Entry ID).
 * Powered by Umar Ali ⚡
 */

import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerType =
  | 'customer'
  | 'supplier'
  | 'cash'
  | 'bank'
  | 'expense'
  | 'salary'
  | 'fuel_revaluation'
  | 'inventory';

export interface LedgerLine {
  id: string;
  ledgerType: LedgerType;
  partyId: string;          // customerId, supplierId, bankId, staffId, 'shift_cash', category, etc.
  partyName: string;
  txnId: string;            // EOCTransaction.id or JournalEntry.id
  journalId: string;        // The journal entry pair ID
  shiftId: string;
  stationId: string;
  branchId: string;
  date: string;
  description: string;
  drAmount: number;
  crAmount: number;
  runningBalance: number;   // Calculated and stored at post time
  isLocked: boolean;
  createdAt: string;
}

export interface LedgerSummary {
  stationId: string;
  generatedAt: string;
  customerReceivables: number;
  supplierPayables: number;
  cashOnHand: number;
  bankBalance: number;
  totalExpenses: number;
  totalSalaries: number;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

function _ledgerKey(stationId: string, ledgerType: LedgerType): string {
  return `fuelpro_ledger_${ledgerType}_${stationId}`;
}

// ─── Core Post Function ───────────────────────────────────────────────────────

/**
 * Post an entry to a specific ledger with running balance.
 */
export async function postToLedger(
  ledgerType: LedgerType,
  partyId: string,
  partyName: string,
  drAmount: number,
  crAmount: number,
  txnId: string,
  journalId: string,
  shiftId: string,
  stationId: string,
  branchId: string,
  description: string
): Promise<LedgerLine> {
  const existing = await getPartyLedger(ledgerType, partyId, stationId);
  const lastBalance = existing.length > 0 ? existing[existing.length - 1].runningBalance : 0;
  const runningBalance = lastBalance + drAmount - crAmount;

  const line: LedgerLine = {
    id: `ldg_${txnId}_${ledgerType}`,
    ledgerType,
    partyId,
    partyName,
    txnId,
    journalId,
    shiftId,
    stationId,
    branchId,
    date: new Date().toISOString(),
    description,
    drAmount,
    crAmount,
    runningBalance,
    isLocked: false,
    createdAt: new Date().toISOString(),
  };

  // Append to the ledger
  const allLines = await _getAllLedgerLines(stationId, ledgerType);
  allLines.push(line);
  await _persistLedger(stationId, ledgerType, allLines);

  return line;
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

/** Customer debit (credit sale increases receivable) */
export async function postCreditSaleToCustomerLedger(
  customerId: string, customerName: string,
  amount: number, txnId: string, journalId: string,
  shiftId: string, stationId: string, branchId: string
): Promise<LedgerLine> {
  return postToLedger('customer', customerId, customerName, amount, 0, txnId, journalId, shiftId, stationId, branchId, `Credit Sale — ${customerName}`);
}

/** Recovery credit (reduces receivable) */
export async function postRecoveryToCustomerLedger(
  customerId: string, customerName: string,
  amount: number, txnId: string, journalId: string,
  shiftId: string, stationId: string, branchId: string
): Promise<LedgerLine> {
  return postToLedger('customer', customerId, customerName, 0, amount, txnId, journalId, shiftId, stationId, branchId, `Recovery Received — ${customerName}`);
}

/** Supplier payment debit (reduces payable) */
export async function postPaymentToSupplierLedger(
  supplierId: string, supplierName: string,
  amount: number, txnId: string, journalId: string,
  shiftId: string, stationId: string, branchId: string
): Promise<LedgerLine> {
  return postToLedger('supplier', supplierId, supplierName, amount, 0, txnId, journalId, shiftId, stationId, branchId, `Supplier Payment — ${supplierName}`);
}

/** Expense posted to expense ledger */
export async function postToExpenseLedger(
  category: string,
  amount: number, txnId: string, journalId: string,
  shiftId: string, stationId: string, branchId: string,
  description: string
): Promise<LedgerLine> {
  return postToLedger('expense', category, category, amount, 0, txnId, journalId, shiftId, stationId, branchId, description);
}

/** Cash drawer: add to cash */
export async function postCashIn(
  accountId: string, amount: number, txnId: string, journalId: string,
  shiftId: string, stationId: string, branchId: string, description: string
): Promise<LedgerLine> {
  return postToLedger('cash', accountId, accountId, amount, 0, txnId, journalId, shiftId, stationId, branchId, description);
}

/** Cash drawer: deduct from cash */
export async function postCashOut(
  accountId: string, amount: number, txnId: string, journalId: string,
  shiftId: string, stationId: string, branchId: string, description: string
): Promise<LedgerLine> {
  return postToLedger('cash', accountId, accountId, 0, amount, txnId, journalId, shiftId, stationId, branchId, description);
}

// ─── Query Functions ──────────────────────────────────────────────────────────

/** Get all ledger entries for a specific party */
export async function getPartyLedger(
  ledgerType: LedgerType,
  partyId: string,
  stationId: string,
  fromDate?: string,
  toDate?: string
): Promise<LedgerLine[]> {
  const all = await _getAllLedgerLines(stationId, ledgerType);
  return all
    .filter(l => l.partyId === partyId)
    .filter(l => !fromDate || l.date >= fromDate)
    .filter(l => !toDate || l.date <= toDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Get running balance for a party */
export async function getPartyBalance(
  ledgerType: LedgerType,
  partyId: string,
  stationId: string
): Promise<number> {
  const lines = await getPartyLedger(ledgerType, partyId, stationId);
  if (lines.length === 0) return 0;
  return lines[lines.length - 1].runningBalance;
}

/** Get all customer receivable balances */
export async function getAllCustomerBalances(stationId: string): Promise<Record<string, number>> {
  const all = await _getAllLedgerLines(stationId, 'customer');
  const byParty: Record<string, LedgerLine[]> = { /* empty */ };
  all.forEach(l => {
    if (!byParty[l.partyId]) byParty[l.partyId] = [];
    byParty[l.partyId].push(l);
  });
  const result: Record<string, number> = { /* empty */ };
  Object.entries(byParty).forEach(([partyId, lines]) => {
    result[partyId] = lines[lines.length - 1]?.runningBalance ?? 0;
  });
  return result;
}

/** Get all supplier payable balances */
export async function getAllSupplierBalances(stationId: string): Promise<Record<string, number>> {
  const all = await _getAllLedgerLines(stationId, 'supplier');
  const byParty: Record<string, LedgerLine[]> = { /* empty */ };
  all.forEach(l => {
    if (!byParty[l.partyId]) byParty[l.partyId] = [];
    byParty[l.partyId].push(l);
  });
  const result: Record<string, number> = { /* empty */ };
  Object.entries(byParty).forEach(([partyId, lines]) => {
    result[partyId] = lines[lines.length - 1]?.runningBalance ?? 0;
  });
  return result;
}

/** Get consolidated ledger summary for station */
export async function getLedgerSummary(stationId: string): Promise<LedgerSummary> {
  const [customers, suppliers, cash, bank, expense, salary] = await Promise.all([
    _getAllLedgerLines(stationId, 'customer'),
    _getAllLedgerLines(stationId, 'supplier'),
    _getAllLedgerLines(stationId, 'cash'),
    _getAllLedgerLines(stationId, 'bank'),
    _getAllLedgerLines(stationId, 'expense'),
    _getAllLedgerLines(stationId, 'salary'),
  ]);

  const latestBalance = (lines: LedgerLine[], partyId?: string): number => {
    const filtered = partyId ? lines.filter(l => l.partyId === partyId) : lines;
    if (!filtered.length) return 0;
    return filtered[filtered.length - 1].runningBalance;
  };

  const sumAll = (lines: LedgerLine[]): number => {
    const parties = [...new Set(lines.map(l => l.partyId))];
    return parties.reduce((sum, pid) => sum + latestBalance(lines, pid), 0);
  };

  return {
    stationId,
    generatedAt: new Date().toISOString(),
    customerReceivables: sumAll(customers),
    supplierPayables: sumAll(suppliers),
    cashOnHand: sumAll(cash),
    bankBalance: sumAll(bank),
    totalExpenses: expense.reduce((s, l) => s + l.drAmount, 0),
    totalSalaries: salary.reduce((s, l) => s + l.drAmount, 0),
  };
}

/** Get all ledger lines for a specific shift */
export async function getLedgerByShift(shiftId: string, stationId: string): Promise<LedgerLine[]> {
  const types: LedgerType[] = ['customer', 'supplier', 'cash', 'bank', 'expense', 'salary', 'inventory'];
  const all = await Promise.all(types.map(t => _getAllLedgerLines(stationId, t)));
  return all.flat().filter(l => l.shiftId === shiftId).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

async function _getAllLedgerLines(stationId: string, ledgerType: LedgerType): Promise<LedgerLine[]> {
  const key = _ledgerKey(stationId, ledgerType);
  const raw = await safeGetItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function _persistLedger(stationId: string, ledgerType: LedgerType, lines: LedgerLine[]): Promise<void> {
  const key = _ledgerKey(stationId, ledgerType);
  await safeSetItem(key, JSON.stringify(lines));
}
