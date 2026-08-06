/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Query Engine — The ONLY layer that talks to Firebase
 *
 * ARCHITECTURAL RULE:
 * No other engine, component, or report may import Firebase directly.
 * All Firebase collection names live here and ONLY here.
 * If a collection name changes, ONLY this file changes. Zero reports break.
 *
 * Backend: Google Firestore (organizations/{orgId}/stations/{stationId}/...)
 * — the same operational path used by the EBIP Query Engine. The legacy
 * Realtime Database path was removed to enforce a single data backend.
 */

import { logger } from '../../logger';
import { HistoricalArchive } from '../archival/HistoricalArchive';
import { QueryContext, RawDataResult, IObservableEngine } from './types';
import { FirestoreAdapter } from '../../../repositories/adapters/FirestoreAdapter';

// ──────────────────────────────────────────────
// INTERNAL RESOLVER MAP
// Firebase collection names are NEVER exposed outside this file.
// ──────────────────────────────────────────────

// Archive TTLs: archive-mode windows stay cached 5 minutes (fast replays),
// ordinary session fetches 60 seconds (freshness for live views).
const ARCHIVE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 60 * 1000;

const COLLECTION_RESOLVER: Record<string, string> = {
  // Sales Domain
  'SALES':              'sales',
  'SALES_ITEMS':        'salesItems',
  'PAYMENTS':           'payments',
  'RETURNS':            'returns',

  // Fuel & Stock Domain
  'TANKS':              'tanks',
  'TANK_READINGS':      'tankReadings',
  'DIP_READINGS':       'dipReadings',
  'FUEL_PURCHASES':     'fuelPurchases',
  'FUEL_PRICES':        'fuelPrices',

  // Pump & Nozzle Domain
  'PUMPS':              'pumps',
  'PUMP_READINGS':      'pumpReadings',
  'NOZZLE_READINGS':    'nozzleReadings',

  // Shift Domain
  'SHIFTS':             'shifts',
  'SHIFT_READINGS':     'shiftReadings',

  // Cash & Banking Domain
  'CASH_LEDGER':        'cashLedger',
  'BANK_ACCOUNTS':      'bankAccounts',
  'BANK_TRANSACTIONS':  'bankTransactions',
  'WALLETS':            'wallets',
  'WALLET_TRANSACTIONS':'walletTransactions',

  // Ledger Domain
  'GENERAL_LEDGER':     'generalLedger',
  'JOURNAL_ENTRIES':    'journalEntries',

  // People Domain
  'CUSTOMERS':          'customers',
  'SUPPLIERS':          'suppliers',
  'EMPLOYEES':          'employees',
  'ATTENDANCE':         'attendance',

  // Expense Domain
  'EXPENSES':           'expenses',

  // Product Domain
  'PRODUCTS':           'products',
  'INVENTORY':          'inventory',

  // Asset Domain
  'ASSETS':             'assets',
  'MAINTENANCE_LOGS':   'maintenanceLogs',

  // System Domain
  'AUDIT_LOGS':         'auditLogs',
  'SYSTEM_LOGS':        'systemLogs',
  'USERS':              'users',
};

/**
 * Resolves the date field most likely present on a document.
 * Client-side filtering keeps the engine schema-tolerant (no composite
 * indexes required) while remaining fully live-data driven.
 */
