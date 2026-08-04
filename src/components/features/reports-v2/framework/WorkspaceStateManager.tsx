/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — UI Framework
 *
 * Centralized Workspace State Manager (Lifecycle Framework).
 * Initialize -> Probe Firebase -> Validate Permissions -> Prepare Workspace -> Ready.
 * Strictly no report execution. The LIVE/READY state is driven by a real
 * Firebase connectivity probe, never a simulated timer.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, getDocsFromServer, query, limit } from 'firebase/firestore';
import { dbFS } from '../../../../lib/firebase';
import { logger } from '../../../../lib/logger';
import { db } from '../../../../data/db';

export type WorkspaceLifecycleState = 
  | 'INITIALIZING'
  | 'LOADING_METADATA'
  | 'VALIDATING_PERMISSIONS'
  | 'PREPARING_WORKSPACE'
  | 'READY'
  | 'OFFLINE'
  | 'MAINTENANCE'
  | 'ERROR';

export type EnterpriseRBACRole = 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'OPERATOR' | 'TECHNICIAN' | 'AUDITOR';

export type ReportDatePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface WorkspaceDateRange {
  preset: ReportDatePreset;
  /** ISO date strings (yyyy-mm-dd) — set for 'custom' */
  startDate?: string;
  endDate?: string;
}

/** Resolves a date preset to concrete start/end Dates. Default: last 90 days. */
export function resolveDateRange(range?: WorkspaceDateRange): { dateFrom: Date; dateTo: Date } {
  const dateTo = new Date();
  const dateFrom = new Date();
  const preset = range?.preset || '90d';

  switch (preset) {
    case 'today':
      dateFrom.setHours(0, 0, 0, 0);
      break;
    case '7d':
      dateFrom.setDate(dateFrom.getDate() - 7);
      break;
    case '30d':
      dateFrom.setDate(dateFrom.getDate() - 30);
      break;
    case 'custom':
      if (range?.startDate) {
        const s = new Date(range.startDate + 'T00:00:00');
        if (!Number.isNaN(s.getTime())) {
          dateFrom.setTime(s.getTime());
        }
      }
      if (range?.endDate) {
        const e = new Date(range.endDate + 'T23:59:59');
        if (!Number.isNaN(e.getTime())) {
          dateTo.setTime(e.getTime());
        }
      }
      break;
    case '90d':
    default:
      dateFrom.setDate(dateFrom.getDate() - 90);
      break;
  }

  return { dateFrom, dateTo };
}

/**
 * Maps the application auth roles (AuthContext: 'owner' | 'manager' | 'staff')
 * onto the Enterprise Reports RBAC vocabulary.
 */
export function mapAuthRoleToEnterprise(role?: string): EnterpriseRBACRole {
  switch ((role || '').toLowerCase()) {
    case 'owner': return 'OWNER';
    case 'manager': return 'MANAGER';
    case 'accountant': return 'ACCOUNTANT';
    case 'technician': return 'TECHNICIAN';
    case 'auditor': return 'AUDITOR';
    case 'staff':
    case 'cashier':
    case 'operator':
    case 'supervisor':
    default: return 'OPERATOR';
  }
}

export type ReportFilterKey = 'product' | 'tank' | 'pump' | 'operator' | 'status' | 'payment' | 'branch';

export type ReportFilters = Partial<Record<ReportFilterKey, string>>;

export const EMPTY_FILTERS: ReportFilters = {};

interface WorkspaceStateContextValue {
  lifecycleState: WorkspaceLifecycleState;
  databaseConnected: boolean;
  activeReportId: string | null;
  setActiveReportId: (id: string | null) => void;
  isCopilotExpanded: boolean;
  setCopilotExpanded: (expanded: boolean) => void;
  isReplayOpen: boolean;
  setReplayOpen: (open: boolean) => void;
  isExplorerCollapsed: boolean;
  setExplorerCollapsed: (collapsed: boolean) => void;
  language: 'en' | 'ur';
  setLanguage: (lang: 'en' | 'ur') => void;
  reportNamingMode: 'enterprise' | 'simple';
  setReportNamingMode: (mode: 'enterprise' | 'simple') => void;
  navigationMode: 'AZ' | 'DAILY' | 'PROCESS';
  setNavigationMode: (mode: 'AZ' | 'DAILY' | 'PROCESS') => void;
  dateRange: WorkspaceDateRange;
  setDateRange: (range: WorkspaceDateRange) => void;
  activeRole: EnterpriseRBACRole;
  setActiveRole: (role: EnterpriseRBACRole) => void;
  isDeveloperMode: boolean;
  setIsDeveloperMode: (isDev: boolean) => void;
  /** Active workspace filters (product/tank/pump/operator/...) — bound to real report data */
  filters: ReportFilters;
  setFilter: (key: ReportFilterKey, value: string) => void;
  clearFilters: () => void;
  /** Incremented every time the toolbar Refresh action is requested */
  refreshSignal: number;
  requestRefresh: () => void;
  /** Pinned report IDs, persisted per station (db.getReportFavorites) */
  favorites: string[];
  toggleFavorite: (reportId: string) => void;
  /** Most-recently-opened report IDs, persisted per station (db.getReportRecents) */
  recents: string[];
  // Real tenant context (wired from the router/auth, never hardcoded)
  orgId: string;
  stationId: string;
  userId: string;
  userName: string;
}

const WorkspaceStateContext = createContext<WorkspaceStateContextValue | undefined>(undefined);

interface WorkspaceStateProviderProps {
  children: ReactNode;
  language: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}

