/**
 * FuelPro EOC — Period Engine
 * Accounting period management and lock enforcement.
 * Closed periods block ALL mutations to historical data.
 * Powered by Umar Ali ⚡
 */

import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodStatus = 'open' | 'closing' | 'closed' | 'locked';

export interface AccountingPeriod {
  id: string;               // e.g. "2026-06"
  stationId: string;
  periodLabel: string;      // "June 2026"
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  closedBy?: string;
  closedAt?: string;
  lockedBy?: string;
  lockedAt?: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  shiftCount: number;
}

export class PeriodLockedException extends Error {
  constructor(periodId: string, date: string) {
    super(`[PeriodEngine] Period ${periodId} is locked. Data for date ${date} cannot be modified.`);
    this.name = 'PeriodLockedException';
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const _periodsKey = (stationId: string) => `fuelpro_accounting_periods_${stationId}`;

// ─── Core Functions ───────────────────────────────────────────────────────────

/** Get or create the accounting period for a given date. */
export async function getOrCreatePeriod(
  stationId: string,
  date: string
): Promise<AccountingPeriod> {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const periodId = `${year}-${String(month).padStart(2, '0')}`;

  const all = await listPeriods(stationId);
  const existing = all.find(p => p.id === periodId);
  if (existing) return existing;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const period: AccountingPeriod = {
    id: periodId,
    stationId,
    periodLabel: `${monthNames[month - 1]} ${year}`,
    year, month,
    startDate, endDate,
    status: 'open',
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    shiftCount: 0,
  };

  all.push(period);
  await _persistPeriods(stationId, all);
  return period;
}

/**
 * Validate that a date falls within an OPEN period.
 * Throws PeriodLockedException if the period is closed or locked.
 */
export async function checkPeriodOpen(stationId: string, date: string): Promise<void> {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const periodId = `${year}-${String(month).padStart(2, '0')}`;

  const all = await listPeriods(stationId);
  const period = all.find(p => p.id === periodId);

  if (!period) return; // Period doesn't exist yet = open by default

  if (period.status === 'closed' || period.status === 'locked') {
    throw new PeriodLockedException(periodId, date);
  }
}

/** Close an accounting period (requires owner approval in UI). */
export async function closePeriod(
  stationId: string,
  periodId: string,
  closedBy: string,
  summary: { totalRevenue: number; totalExpenses: number; netProfit: number; shiftCount: number }
): Promise<AccountingPeriod> {
  const all = await listPeriods(stationId);
  const idx = all.findIndex(p => p.id === periodId);

  if (idx === -1) throw new Error(`[PeriodEngine] Period not found: ${periodId}`);
  if (all[idx].status === 'locked') throw new Error(`[PeriodEngine] Period ${periodId} is already locked.`);

  all[idx] = {
    ...all[idx],
    status: 'closed',
    closedBy,
    closedAt: new Date().toISOString(),
    ...summary,
  };

  await _persistPeriods(stationId, all);
  return all[idx];
}

/** Lock an accounting period (immutable — no further changes allowed). */
export async function lockPeriod(
  stationId: string,
  periodId: string,
  lockedBy: string
): Promise<AccountingPeriod> {
  const all = await listPeriods(stationId);
  const idx = all.findIndex(p => p.id === periodId);

  if (idx === -1) throw new Error(`[PeriodEngine] Period not found: ${periodId}`);
  if (all[idx].status !== 'closed') throw new Error(`[PeriodEngine] Period must be closed before locking.`);

  all[idx] = {
    ...all[idx],
    status: 'locked',
    lockedBy,
    lockedAt: new Date().toISOString(),
  };

  await _persistPeriods(stationId, all);
  return all[idx];
}

/** Get current active period. */
export async function getCurrentPeriod(stationId: string): Promise<AccountingPeriod | null> {
  const today = new Date().toISOString().split('T')[0];
  return getOrCreatePeriod(stationId, today);
}

/** List all periods for a station. */
export async function listPeriods(stationId: string): Promise<AccountingPeriod[]> {
  const raw = await safeGetItem(_periodsKey(stationId));
  if (!raw) return [];
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

/** Get a specific period. */
export async function getPeriod(stationId: string, periodId: string): Promise<AccountingPeriod | null> {
  const all = await listPeriods(stationId);
  return all.find(p => p.id === periodId) ?? null;
}

// ─── Storage Helper ───────────────────────────────────────────────────────────

async function _persistPeriods(stationId: string, periods: AccountingPeriod[]): Promise<void> {
  await safeSetItem(_periodsKey(stationId), JSON.stringify(periods));
}
