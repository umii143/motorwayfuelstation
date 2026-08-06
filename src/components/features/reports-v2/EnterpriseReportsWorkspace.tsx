/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0 — Enterprise Reports Workspace
 *
 * ENTERPRISE RULE #130 — Business-Process-Oriented Navigation.
 * The Business Center is a real fuel-station control room:
 *   [ Grouped Sidebar (Favorites · Recent · Groups) ] + [ BusinessCenterRouter ] (v4.1)
 * Every report is a complete workspace (Header + KPIs + Search + Filters +
 * Register + Export + Drilldown), rendered by ReportViewer.
 *
 * Warm Cream Enterprise Theme (AGENTS.md Rules #2/#3/#14/#37):
 * all surfaces/accents are theme-token driven (--bg-app, --bg-card,
 * --primary-accent …) so the module renders in the Warm Cream palette while
 * staying readable under every supported theme.
 */

import React, { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { BusinessCenterRouter } from './framework/BusinessCenterRouter';
import BusinessCenterNavigation, {
  readFavorites, readRecents, toggleFavorite as persistFavorite, pushRecent,
} from './BusinessCenterNavigation';
import { getAvailableReportIds } from '../../../lib/reports-v2/config/businessCenterMenu';
import type { GlobalSettings } from '../../../types';
import '../../../lib/reports-v2/config/proofReports';

interface EnterpriseReportsWorkspaceProps {
  settings: GlobalSettings;
  activeStationId?: string;
  orgId?: string;
  userRole?: string;
  userId?: string;
  userName?: string;
}

const AVAILABLE = new Set(getAvailableReportIds());

export default function EnterpriseReportsWorkspace({
  settings,
  activeStationId,
  orgId,
  userRole = 'owner',
  userId,
}: EnterpriseReportsWorkspaceProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>('A');
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites());
  const [recents, setRecents] = useState<string[]>(() => readRecents());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const lang: 'en' | 'ur' = settings?.language === 'ur' ? 'ur' : 'en';

  const resolvedStationId = activeStationId || 'default-station';
  const resolvedOrgId = orgId || 'default-org';

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  const selectReport = useCallback((reportId: string) => {
    // Guard: only navigate to reports that actually have a registered config.
    const target = AVAILABLE.has(reportId) ? reportId : selectedReportId;
    setSelectedReportId(target);
    if (AVAILABLE.has(reportId)) {
      setRecents(pushRecent(reportId));
    }
  }, [selectedReportId]);

  const handleToggleFavorite = useCallback((reportId: string) => {
    setFavorites(persistFavorite(reportId));
  }, []);

  // Global Ctrl+K Keyboard Shortcut Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickLaunchers = [
    { id: 'DOMAIN_FUEL_HOME', icon: '⛽', label: 'Fuel Operations Workspace', labelUr: 'فیول آپریشنز ورک اسپیس', code: 'DOMAIN_FUEL_HOME' },
    { id: 'FS_REGISTER', icon: '📊', label: 'Fuel Sales Register', labelUr: 'فیول سیلز رجسٹر', code: 'FS_REGISTER' },
    { id: 'L1', icon: '📒', label: 'Customer Ledger', labelUr: 'کسٹمر لیجر', code: 'L1' },
    { id: 'P1', icon: '💰', label: 'True Profit Workspace', labelUr: 'اصل منافع (True Profit)', code: 'P1' },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-background rounded-2xl border border-border shadow-xs font-sans overflow-hidden relative">
      {/* Grouped Business Center Navigation */}
      <BusinessCenterNavigation
        selectedReportId={selectedReportId}
        onSelectReport={selectReport}
        favorites={favorites}
        recents={recents}
        onToggleFavorite={handleToggleFavorite}
        lang={lang}
        isMobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Report Workspace */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Workspace Top Control Strip */}
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary-hover font-extrabold text-[11px] transition-all cursor-pointer active:scale-95"
            >
              <Menu size={13} /> {lang === 'ur' ? 'مینیا' : 'Menu'}
            </button>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-primary border border-border text-xs font-extrabold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span>🔍 {lang === 'ur' ? 'کمانڈ پیلیٹ' : 'Command Palette'}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono text-muted-foreground shadow-xs">Ctrl+K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Role indicator (Enterprise Header — Rule #32) */}
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary-hover text-[10px] font-extrabold capitalize">
              <span>🛡</span>
              <span>{lang === 'ur' ? (userRole === 'owner' ? 'مالک' : userRole) : userRole}</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary-hover text-[10px] font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>{lang === 'ur' ? 'آن لائن / برائے راست مطابقت' : 'Realtime Firebase Sync'}</span>
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-5 lg:p-6">
          <BusinessCenterRouter
            reportId={selectedReportId}
            stationId={resolvedStationId}
            orgId={resolvedOrgId}
            userId={userId || ''}
            role={userRole}
            lang={lang}
            onDrilldown={(nextReportId) => selectReport(nextReportId)}
            onSelectReport={(nextReportId) => selectReport(nextReportId)}
          />
        </div>
      </div>

      {/* Global Command Palette Modal (Ctrl+K) */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-border flex items-center gap-3 bg-muted">
              <span className="text-muted-foreground">🔍</span>
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder={lang === 'ur' ? 'پورے ERP میں کچھ بھی تلاش کریں (Ctrl+K)...' : 'Search anything across FuelPro ERP (Ctrl+K)...'}
                className="w-full bg-transparent border-none text-sm font-extrabold text-foreground focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted border border-border cursor-pointer"
              >
                ESC
              </button>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              <div className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1">
                {lang === 'ur' ? 'مشہور ورک اسپیسز' : 'Popular Workspaces'}
              </div>
              {quickLaunchers.map((q) => (
                <button
                  key={q.id}
                  onClick={() => { selectReport(q.id); setCommandPaletteOpen(false); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-xs font-extrabold text-foreground cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span>{q.icon} {lang === 'ur' ? q.labelUr : q.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{q.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
