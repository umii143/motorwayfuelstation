/**
 * FuelPro EOC — Audit Engine
 * Enhanced operational timeline — every shift event is timestamped and stored.
 * Full audit trail with security event logging and shift timeline queries.
 * Powered by Umar Ali ⚡
 */

import { useAuthStore } from '../../stores/useAuthStore';
import { safeGetItem, safeSetItem } from './coreStorage';
import localforage from 'localforage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShiftEventType =
  | 'shift_opened'
  | 'shift_closed'
  | 'credit_sale'
  | 'credit_sale_reversed'
  | 'recovery'
  | 'recovery_reversed'
  | 'expense'
  | 'expense_reversed'
  | 'bank_deposit'
  | 'digital_payment'
  | 'supplier_payment'
  | 'supplier_payment_reversed'
  | 'discount'
  | 'lube_sale'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_rejected'
  | 'reconciliation_run'
  | 'fraud_flag_raised'
  | 'snapshot_created';

export interface ShiftEvent {
  id: string;
  timestamp: string;
  eventType: ShiftEventType;
  shiftId: string;
  stationId: string;
  branchId: string;
  performedBy: string;
  role: string;
  description: string;
  amount?: number;
  partyName?: string;
  partyType?: string;
  txnId?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  performedBy: string;
  stationId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const _timelineKey = (stationId: string, shiftId: string) => `fuelpro_timeline_${stationId}_${shiftId}`;
const _securityKey = (stationId: string) => `fuelpro_security_events_${stationId}`;
 
const _auditKey = (stationId: string) => `fuelpro_settings_audit_trail_${stationId}`;

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Log a shift-level operational event.
 */
export async function logShiftEvent(
  eventType: ShiftEventType,
  shiftId: string,
  stationId: string,
  branchId: string,
  description: string,
  options?: {
    amount?: number;
    partyName?: string;
    partyType?: string;
    txnId?: string;
    metadata?: Record<string, unknown>;
    performedBy?: string;
  }
): Promise<ShiftEvent> {
  const authState = useAuthStore.getState();
  const user = authState.user;

  const event: ShiftEvent = {
    id: `se_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
    timestamp: new Date().toISOString(),
    eventType,
    shiftId,
    stationId,
    branchId,
    performedBy: options?.performedBy ?? user?.name ?? 'System',
    role: user?.role ?? 'System',
    description,
    amount: options?.amount,
    partyName: options?.partyName,
    partyType: options?.partyType,
    txnId: options?.txnId,
    metadata: options?.metadata,
  };

  const key = _timelineKey(stationId, shiftId);
  const existing = await _readKey<ShiftEvent[]>(key, []);
  existing.push(event);
  await safeSetItem(key, JSON.stringify(existing));

  return event;
}

/**
 * Log a security-level event (fraud flag, unauthorized access attempt, etc.).
 */
export async function logSecurityEvent(
  stationId: string,
  action: string,
  severity: SecurityEvent['severity'],
  details: Record<string, unknown>,
  performedBy?: string
): Promise<SecurityEvent> {
  const authState = useAuthStore.getState();
  const user = authState.user;

  const event: SecurityEvent = {
    id: `sec_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
    timestamp: new Date().toISOString(),
    action,
    severity,
    performedBy: performedBy ?? user?.name ?? 'System',
    stationId,
    details,
    ipAddress: 'Client',
    userAgent: navigator.userAgent,
  };

  const existing = await _readKey<SecurityEvent[]>(_securityKey(stationId), []);
  existing.push(event);
  await safeSetItem(_securityKey(stationId), JSON.stringify(existing));

  return event;
}

/**
 * Get full operational timeline for a shift.
 */
export async function getShiftTimeline(shiftId: string, stationId: string): Promise<ShiftEvent[]> {
  const events = await _readKey<ShiftEvent[]>(_timelineKey(stationId, shiftId), []);
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Get security events for a station (filterable by severity).
 */
export async function getSecurityEvents(
  stationId: string,
  severityFilter?: SecurityEvent['severity']
): Promise<SecurityEvent[]> {
  const all = await _readKey<SecurityEvent[]>(_securityKey(stationId), []);
  if (severityFilter) return all.filter(e => e.severity === severityFilter);
  return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Get all shift events for a date range.
 */
export async function getEventsByDateRange(
  stationId: string,
  fromDate: string,
  toDate: string
): Promise<ShiftEvent[]> {
  // Collect all timeline keys and aggregate
  const all: ShiftEvent[] = [];
  const keys = new Set<string>();
  const lfKeys = await localforage.keys();
  lfKeys.forEach(k => keys.add(k));
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.add(k);
    }
  }

  for (const key of keys) {
    if (key.startsWith(`fuelpro_timeline_${stationId}_`)) {
      const events = await _readKey<ShiftEvent[]>(key, []);
      events.forEach(e => {
        if (e.timestamp >= fromDate && e.timestamp <= toDate + 'T23:59:59') {
          all.push(e);
        }
      });
    }
  }
  return all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** Format an event for human-readable display. */
export function formatEventForDisplay(event: ShiftEvent): string {
  const time = new Date(event.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const amount = event.amount ? ` — Rs ${event.amount.toLocaleString()}` : '';
  const party = event.partyName ? ` — ${event.partyName}` : '';
  return `${time} | ${event.description}${party}${amount}`;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function _readKey<T>(key: string, fallback: T): Promise<T> {
  const raw = await safeGetItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) ?? fallback; } catch { return fallback; }
}
