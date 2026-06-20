/**
 * FuelPro — Integrity Drift Log Engine
 * Immutable audit log of all mismatches between Legacy and Operational Core.
 * Hard delete is PROHIBITED. Only resolution is allowed.
 * Powered by Umar Ali ⚡
 */

export type DriftSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type DriftModule = 'customer' | 'supplier' | 'bank' | 'cash' | 'digital_wallet' | 'inventory' | 'treasury' | 'shift_variance';

export interface IntegrityDriftLog {
  id: string;
  shiftId: string;
  timestamp: string;
  module: DriftModule;
  legacyValue: number;
  operationalValue: number;
  difference: number;        // Absolute difference
  severity: DriftSeverity;
  stationId: string;
  description: string;       // Human-readable detail
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface ShadowModeStats {
  shadowModeActive: boolean;
  totalShiftsProcessed: number;
  validatedShifts: number;
  matchedShifts: number;
  mismatchedShifts: number;
  pendingValidation: number;
  lastValidatedAt?: string;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

function _driftKey(stationId: string): string {
  return `fuelpro_integrity_drift_${stationId}`;
}

function _statsKey(stationId: string): string {
  return `fuelpro_shadow_stats_${stationId}`;
}

// ─── Drift Log Operations ──────────────────────────────────────────────────────

export function getAllDriftLogs(stationId: string): IntegrityDriftLog[] {
  const raw = localStorage.getItem(_driftKey(stationId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addDriftLog(stationId: string, log: Omit<IntegrityDriftLog, 'id' | 'resolved'>): IntegrityDriftLog {
  const existing = getAllDriftLogs(stationId);
  const newLog: IntegrityDriftLog = {
    ...log,
    id: `drift_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
    resolved: false,
  };
  existing.push(newLog);
  localStorage.setItem(_driftKey(stationId), JSON.stringify(existing));
  return newLog;
}

/** PROHIBITED: Hard deletion is not allowed. Use resolveDriftLog instead. */
export function resolveDriftLog(
  stationId: string,
  logId: string,
  resolvedBy: string,
  resolutionNotes: string
): boolean {
  const existing = getAllDriftLogs(stationId);
  const idx = existing.findIndex(l => l.id === logId);
  if (idx === -1) return false;

  existing[idx] = {
    ...existing[idx],
    resolved: true,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
    resolutionNotes,
  };
  localStorage.setItem(_driftKey(stationId), JSON.stringify(existing));
  return true;
}

export function getUnresolvedCriticalCount(stationId: string): number {
  return getAllDriftLogs(stationId).filter(l => !l.resolved && l.severity === 'CRITICAL').length;
}

export function getOpenDriftCount(stationId: string): number {
  return getAllDriftLogs(stationId).filter(l => !l.resolved).length;
}

// ─── Shadow Mode Stats ─────────────────────────────────────────────────────────

export function getShadowStats(stationId: string): ShadowModeStats {
  const raw = localStorage.getItem(_statsKey(stationId));
  if (!raw) return {
    shadowModeActive: true,
    totalShiftsProcessed: 0,
    validatedShifts: 0,
    matchedShifts: 0,
    mismatchedShifts: 0,
    pendingValidation: 0,
  };
  try {
    return JSON.parse(raw);
  } catch {
    return {
      shadowModeActive: true,
      totalShiftsProcessed: 0,
      validatedShifts: 0,
      matchedShifts: 0,
      mismatchedShifts: 0,
      pendingValidation: 0,
    };
  }
}

export function updateShadowStats(stationId: string, matched: boolean): ShadowModeStats {
  const stats = getShadowStats(stationId);
  const updated: ShadowModeStats = {
    ...stats,
    shadowModeActive: true,
    totalShiftsProcessed: stats.totalShiftsProcessed + 1,
    validatedShifts: stats.validatedShifts + 1,
    matchedShifts: matched ? stats.matchedShifts + 1 : stats.matchedShifts,
    mismatchedShifts: matched ? stats.mismatchedShifts : stats.mismatchedShifts + 1,
    lastValidatedAt: new Date().toISOString(),
  };
  localStorage.setItem(_statsKey(stationId), JSON.stringify(updated));
  return updated;
}

// ─── Integrity Score ───────────────────────────────────────────────────────────

/**
 * Calculate System Integrity Score (0–100).
 * Rules:
 * - Start at 100
 * - Each CRITICAL unresolved drift: -15
 * - Each WARNING unresolved drift: -5
 * - Each INFO unresolved drift: -1
 * - If mismatched shifts > 10% of total: additional -10
 */
export function calculateIntegrityScore(stationId: string): number {
  const logs = getAllDriftLogs(stationId);
  const stats = getShadowStats(stationId);
  const unresolved = logs.filter(l => !l.resolved);

  let score = 100;
  for (const log of unresolved) {
    if (log.severity === 'CRITICAL') score -= 15;
    else if (log.severity === 'WARNING') score -= 5;
    else score -= 1;
  }

  // Penalize if too many mismatched shifts
  if (stats.totalShiftsProcessed > 0) {
    const mismatchRate = stats.mismatchedShifts / stats.totalShiftsProcessed;
    if (mismatchRate > 0.1) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Migration Confidence (0–100%).
 * Only reaches 99%+ when:
 *   - >= 50 shifts validated
 *   - Integrity score >= 98
 *   - No unresolved CRITICAL drifts
 */
export function calculateMigrationConfidence(stationId: string): number {
  const stats = getShadowStats(stationId);
  const score = calculateIntegrityScore(stationId);
  const criticalCount = getUnresolvedCriticalCount(stationId);

  if (criticalCount > 0) return 0; // Hard block
  if (stats.validatedShifts === 0) return 0;

  const shiftConfidence = Math.min(100, (stats.validatedShifts / 50) * 100);
  const integrityWeight = score / 100;
  const matchRate = stats.totalShiftsProcessed > 0
    ? stats.matchedShifts / stats.totalShiftsProcessed
    : 0;

  return Math.min(99.9, shiftConfidence * integrityWeight * matchRate);
}

/** Returns true if all conditions are met for Phase 4 migration authorization. */
export function isMigrationAuthorized(stationId: string): boolean {
  const stats = getShadowStats(stationId);
  const score = calculateIntegrityScore(stationId);
  const confidence = calculateMigrationConfidence(stationId);
  const criticalCount = getUnresolvedCriticalCount(stationId);

  return (
    stats.validatedShifts >= 50 &&
    score >= 98 &&
    confidence >= 99 &&
    criticalCount === 0
  );
}

// ─── Severity Classification ───────────────────────────────────────────────────

export function classifyDriftSeverity(module: DriftModule, difference: number): DriftSeverity {
  switch (module) {
    case 'bank':
    case 'cash':
      return difference > 0 ? 'CRITICAL' : 'INFO';
    case 'inventory':
      // >0.5% drift is critical (treated as absolute liters threshold > 5L for simplicity)
      return difference > 5 ? 'CRITICAL' : difference > 0 ? 'WARNING' : 'INFO';
    case 'customer':
    case 'supplier':
      return difference > 500 ? 'WARNING' : difference > 0 ? 'INFO' : 'INFO';
    case 'digital_wallet':
      return difference > 0 ? 'CRITICAL' : 'INFO';
    case 'treasury':
      return difference > 0 ? 'CRITICAL' : 'INFO';
    default:
      return 'INFO';
  }
}
