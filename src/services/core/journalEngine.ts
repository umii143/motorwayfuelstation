/**
 * FuelPro EOC — Journal Engine
 * Immutable double-entry accounting system.
 * RULE: Entries are NEVER deleted. Corrections use reversalEngine.
 * Powered by Umar Ali ⚡
 */

import { JournalEntry } from '../../types';
import { db } from '../../data/db';

// ─── Account Chart ────────────────────────────────────────────────────────────

export type ChartOfAccount =
  | 'accounts_receivable'   // Customer owes us
  | 'accounts_payable'      // We owe supplier
  | 'cash_drawer'           // Physical cash in shift
  | 'main_safe'             // Owner safe
  | 'bank'                  // Bank accounts
  | 'digital_wallet'        // JazzCash / EasyPaisa / POS
  | 'fuel_revenue'          // Fuel sales income
  | 'lube_revenue'          // Lubricant sales income
  | 'discount_expense'      // Discounts given
  | 'operating_expense'     // General expenses
  | 'salary_expense'        // Staff salaries
  | 'owner_equity'          // Owner drawings
  | 'fuel_inventory'        // Tank stock value
  | 'lube_inventory';       // Lube stock value

export type JournalEntryStatus = 'draft' | 'posted' | 'locked' | 'reversed' | 'archived';

export interface JournalLine {
  account: ChartOfAccount;
  partyId?: string;
  partyType?: JournalEntry['partyType'];
  partyName?: string;
  amount: number;
  type: 'debit' | 'credit';
}

export interface JournalPair {
  debitEntry: JournalEntry;
  creditEntry: JournalEntry;
  txnId: string;
}

