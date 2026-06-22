/**
 * FuelPro EOC — Treasury Engine
 * Master multi-account cash tracking system.
 * 7 independent treasury accounts per station with full ledger history.
 * Powered by Umar Ali ⚡
 */

import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TreasuryAccountType =
  | 'cash_drawer'
  | 'main_safe'
  | 'owner_cash'
  | 'bank'
  | 'jazzcash'
  | 'easypaisa'
  | 'pos_terminal';

export interface TreasuryAccount {
  id: string;
  stationId: string;
  name: string;
  accountType: TreasuryAccountType;
  balance: number;
  openingBalance: number;
  linkedAccountId?: string;   // BankAccount.id or DigitalAccount.id
  shiftId?: string;
  lastUpdated: string;
  createdAt: string;
}

export interface TreasuryLedgerLine {
  id: string;
  accountId: string;
  stationId: string;
  txnId: string;
  date: string;
  description: string;
  cashIn: number;
  cashOut: number;
  runningBalance: number;
  txnType: 'sale' | 'recovery' | 'expense' | 'bank_deposit' | 'digital' | 'supplier_payment' | 'transfer' | 'owner_drawing' | 'reconciliation';
  shiftId?: string;
  performedBy: string;
}

export interface TreasuryPosition {
  stationId: string;
  generatedAt: string;
  cashDrawer: number;
  mainSafe: number;
  ownerCash: number;
  bankTotal: number;
  jazzCash: number;
  easyPaisa: number;
  posTerminal: number;
  totalLiquid: number;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const _accountsKey = (stationId: string) => `fuelpro_treasury_accounts_${stationId}`;
const _ledgerKey = (stationId: string) => `fuelpro_treasury_ledger_${stationId}`;

// ─── Default Account Setup ────────────────────────────────────────────────────

const DEFAULT_ACCOUNTS: Omit<TreasuryAccount, 'id' | 'stationId' | 'createdAt' | 'lastUpdated'>[] = [
  { name: 'Cash Drawer',    accountType: 'cash_drawer',  balance: 0, openingBalance: 0 },
  { name: 'Main Safe',      accountType: 'main_safe',    balance: 0, openingBalance: 0 },
  { name: 'Owner Cash',     accountType: 'owner_cash',   balance: 0, openingBalance: 0 },
  { name: 'JazzCash',       accountType: 'jazzcash',     balance: 0, openingBalance: 0 },
  { name: 'EasyPaisa',      accountType: 'easypaisa',    balance: 0, openingBalance: 0 },
  { name: 'POS Terminal',   accountType: 'pos_terminal', balance: 0, openingBalance: 0 },
];

// ─── Core Functions ───────────────────────────────────────────────────────────

/** Initialize treasury accounts for a station (idempotent). */
export async function initTreasuryAccounts(stationId: string): Promise<TreasuryAccount[]> {
  const existing = await getTreasuryAccounts(stationId);
  if (existing.length > 0) return existing;

  const now = new Date().toISOString();
  const accounts: TreasuryAccount[] = DEFAULT_ACCOUNTS.map((def, i) => ({
    ...def,
    id: `tac_${stationId}_${def.accountType}`,
    stationId,
    createdAt: now,
    lastUpdated: now,
  }));

  await _persistAccounts(stationId, accounts);
  return accounts;
}

/** Get all treasury accounts for a station. */
export async function getTreasuryAccounts(stationId: string): Promise<TreasuryAccount[]> {
  const raw = await safeGetItem(_accountsKey(stationId));
  if (!raw) return [];
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

/** Get a specific account by type. */
export async function getAccountByType(
  stationId: string,
  accountType: TreasuryAccountType
): Promise<TreasuryAccount | null> {
  const accounts = await getTreasuryAccounts(stationId);
  return accounts.find(a => a.accountType === accountType) ?? null;
}

/** Record cash IN to a treasury account. */
export async function recordCashIn(
  stationId: string,
  accountType: TreasuryAccountType,
  amount: number,
  txnId: string,
  txnType: TreasuryLedgerLine['txnType'],
  description: string,
  performedBy: string,
  shiftId?: string
): Promise<TreasuryAccount> {
  const accounts = await getTreasuryAccounts(stationId);
  const idx = accounts.findIndex(a => a.accountType === accountType);
  if (idx === -1) throw new Error(`[TreasuryEngine] Account not found: ${accountType}`);

  accounts[idx].balance += amount;
  accounts[idx].lastUpdated = new Date().toISOString();
  await _persistAccounts(stationId, accounts);

  await _appendLedgerLine(stationId, {
    id: `tl_in_${txnId}`,
    accountId: accounts[idx].id,
    stationId, txnId,
    date: new Date().toISOString(),
    description,
    cashIn: amount, cashOut: 0,
    runningBalance: accounts[idx].balance,
    txnType, shiftId, performedBy,
  });

  return accounts[idx];
}

/** Record cash OUT from a treasury account. */
export async function recordCashOut(
  stationId: string,
  accountType: TreasuryAccountType,
  amount: number,
  txnId: string,
  txnType: TreasuryLedgerLine['txnType'],
  description: string,
  performedBy: string,
  shiftId?: string
): Promise<TreasuryAccount> {
  const accounts = await getTreasuryAccounts(stationId);
  const idx = accounts.findIndex(a => a.accountType === accountType);
  if (idx === -1) throw new Error(`[TreasuryEngine] Account not found: ${accountType}`);

  if (accounts[idx].balance < amount) {
    throw new Error(`[TreasuryEngine] Insufficient balance in ${accountType}. Available: ${accounts[idx].balance}, Requested: ${amount}`);
  }

  accounts[idx].balance -= amount;
  accounts[idx].lastUpdated = new Date().toISOString();
  await _persistAccounts(stationId, accounts);

  await _appendLedgerLine(stationId, {
    id: `tl_out_${txnId}`,
    accountId: accounts[idx].id,
    stationId, txnId,
    date: new Date().toISOString(),
    description,
    cashIn: 0, cashOut: amount,
    runningBalance: accounts[idx].balance,
    txnType, shiftId, performedBy,
  });

  return accounts[idx];
}

/** Transfer between two treasury accounts atomically. */
export async function transferBetweenAccounts(
  stationId: string,
  fromType: TreasuryAccountType,
  toType: TreasuryAccountType,
  amount: number,
  txnId: string,
  description: string,
  performedBy: string,
  shiftId?: string
): Promise<void> {
  await recordCashOut(stationId, fromType, amount, `${txnId}_out`, 'transfer', `Transfer out: ${description}`, performedBy, shiftId);
  await recordCashIn(stationId, toType, amount, `${txnId}_in`, 'transfer', `Transfer in: ${description}`, performedBy, shiftId);
}

/** Get consolidated treasury position for a station. */
export async function getConsolidatedPosition(stationId: string): Promise<TreasuryPosition> {
  const accounts = await getTreasuryAccounts(stationId);
  const get = (type: TreasuryAccountType) => accounts.find(a => a.accountType === type)?.balance ?? 0;

  const cashDrawer = get('cash_drawer');
  const mainSafe = get('main_safe');
  const ownerCash = get('owner_cash');
  const bankTotal = accounts.filter(a => a.accountType === 'bank').reduce((s, a) => s + a.balance, 0);
  const jazzCash = get('jazzcash');
  const easyPaisa = get('easypaisa');
  const posTerminal = get('pos_terminal');

  return {
    stationId,
    generatedAt: new Date().toISOString(),
    cashDrawer, mainSafe, ownerCash, bankTotal,
    jazzCash, easyPaisa, posTerminal,
    totalLiquid: cashDrawer + mainSafe + ownerCash + bankTotal + jazzCash + easyPaisa + posTerminal,
  };
}

/** Get account transaction ledger. */
export async function getAccountLedger(
  stationId: string,
  accountType: TreasuryAccountType,
  fromDate?: string,
  toDate?: string
): Promise<TreasuryLedgerLine[]> {
  const all = await _getAllLedgerLines(stationId);
  const accounts = await getTreasuryAccounts(stationId);
  const account = accounts.find(a => a.accountType === accountType);
  if (!account) return [];
  return all
    .filter(l => l.accountId === account.id)
    .filter(l => !fromDate || l.date >= fromDate)
    .filter(l => !toDate || l.date <= toDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Get treasury balance by linkedAccountId. */
export async function getTreasuryBalance(stationId: string, linkedAccountId: string): Promise<number> {
  const accounts = await getTreasuryAccounts(stationId);
  const account = accounts.find(a => a.linkedAccountId === linkedAccountId);
  return account ? account.balance : 0;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

async function _persistAccounts(stationId: string, accounts: TreasuryAccount[]): Promise<void> {
  await safeSetItem(_accountsKey(stationId), JSON.stringify(accounts));
}

async function _getAllLedgerLines(stationId: string): Promise<TreasuryLedgerLine[]> {
  const raw = await safeGetItem(_ledgerKey(stationId));
  if (!raw) return [];
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

async function _appendLedgerLine(stationId: string, line: TreasuryLedgerLine): Promise<void> {
  const all = await _getAllLedgerLines(stationId);
  all.push(line);
  await safeSetItem(_ledgerKey(stationId), JSON.stringify(all));
}
