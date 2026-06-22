/**
 * FuelPro EOC — Reversal Engine
 * Enterprise rule: NEVER delete a journal entry.
 * Every correction creates an opposing reversal entry.
 * Powered by Umar Ali ⚡
 */

import { createDoubleEntry, getAllJournalEntries, TxnMeta } from './journalEngine';
import { JournalEntry } from '../../types';
import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReversalEntry {
  id: string;
  originalTxnId: string;
  originalJournalIds: string[];   // The DR and CR journal IDs being reversed
  reversalJournalIds: string[];   // The new reversal DR and CR IDs
  reason: string;
  reversedBy: string;
  reversedAt: string;
  shiftId: string;
  stationId: string;
  branchId: string;
  originalAmount: number;
  status: 'active' | 'voided';
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const _reversalsKey = (stationId: string) => `fuelpro_reversals_${stationId}`;

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Reverse a complete transaction by its txnId.
 * Finds the original DR+CR journal pair and creates opposing entries.
 * Original entries are marked as 'reversed' (never deleted).
 */
export async function reverseTransaction(
  originalTxnId: string,
  reason: string,
  reversedBy: string,
  stationId: string,
  branchId: string,
  shiftId: string
): Promise<ReversalEntry> {
  // Find original journal entries
  const allJournals = await getAllJournalEntries(stationId);
  const originals = allJournals.filter(j => j.id.includes(originalTxnId));

  if (originals.length === 0) {
    throw new Error(`[ReversalEngine] No journal entries found for txn: ${originalTxnId}`);
  }

  // Check none are already locked (period closed)
  const locked = originals.find(j => j.isLocked);
  if (locked) {
    throw new Error(`[ReversalEngine] Cannot reverse — journal ${locked.id} is locked in a closed period.`);
  }

  const originalDr = originals.find(j => j.type === 'debit');
  const originalCr = originals.find(j => j.type === 'credit');

  if (!originalDr || !originalCr) {
    throw new Error(`[ReversalEngine] Incomplete journal pair for txn: ${originalTxnId}`);
  }

  const reversalTxnId = `rev_${originalTxnId}_${Date.now()}`;
  const now = new Date().toISOString();

  const meta: TxnMeta = {
    txnId: reversalTxnId,
    shiftId,
    stationId,
    branchId,
    description: `REVERSAL of ${originalTxnId} — ${reason}`,
    performedBy: reversedBy,
    timestamp: now,
  };

  // Create the reversal: swap DR → CR and CR → DR
  const reversalPair = await createDoubleEntry(
    {
      account: originalCr.description.split(' | ')[1] as any,  // Swap: original CR becomes DR
      partyId: originalCr.partyId,
      partyType: originalCr.partyType,
      partyName: originalCr.partyName,
      amount: originalCr.amount,
      type: 'debit',
    },
    {
      account: originalDr.description.split(' | ')[1] as any,  // Swap: original DR becomes CR
      partyId: originalDr.partyId,
      partyType: originalDr.partyType,
      partyName: originalDr.partyName,
      amount: originalDr.amount,
      type: 'credit',
    },
    meta
  );

  // Mark originals as reversed (in-place update, NOT delete)
  await _markJournalsAsReversed(stationId, originals.map(j => j.id), reversalTxnId);

  // Store reversal record
  const reversalRecord: ReversalEntry = {
    id: reversalTxnId,
    originalTxnId,
    originalJournalIds: originals.map(j => j.id),
    reversalJournalIds: [reversalPair.debitEntry.id, reversalPair.creditEntry.id],
    reason,
    reversedBy,
    reversedAt: now,
    shiftId,
    stationId,
    branchId,
    originalAmount: originalDr.amount,
    status: 'active',
  };

  await _saveReversalRecord(stationId, reversalRecord);

  return reversalRecord;
}

/**
 * Reverse directly from raw journal IDs (for multi-journal transactions).
 */
export async function reverseJournalPair(
  drJournalId: string,
  crJournalId: string,
  reason: string,
  reversedBy: string,
  meta: TxnMeta
): Promise<ReversalEntry> {
  const allJournals = await getAllJournalEntries(meta.stationId);
  const drEntry = allJournals.find(j => j.id === drJournalId);
  const crEntry = allJournals.find(j => j.id === crJournalId);

  if (!drEntry || !crEntry) {
    throw new Error(`[ReversalEngine] Journal entries not found: ${drJournalId}, ${crJournalId}`);
  }

  if (drEntry.isLocked || crEntry.isLocked) {
    throw new Error(`[ReversalEngine] Cannot reverse locked journal entries in a closed period.`);
  }

  const reversalPair = await createDoubleEntry(
    { account: 'cash_drawer', partyId: crEntry.partyId, partyType: crEntry.partyType, partyName: crEntry.partyName, amount: crEntry.amount, type: 'debit' },
    { account: 'accounts_receivable', partyId: drEntry.partyId, partyType: drEntry.partyType, partyName: drEntry.partyName, amount: drEntry.amount, type: 'credit' },
    { ...meta, description: `REVERSAL — ${reason}` }
  );

  await _markJournalsAsReversed(meta.stationId, [drJournalId, crJournalId], meta.txnId);

  const record: ReversalEntry = {
    id: meta.txnId,
    originalTxnId: drEntry.referenceId || drJournalId,
    originalJournalIds: [drJournalId, crJournalId],
    reversalJournalIds: [reversalPair.debitEntry.id, reversalPair.creditEntry.id],
    reason,
    reversedBy,
    reversedAt: meta.timestamp,
    shiftId: meta.shiftId,
    stationId: meta.stationId,
    branchId: meta.branchId,
    originalAmount: drEntry.amount,
    status: 'active',
  };

  await _saveReversalRecord(meta.stationId, record);
  return record;
}

/** Get all reversal history for a shift. */
export async function getReversalHistory(
  shiftId: string,
  stationId: string
): Promise<ReversalEntry[]> {
  const all = await _getAllReversals(stationId);
  return all.filter(r => r.shiftId === shiftId);
}

/** Get all reversals for a station. */
export async function getAllReversals(stationId: string): Promise<ReversalEntry[]> {
  return _getAllReversals(stationId);
}

/** Count reversals in a shift (used by fraudEngine). */
export async function countShiftReversals(shiftId: string, stationId: string): Promise<number> {
  const history = await getReversalHistory(shiftId, stationId);
  return history.length;
}

// ─── Internal ──────────────────────────────────────────────────────────────────

async function _markJournalsAsReversed(
  stationId: string,
  journalIds: string[],
  reversalTxnId: string
): Promise<void> {
  const key = `fuelpro_journal_entries_${stationId}`;
  const raw = await safeGetItem(key);
  if (!raw) return;
  const entries: JournalEntry[] = JSON.parse(raw);
  const updated = entries.map(e =>
    journalIds.includes(e.id)
      ? { ...e, description: `[REVERSED by ${reversalTxnId}] ${e.description}`, isLocked: true }
      : e
  );
  await safeSetItem(key, JSON.stringify(updated));
}

async function _getAllReversals(stationId: string): Promise<ReversalEntry[]> {
  const raw = await safeGetItem(_reversalsKey(stationId));
  if (!raw) return [];
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

async function _saveReversalRecord(stationId: string, record: ReversalEntry): Promise<void> {
  const all = await _getAllReversals(stationId);
  all.push(record);
  await safeSetItem(_reversalsKey(stationId), JSON.stringify(all));
}