function docTimestamp(doc: Record<string, any>): number | null {
  const raw = doc.timestamp || doc.date || doc.createdAt || doc.updatedAt;
  if (!raw) return null;
  const t = raw instanceof Date ? raw.getTime() : new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Applies the active workspace filters (product / tank / pump / operator)
 * to a document row. Filters arrive via QueryContext.filters as
 * { key: expectedValue } pairs — a filter matches when the row carries the
 * value on ANY of the common field spellings for that key. Empty values
 * are ignored so the filter bar never blocks data (Rules #7/#100).
 */
function applyContextFilters(
  docs: Record<string, any>[],
  filters?: Record<string, any>
): Record<string, any>[] {
  if (!filters) return docs;

  const FIELD_ALIASES: Record<string, string[]> = {
    product: ['product', 'productName', 'productType', 'fuelType', 'grade'],
    tank: ['tank', 'tankName', 'tankId', 'tank_id'],
    pump: ['pump', 'pumpName', 'pumpId', 'pump_id'],
    operator: ['operator', 'operatorName', 'operatorStaffId', 'staffName', 'staffId', 'userId', 'createdBy'],
    status: ['status', 'shiftStatus', 'state'],
    payment: ['payment', 'paymentMethod', 'paymentType', 'mode'],
    branch: ['branch', 'branchName', 'branchId', 'stationId']
  };

  const active = Object.entries(filters || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  if (active.length === 0) return docs;

  return docs.filter(doc =>
    active.every(([key, value]) => {
      const aliases = FIELD_ALIASES[key] || [key];
      const cell = aliases.map(a => doc[a]).find(v => v !== undefined && v !== null && v !== '');
      if (cell === undefined) return true; // row has no such field — filter is best-effort
      return String(cell).toLowerCase() === String(value).toLowerCase();
    })
  );
}

// ──────────────────────────────────────────────
// QUERY ENGINE
// ──────────────────────────────────────────────

export class QueryEngine implements IObservableEngine {
  private static instance: QueryEngine;

  private constructor() {}

  static getInstance(): QueryEngine {
    if (!QueryEngine.instance) {
      QueryEngine.instance = new QueryEngine();
    }
    return QueryEngine.instance;
  }

  /**
   * Resolves an abstract data domain to its Firestore collection
   * and fetches the documents. Every verified fetch is written through to
   * the Historical Archive (Rule #94). When `useArchive` is true the window
   * cache is consulted first (Rule #92) — repeat historical replays resolve
   * from cache instead of re-downloading.
   *
   * @param domain - Abstract domain key (e.g., 'SALES', 'TANKS')
   * @param context - Query context with org, station, date range, filters
   * @param useArchive - Read from the archive window cache first
   * @returns RawDataResult with the fetched documents
   */
  async query(domain: string, context: QueryContext, useArchive = false): Promise<RawDataResult> {
    const startTime = performance.now();
    const fsCollection = COLLECTION_RESOLVER[domain];

    if (!fsCollection) {
      console.warn(`[QueryEngine] Unknown domain: ${domain}. Returning empty.`);
      return {
        collection: domain,
        documents: [],
        count: 0,
        fetchedAt: new Date(),
        executionTimeMs: 0
      };
    }

    // Tenant isolation — never query without a station context
    if (!context.orgId || !context.stationId) {
      console.warn('[QueryEngine] Missing orgId/stationId in context. Returning empty.');
      return {
        collection: fsCollection,
        documents: [],
        count: 0,
        fetchedAt: new Date(),
        executionTimeMs: 0
      };
    }

    const archive = HistoricalArchive.getInstance();
    const cacheKey = HistoricalArchive.key(context.orgId, context.stationId, domain, fsCollection, context.dateFrom, context.dateTo);

    // Archive read-through (Rule #92) — only for explicit archive-mode calls
    if (useArchive) {
      const cached = archive.getWindow(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return {
          collection: fsCollection,
          documents: cached,
          count: cached.length,
          fetchedAt: new Date(),
          executionTimeMs: 0,
          fromCache: true
        };
      }
    }

    try {
      const adapterContext = {
        stationId: context.stationId,
        orgId: context.orgId,
        dateFrom: context.dateFrom,
        dateTo: context.dateTo,
        filters: context.filters
      };

      const result = await FirestoreAdapter.fetchDocuments(fsCollection, adapterContext);

      const executionTimeMs = Math.round(performance.now() - startTime);
      this.metrics.cacheMisses++;
      this.metrics.totalQueries++;

      // Archive write-through (Rule #92) — verified data only
      archive.putWindow(cacheKey, result.documents, useArchive ? ARCHIVE_TTL_MS : SESSION_TTL_MS);

      return {
        collection: fsCollection,
        documents: result.documents,
        count: result.count,
        fetchedAt: new Date(),
        executionTimeMs,
        fromCache: false
      };
    } catch (error: any) {
      console.error(`[QueryEngine] Firestore query failed for ${domain}:`, error);
      this.metrics.errors++;
      return {
        collection: fsCollection,
        documents: [],
        count: 0,
        fetchedAt: new Date(),
        executionTimeMs: Math.round(performance.now() - startTime)
      };
    }
  }

  private metrics = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0
  };

  /**
   * Get observability metrics (PRD v6.1 A.8)
   */
  getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  /**
   * Batch query — fetches multiple domains in parallel.
   */
  async queryMultiple(domains: string[], context: QueryContext, useArchive = false): Promise<Record<string, RawDataResult>> {
    const results = await Promise.all(
      domains.map(async domain => ({
        domain,
        result: await this.query(domain, context, useArchive)
      }))
    );

    const map: Record<string, RawDataResult> = {};
    results.forEach(r => { map[r.domain] = r.result; });
    return map;
  }

  /**
   * Realtime subscription (Rule #15/#53) — subscribes to a raw Firestore
   * collection under the active tenant and fires onChange with the latest
   * documents whenever the operational records change. Returns an
   * unsubscribe function. Strictly the only Firebase subscription path.
   *
   * @param collectionName - Raw Firestore collection name (e.g. 'sales')
   * @param context - Tenant context (orgId/stationId required)
   * @param onChange - Called with the freshest documents after every change
   */
  subscribeCollection(
    collectionName: string,
    context: QueryContext,
    onChange: (result: RawDataResult) => void
  ): () => void {
    if (!context.orgId || !context.stationId) {
      return () => {};
    }

    const adapterContext = {
      stationId: context.stationId,
      orgId: context.orgId,
      dateFrom: context.dateFrom,
      dateTo: context.dateTo,
      filters: context.filters
    };

    return FirestoreAdapter.subscribeToDocuments(
      collectionName,
      adapterContext,
      (result) => {
        onChange({
          collection: collectionName,
          documents: result.documents,
          count: result.count,
          fetchedAt: result.fetchedAt,
          executionTimeMs: result.executionTimeMs,
          fromCache: false
        });
      },
      (error) => {
        logger.error(`[QueryEngine] Realtime listener error on ${collectionName}:`, error);
      }
    );
  }

  /**
   * Returns the internal collection name for a domain.
   * ONLY for use by developer/audit tools. Never expose to UI.
   */
  _debugGetCollectionName(domain: string): string | undefined {
    return COLLECTION_RESOLVER[domain];
  }
}
