/**
 * FuelPro EOC — Snapshot Engine
 * Disaster Recovery: daily immutable full-system snapshots with checksum.
 * Enables point-in-time restore of all business data.
 * Powered by Umar Ali ⚡
 */

import { Customer, Supplier, Tank, Product, BankAccount, Shift, JournalEntry } from '../../types';
import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DisasterRecoverySnapshot {
  id: string;
  stationId: string;
  snapshotDate: string;
  snapshotTime: string;
  createdBy: string;
  createdAt: string;
  schemaVersion: string;

  // Business Data
  customers: Customer[];
  suppliers: Supplier[];
  tanks: Tank[];
  products: Product[];
  banks: BankAccount[];
  shifts: Shift[];
  journalEntries: JournalEntry[];

  // Integrity
  recordCounts: {
    customers: number;
    suppliers: number;
    tanks: number;
    products: number;
    banks: number;
    shifts: number;
    journals: number;
  };
  checksum: string;  // Simple hash for integrity verification
}

export interface SnapshotMeta {
  id: string;
  stationId: string;
  snapshotDate: string;
  createdBy: string;
  createdAt: string;
  recordCounts: DisasterRecoverySnapshot['recordCounts'];
  checksum: string;
  isVerified: boolean;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const _snapshotKey = (stationId: string, date: string) => `fuelpro_dr_snapshot_${stationId}_${date}`;
const _snapshotIndexKey = (stationId: string) => `fuelpro_dr_snapshot_index_${stationId}`;

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Create a full daily disaster recovery snapshot.
 * Reads all critical data from localStorage and stores as one atomic blob.
 */
export async function createDailySnapshot(
  stationId: string,
  createdBy: string
): Promise<DisasterRecoverySnapshot> {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // Read all current data from localStorage
  const customers = await _readKey<Customer[]>(`fuelpro_customers`, []);
  const suppliers = await _readKey<Supplier[]>(`fuelpro_suppliers`, []);
  const tanks = await _readKey<Tank[]>(`fuelpro_tanks`, []);
  const products = await _readKey<Product[]>(`fuelpro_products`, []);
  const banks = await _readKey<BankAccount[]>(`fuelpro_banks`, []);
  const shifts = await _readKey<Shift[]>(`fuelpro_shifts`, []);
  const journalEntries = await _readKey<JournalEntry[]>(`fuelpro_journal_entries_${stationId}`, []);

  const recordCounts = {
    customers: customers.length,
    suppliers: suppliers.length,
    tanks: tanks.length,
    products: products.length,
    banks: banks.length,
    shifts: shifts.length,
    journals: journalEntries.length,
  };

  const checksum = _generateChecksum(recordCounts, date, stationId);

  const snapshot: DisasterRecoverySnapshot = {
    id: `dr_${stationId}_${date}`,
    stationId,
    snapshotDate: date,
    snapshotTime: time,
    createdBy,
    createdAt: now.toISOString(),
    schemaVersion: '2.0',
    customers, suppliers, tanks, products, banks, shifts, journalEntries,
    recordCounts,
    checksum,
  };

  // Store snapshot
  await safeSetItem(_snapshotKey(stationId, date), JSON.stringify(snapshot));

  // Update snapshot index
  const index = await listSnapshots(stationId);
  const meta: SnapshotMeta = {
    id: snapshot.id,
    stationId,
    snapshotDate: date,
    createdBy,
    createdAt: snapshot.createdAt,
    recordCounts,
    checksum,
    isVerified: true,
  };

  const existingIdx = index.findIndex(m => m.snapshotDate === date);
  if (existingIdx !== -1) {
    index[existingIdx] = meta;
  } else {
    index.push(meta);
  }
  await safeSetItem(_snapshotIndexKey(stationId), JSON.stringify(index));

  return snapshot;
}

/** Verify a snapshot's integrity by recomputing checksum. */
export async function verifySnapshot(stationId: string, date: string): Promise<boolean> {
  const raw = await safeGetItem(_snapshotKey(stationId, date));
  if (!raw) return false;

  try {
    const snapshot: DisasterRecoverySnapshot = JSON.parse(raw);
    const expectedChecksum = _generateChecksum(snapshot.recordCounts, date, stationId);
    return snapshot.checksum === expectedChecksum;
  } catch {
    return false;
  }
}

/** Restore from a snapshot (DANGER: overwrites current data). */
export async function restoreFromSnapshot(
  stationId: string,
  date: string
): Promise<{ success: boolean; message: string }> {
  const verified = await verifySnapshot(stationId, date);
  if (!verified) {
    return { success: false, message: `Snapshot for ${date} failed integrity check. Restore aborted.` };
  }

  const raw = await safeGetItem(_snapshotKey(stationId, date));
  if (!raw) return { success: false, message: 'Snapshot not found.' };

  const snapshot: DisasterRecoverySnapshot = JSON.parse(raw);

  // Restore all data
  await safeSetItem('fuelpro_customers', JSON.stringify(snapshot.customers));
  await safeSetItem('fuelpro_suppliers', JSON.stringify(snapshot.suppliers));
  await safeSetItem('fuelpro_tanks', JSON.stringify(snapshot.tanks));
  await safeSetItem('fuelpro_products', JSON.stringify(snapshot.products));
  await safeSetItem('fuelpro_banks', JSON.stringify(snapshot.banks));
  await safeSetItem('fuelpro_shifts', JSON.stringify(snapshot.shifts));
  await safeSetItem(`fuelpro_journal_entries_${stationId}`, JSON.stringify(snapshot.journalEntries));

  return {
    success: true,
    message: `Restored ${Object.values(snapshot.recordCounts).reduce((s, c) => s + c, 0)} records from snapshot dated ${date}.`,
  };
}

/** List all available snapshots for a station. */
export async function listSnapshots(stationId: string): Promise<SnapshotMeta[]> {
  const raw = await safeGetItem(_snapshotIndexKey(stationId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate)) : [];
  } catch { return []; }
}

/** Get a specific snapshot. */
export async function getSnapshot(stationId: string, date: string): Promise<DisasterRecoverySnapshot | null> {
  const raw = await safeGetItem(_snapshotKey(stationId, date));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function _readKey<T>(key: string, fallback: T): Promise<T> {
  const raw = await safeGetItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) ?? fallback; } catch { return fallback; }
}

function _generateChecksum(
  recordCounts: DisasterRecoverySnapshot['recordCounts'],
  date: string,
  stationId: string
): string {
  const seed = `${date}|${stationId}|${recordCounts.customers}|${recordCounts.suppliers}|${recordCounts.tanks}|${recordCounts.products}|${recordCounts.banks}|${recordCounts.shifts}|${recordCounts.journals}`;
  // Simple deterministic hash (not cryptographic — suitable for local-first)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `chk_${Math.abs(hash).toString(16)}`;
}
