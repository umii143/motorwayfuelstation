/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * useWorkspaceFirebaseData — Universal Firebase Data Hook for Workspace Tabs
 *
 * ARCHITECTURAL RULE (Rule #1, #2, #3, #12, #16):
 * This is the ONLY approved path for workspace tabs to access Firebase data.
 * All data flows through QueryEngine → this hook → tab component.
 * No workspace tab may import Firebase directly or use hardcoded data.
 *
 * Usage:
 *   const { data, loading, error, isEmpty } = useWorkspaceFirebaseData('SALES', context);
 *   const { data, loading, error, isEmpty } = useWorkspaceFirebaseData(['SALES','PAYMENTS'], context);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { QueryEngine } from '../../../../lib/reports-v2/engines/QueryEngine';
import { QueryContext, RawDataResult } from '../../../../lib/reports-v2/engines/types';
import { useStationStore } from '../../../../stores/useStationStore';
import { useAuthStore } from '../../../../stores/useAuthStore';

/** Result shape returned by the hook */
export interface WorkspaceFirebaseDataResult {
  /** Fetched documents from Firestore */
  data: Record<string, any>[];
  /** True while the initial fetch is in progress */
  loading: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** True when no records exist in the database */
  isEmpty: boolean;
  /** Timestamp of last successful fetch */
  fetchedAt: Date | null;
  /** Manual refetch trigger */
  refetch: () => void;
}

/** Multi-domain result shape */
export interface WorkspaceMultiFirebaseDataResult {
  /** Map of domain → documents */
  dataMap: Record<string, Record<string, any>[]>;
  /** True while the initial fetch is in progress */
  loading: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** True when ALL domains returned zero records */
  isEmpty: boolean;
  /** Timestamp of last successful fetch */
  fetchedAt: Date | null;
  /** Manual refetch trigger */
  refetch: () => void;
}

/**
 * Fetch live Firebase data for a single domain.
 *
 * @param domain - Abstract domain key matching QueryEngine.COLLECTION_RESOLVER
 *                 (e.g. 'SALES', 'SUPPLIERS', 'FUEL_PURCHASES', 'TANKS', etc.)
 * @param contextOverride - Optional partial context overrides
 */
export function useWorkspaceFirebaseData(
  domain: string,
  contextOverride?: Partial<QueryContext>
): WorkspaceFirebaseDataResult {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  // Pull tenant context from stores
  const activeStationId = useStationStore((s) => s.activeStationId);
  const user = useAuthStore((s) => s.user);

  const context: QueryContext = {
    orgId: contextOverride?.orgId || user?.userId || (user as any)?.uid || '',
    stationId: contextOverride?.stationId || activeStationId || '',
    userId: contextOverride?.userId || user?.userId || (user as any)?.uid || '',
    role: contextOverride?.role || 'admin',
    dateFrom: contextOverride?.dateFrom,
    dateTo: contextOverride?.dateTo,
    filters: contextOverride?.filters,
  };

  const fetchData = useCallback(async () => {
    if (!context.orgId || !context.stationId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const engine = QueryEngine.getInstance();
      const result: RawDataResult = await engine.query(domain, context);
      if (mountedRef.current) {
        setData(result.documents);
        setFetchedAt(result.fetchedAt);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || `Failed to fetch ${domain} data from Firebase.`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [domain, context.orgId, context.stationId, context.dateFrom?.getTime(), context.dateTo?.getTime()]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (!context.orgId || !context.stationId) return;

    const engine = QueryEngine.getInstance();
    const collectionName = engine._debugGetCollectionName(domain);
    if (!collectionName) return;

    const unsubscribe = engine.subscribeCollection(
      collectionName,
      context,
      (result: RawDataResult) => {
        if (mountedRef.current) {
          setData(result.documents);
          setFetchedAt(result.fetchedAt);
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [domain, context.orgId, context.stationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isEmpty: !loading && data.length === 0,
    fetchedAt,
    refetch: fetchData,
  };
}

/**
 * Fetch live Firebase data for multiple domains in parallel.
 *
 * @param domains - Array of abstract domain keys
 * @param contextOverride - Optional partial context overrides
 */
export function useWorkspaceMultiFirebaseData(
  domains: string[],
  contextOverride?: Partial<QueryContext>
): WorkspaceMultiFirebaseDataResult {
  const [dataMap, setDataMap] = useState<Record<string, Record<string, any>[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const activeStationId = useStationStore((s) => s.activeStationId);
  const user = useAuthStore((s) => s.user);

  const context: QueryContext = {
    orgId: contextOverride?.orgId || user?.userId || (user as any)?.uid || '',
    stationId: contextOverride?.stationId || activeStationId || '',
    userId: contextOverride?.userId || user?.userId || (user as any)?.uid || '',
    role: contextOverride?.role || 'admin',
    dateFrom: contextOverride?.dateFrom,
    dateTo: contextOverride?.dateTo,
    filters: contextOverride?.filters,
  };

  const fetchData = useCallback(async () => {
    if (!context.orgId || !context.stationId) {
      setDataMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const engine = QueryEngine.getInstance();
      const results = await engine.queryMultiple(domains, context);
      if (mountedRef.current) {
        const map: Record<string, Record<string, any>[]> = {};
        for (const [key, result] of Object.entries(results)) {
          map[key] = result.documents;
        }
        setDataMap(map);
        setFetchedAt(new Date());
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Failed to fetch data from Firebase.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [domains.join(','), context.orgId, context.stationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isEmpty = !loading && Object.values(dataMap).every((docs) => docs.length === 0);

  return {
    dataMap,
    loading,
    error,
    isEmpty,
    fetchedAt,
    refetch: fetchData,
  };
}
