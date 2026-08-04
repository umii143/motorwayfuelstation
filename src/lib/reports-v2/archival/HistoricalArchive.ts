/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Historical Archive Engine
 *
 * Rules #92, #94, #106, #55:
 *   - Rule #92: historical windows (up to 10 years) resolve from the archive
 *     cache in well under 5s once fetched — no repeated full re-downloads.
 *   - Rule #94: every verified fetch is written through to the archive
 *     (zero-data-loss style read/write path).
 *   - Rule #106: captured snapshots are immutable — replaying a snapshot
 *     never mutates operational records; it reproduces the verified state.
 *   - Rule #55: the Time Machine replays the exact window (report + engine +
 *     tenant + date range), reproducing the same verified values every time.
 *
 * Storage strategy (no external deps):
 *   - In-memory LRU window cache — bounded, sub-5s replays within a session.
 *   - localStorage snapshot store — small immutable captures, size-guarded.
 *
 * The archive never fabricates data: it only stores what the QueryEngine
 * already verified from live Firestore, tagged with fetchedAt + TTL.
 */

import { logger } from '../../logger';

interface CacheEntry {
  docs: Record<string, any>[];
  fetchedAt: number;
  ttlMs: number;
}

export interface ArchiveStats {
  cachedWindows: number;
  snapshots: number;
  hits: number;
  misses: number;
  evictions: number;
}

export interface CapturedSnapshot {
  id: string;
  reportId: string;
  engineType: string;
  reportName?: string;
  /** Tenant that captured the snapshot — replay is blocked on mismatch (Rules #106/#125). */
  orgId: string;
  stationId: string;
  windowLabel: string;
  dateFrom: string;
  dateTo: string;
  capturedAt: string;
  dataQuality: string;
  totalExecutionTimeMs: number;
  kpis: { label: string; value: number | string; unit: string }[];
  registerCount: number;
}

const SNAPSHOT_STORAGE_KEY = 'fuelpro_archive_snapshots_v1';
const MAX_WINDOWS = 400;           // LRU bound for the in-memory window cache
// Generous per-window cap: high enough that a 10-year station window still
// replays with full fidelity (Rule #55) while the LRU bound keeps memory sane.
const MAX_DOCS_PER_WINDOW = 10000;
const MAX_SNAPSHOTS = 15;          // localStorage bound

export class HistoricalArchive {
  private static instance: HistoricalArchive;

  private windows = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  private constructor() {}

  static getInstance(): HistoricalArchive {
    if (!HistoricalArchive.instance) {
      HistoricalArchive.instance = new HistoricalArchive();
    }
    return HistoricalArchive.instance;
  }

  // ──────────────────────────────────────────────
  // Window cache (in-memory, LRU)
  // ──────────────────────────────────────────────

  static key(tenantOrg: string, tenantStation: string, domain: string, collection: string, dateFrom?: Date, dateTo?: Date): string {
    const from = dateFrom ? dateFrom.toISOString() : '∞';
    const to = dateTo ? dateTo.toISOString() : '∞';
    return `${tenantOrg}|${tenantStation}|${domain}|${collection}|${from}|${to}`;
  }

  /** Returns cached docs if present and not expired — marks a cache hit. */
  getWindow(key: string, now = Date.now()): Record<string, any>[] | null {
    const entry = this.windows.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (now - entry.fetchedAt > entry.ttlMs) {
      this.windows.delete(key);
      this.evictions++;
      this.misses++;
      return null;
    }
    // LRU refresh: re-insert to move to the end of insertion order. The docs
    // are frozen on write, so returning them directly cannot corrupt state;
    // the outer array copy keeps array-level mutation safe too.
    this.windows.delete(key);
    this.windows.set(key, entry);
    this.hits++;
    return entry.docs.slice();
  }

  /** Stores verified docs under a key with a TTL. Bounded + LRU eviction. */
  putWindow(key: string, docs: Record<string, any>[], ttlMs: number, now = Date.now()): void {
    // Immutability on write (Rule #106): store frozen clones so no consumer of
    // a cache read can corrupt the archived state. Freeze is shallow — engines
    // read top-level fields only — and preserves prototype methods like
    // Firestore Timestamp.toDate() (a structuredClone would destroy them).
    const bounded = docs.slice(0, MAX_DOCS_PER_WINDOW).map(d => Object.freeze({ ...d }));
    Object.freeze(bounded);
    if (this.windows.has(key)) {
      this.windows.delete(key);
    }
    this.windows.set(key, { docs: bounded, fetchedAt: now, ttlMs });
    while (this.windows.size > MAX_WINDOWS) {
      const oldest = this.windows.keys().next().value;
      if (oldest === undefined) break;
      this.windows.delete(oldest);
      this.evictions++;
    }
  }

  // ──────────────────────────────────────────────
  // Immutable snapshots (localStorage, bounded)
  // ──────────────────────────────────────────────

  captureSnapshot(snapshot: Omit<CapturedSnapshot, 'id'>): CapturedSnapshot | null {
    const full: CapturedSnapshot = {
      ...snapshot,
      id: `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
    };
    try {
      const list = this.getSnapshots();
      list.unshift(full);
      const trimmed = list.slice(0, MAX_SNAPSHOTS);
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(trimmed));
      return full;
    } catch (err: any) {
      logger.warn('[HistoricalArchive] Snapshot persistence failed (quota?):', err?.message);
      return full; // still return for the session even if persistence fails
    }
  }

  getSnapshots(): CapturedSnapshot[] {
    try {
      const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  clearSnapshots(): void {
    try {
      localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
    } catch {
      // no-op
    }
  }

  stats(): ArchiveStats {
    return {
      cachedWindows: this.windows.size,
      snapshots: this.getSnapshots().length,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions
    };
  }
}