/**
 * Performs a strict real Firebase connectivity probe.
 * Forces a server read of at most 1 document from the top-level
 * systemSettings collection — a cache hit can never fake a LIVE badge
 * (Rule #15/#90). Re-probes on window focus to stay honest over time.
 */
async function probeFirebase(): Promise<boolean> {
  try {
    await getDocsFromServer(query(collection(dbFS, 'systemSettings'), limit(1)));
    return true;
  } catch (err: any) {
    logger.warn('[ReportsWorkspace] Firebase probe failed:', err?.message);
    return false;
  }
}

export function WorkspaceStateProvider({
  children,
  language: initialLanguage,
  orgId = '',
  stationId = '',
  userId = '',
  userName = '',
  userRole
}: WorkspaceStateProviderProps) {
  const [lifecycleState, setLifecycleState] = useState<WorkspaceLifecycleState>('INITIALIZING');
  const [databaseConnected, setDatabaseConnected] = useState<boolean>(false);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'ur'>(initialLanguage);
  const [reportNamingMode, setReportNamingMode] = useState<'enterprise' | 'simple'>('enterprise');
  const [navigationMode, setNavigationMode] = useState<'AZ' | 'DAILY' | 'PROCESS'>('AZ');
  const [dateRange, setDateRange] = useState<WorkspaceDateRange>({ preset: '90d' });
  const [activeRole, setActiveRole] = useState<EnterpriseRBACRole>(mapAuthRoleToEnterprise(userRole));
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);

  // ── Real filter state (product/tank/pump/operator/status/payment/branch) ──
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(() => stationId ? db.getReportFavorites(stationId) : []);
  const [recents, setRecents] = useState<string[]>(() => stationId ? db.getReportRecents(stationId) : []);

  const setFilter = useCallback((key: ReportFilterKey, value: string) => {
    setFilters(prev => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const requestRefresh = useCallback(() => setRefreshSignal(s => s + 1), []);

  // Persist favorites per station (never cross-tenant, Rule #125).
  // Storage writes happen OUTSIDE the state updater so React StrictMode
  // double-invocation can never double-write (reviewer feedback).
  const toggleFavorite = useCallback((reportId: string) => {
    const next = favorites.includes(reportId) ? favorites.filter(id => id !== reportId) : [...favorites, reportId];
    setFavorites(next);
    if (stationId) db.saveReportFavorites(stationId, next);
  }, [favorites, stationId]);

  // Track recently-opened reports (PRD §1.5 — My Frequent Reports is real usage data)
  const openReport = useCallback((id: string | null) => {
    setActiveReportId(id);
    if (id && stationId) {
      const next = [id, ...recents.filter(r => r !== id)].slice(0, 8);
      db.saveReportRecents(stationId, next);
      setRecents(next);
    }
  }, [stationId, recents]);

  // Responsive sidebar states
  const isTablet = typeof window !== 'undefined' && window.innerWidth < 1200;

  // AI Copilot Dock default state: Collapsed on Desktop, Hidden/Collapsed on Laptop/Tablet
  const [isCopilotExpanded, setCopilotExpanded] = useState<boolean>(false);

  // Time Machine / Historical Replay modal (Rule #55/#92)
  const [isReplayOpen, setReplayOpen] = useState<boolean>(false);

  // Explorer default state: Open on Desktop, Collapsed on Mobile
  const [isExplorerCollapsed, setExplorerCollapsed] = useState<boolean>(isTablet);

  // Real lifecycle: probe Firebase connectivity, then validate permissions (RBAC mapping).
  useEffect(() => {
    let isMounted = true;

    const bootSequence = async () => {
      if (!isMounted) return;
      setLifecycleState('LOADING_METADATA');

      const connected = await probeFirebase();
      if (!isMounted) return;
      setDatabaseConnected(connected);

      setLifecycleState('VALIDATING_PERMISSIONS');
      if (!isMounted) return;

      // RBAC role is resolved from the authenticated user, not a debug picker.
      const resolvedRole = mapAuthRoleToEnterprise(userRole);
      setActiveRole(resolvedRole);

      if (!isMounted) return;
      setLifecycleState(connected ? 'READY' : 'OFFLINE');
    };

    bootSequence();

    // Re-probe on focus so the LIVE badge stays truthful after network changes
    const onFocus = () => {
      setLifecycleState('LOADING_METADATA');
      probeFirebase().then(connected => {
        if (!isMounted) return;
        setDatabaseConnected(connected);
        setLifecycleState(connected ? 'READY' : 'OFFLINE');
      });
    };
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceStateContext.Provider
      value={{
        lifecycleState,
        databaseConnected,
        activeReportId,
        setActiveReportId: openReport,
        isCopilotExpanded,
        setCopilotExpanded,
        isReplayOpen,
        setReplayOpen,
        isExplorerCollapsed,
        setExplorerCollapsed,
        language,
        setLanguage,
        reportNamingMode,
        setReportNamingMode,
        navigationMode,
        setNavigationMode,
        dateRange,
        setDateRange,
        activeRole,
        setActiveRole,
        isDeveloperMode,
        setIsDeveloperMode,
        filters,
        setFilter,
        clearFilters,
        refreshSignal,
        requestRefresh,
        favorites,
        toggleFavorite,
        recents,
        orgId,
        stationId,
        userId,
        userName
      }}
    >
      {children}
    </WorkspaceStateContext.Provider>
  );
}

export function useWorkspaceState() {
  const ctx = useContext(WorkspaceStateContext);
  if (!ctx) throw new Error('useWorkspaceState must be used within WorkspaceStateProvider');
  return ctx;
}