export interface TxnMeta {
  txnId: string;          // EOCTransaction.id
  shiftId: string;
  stationId: string;
  branchId: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

// ─── Double-Entry Map ─────────────────────────────────────────────────────────

export const JOURNAL_RULES: Record<string, { dr: ChartOfAccount; cr: ChartOfAccount }> = {
  credit_sale:       { dr: 'accounts_receivable', cr: 'fuel_revenue' },
  recovery:          { dr: 'cash_drawer',          cr: 'accounts_receivable' },
  cash_expense:      { dr: 'operating_expense',    cr: 'cash_drawer' },
  bank_expense:      { dr: 'operating_expense',    cr: 'bank' },
  salary_expense:    { dr: 'salary_expense',       cr: 'cash_drawer' },
  bank_deposit:      { dr: 'bank',                 cr: 'cash_drawer' },
  digital_payment:   { dr: 'digital_wallet',       cr: 'cash_drawer' },
  supplier_payment:  { dr: 'accounts_payable',     cr: 'cash_drawer' },
  discount:          { dr: 'discount_expense',     cr: 'fuel_revenue' },
  lube_sale:         { dr: 'cash_drawer',           cr: 'lube_revenue' },
  owner_drawing:     { dr: 'owner_equity',          cr: 'cash_drawer' },
  fuel_inventory_in: { dr: 'fuel_inventory',        cr: 'accounts_payable' },
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Creates a double-entry journal pair (DR + CR) atomically.
 * Both entries share the same txnId for reconciliation.
 */
export async function createDoubleEntry(
  drLine: JournalLine,
  crLine: JournalLine,
  meta: TxnMeta
): Promise<JournalPair> {
  if (Math.abs(drLine.amount - crLine.amount) > 0.001) {
    throw new Error(`[JournalEngine] Journal imbalance: DR ${drLine.amount} ≠ CR ${crLine.amount} for txn ${meta.txnId}`);
  }

  const now = meta.timestamp || new Date().toISOString();

  const debitEntry: JournalEntry = {
    id: `j_dr_${meta.txnId}`,
    date: now,
    partyId: drLine.partyId,
    partyType: drLine.partyType,
    partyName: drLine.partyName,
    type: 'debit',
    amount: drLine.amount,
    description: `DR | ${meta.description}`,
    referenceId: meta.txnId,
    stationId: meta.stationId,
    isLocked: false,
  };

  const creditEntry: JournalEntry = {
    id: `j_cr_${meta.txnId}`,
    date: now,
    partyId: crLine.partyId,
    partyType: crLine.partyType,
    partyName: crLine.partyName,
    type: 'credit',
    amount: crLine.amount,
    description: `CR | ${meta.description}`,
    referenceId: meta.txnId,
    stationId: meta.stationId,
    isLocked: false,
  };

  // Persist to existing journal entries store
  await _saveJournalEntries(meta.stationId, [debitEntry, creditEntry]);

  return { debitEntry, creditEntry, txnId: meta.txnId };
}

/**
 * Post a journal entry (draft → posted). Once posted, it cannot be modified.
 * Posting is automatic after createDoubleEntry in the current local-first model.
 */
export async function lockJournalEntry(journalId: string, stationId: string): Promise<void> {
  const entries = await getAllJournalEntries(stationId);
  const updated = entries.map(e =>
    e.id === journalId ? { ...e, isLocked: true } : e
  );
  _persistJournalEntries(stationId, updated);
}

/**
 * Lock all journal entries belonging to a shift.
 */
export async function lockShiftJournals(shiftId: string, stationId: string): Promise<void> {
  const entries = await getAllJournalEntries(stationId);
  const updated = entries.map(e =>
    e.referenceId === shiftId || e.referenceId?.startsWith(shiftId)
      ? { ...e, isLocked: true }
      : e
  );
  _persistJournalEntries(stationId, updated);
}

/**
 * Retrieve all journal entries for a specific shift.
 */
export async function getJournalByShift(shiftId: string, stationId: string): Promise<JournalEntry[]> {
  const all = await getAllJournalEntries(stationId);
  return all.filter(e => e.referenceId === shiftId || e.referenceId?.startsWith(`${shiftId}_`));
}

/**
 * Retrieve all journal entries for a specific transaction.
 */
export async function getJournalByTxn(txnId: string, stationId: string): Promise<JournalEntry[]> {
  const all = await getAllJournalEntries(stationId);
  return all.filter(e => e.referenceId === txnId || e.id.includes(txnId));
}

/**
 * Validate that journal entries for a shift are balanced (ΣDR === ΣCR).
 */
export async function validateJournalBalance(shiftId: string, stationId: string): Promise<{
  balanced: boolean;
  totalDr: number;
  totalCr: number;
  variance: number;
}> {
  const entries = await getJournalByShift(shiftId, stationId);
  const totalDr = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCr = entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const variance = Math.abs(totalDr - totalCr);
  return { balanced: variance < 0.01, totalDr, totalCr, variance };
}

/**
 * Get running balance for a party (customer/supplier) from journal history.
 */
export async function getRunningBalance(
  partyId: string,
  partyType: JournalEntry['partyType'],
  stationId: string
): Promise<number> {
  const all = await getAllJournalEntries(stationId);
  const partyEntries = all.filter(e => e.partyId === partyId && e.partyType === partyType);
  return partyEntries.reduce((balance, e) => {
    return e.type === 'debit' ? balance + e.amount : balance - e.amount;
  }, 0);
}

/**
 * Get all journal entries for a station, sorted by date ascending.
 */
export async function getAllJournalEntries(stationId: string): Promise<JournalEntry[]> {
  const raw = localStorage.getItem(`fuelpro_journal_entries_${stationId}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.sort((a, b) => a.date.localeCompare(b.date)) : [];
  } catch {
    return [];
  }
}

// ─── Internal Storage ─────────────────────────────────────────────────────────

async function _saveJournalEntries(stationId: string, newEntries: JournalEntry[]): Promise<void> {
  const existing = await getAllJournalEntries(stationId);
  const existingIds = new Set(existing.map(e => e.id));
  const toAdd = newEntries.filter(e => !existingIds.has(e.id));
  _persistJournalEntries(stationId, [...existing, ...toAdd]);
}

function _persistJournalEntries(stationId: string, entries: JournalEntry[]): void {
  localStorage.setItem(`fuelpro_journal_entries_${stationId}`, JSON.stringify(entries));
}
