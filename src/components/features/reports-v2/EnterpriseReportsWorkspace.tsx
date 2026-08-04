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

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-[#FAF8F5] rounded-2xl border border-slate-200/80 shadow-xs font-sans overflow-hidden relative">
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
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B5C3D] text-white font-extrabold text-[11px]"
            >
              <Menu size={13} /> {lang === 'ur' ? 'مینیا' : 'Menu'}
            </button>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
            >
              <span>🔍 {lang === 'ur' ? 'کمانڈ پیلیٹ' : 'Command Palette'}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono text-slate-500 shadow-2xs">Ctrl+K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden font-sans">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">🔍</span>
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder={lang === 'ur' ? 'پورے ERP میں کچھ بھی تلاش کریں (Ctrl+K)...' : 'Search anything across FuelPro ERP (Ctrl+K)...'}
                className="w-full bg-transparent border-none text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-200 dark:bg-slate-800"
              >
                ESC
              </button>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">
                {lang === 'ur' ? 'مشہور ورک اسپیسز' : 'Popular Workspaces'}
              </div>
              <button
                onClick={() => { selectReport('DOMAIN_FUEL_HOME'); setCommandPaletteOpen(false); }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <span>⛽ {lang === 'ur' ? 'فیول آپریشنز ورک اسپیس' : 'Fuel Operations Workspace'}</span>
                <span className="text-[10px] text-slate-400">DOMAIN_FUEL_HOME</span>
              </button>
              <button
                onClick={() => { selectReport('FS_REGISTER'); setCommandPaletteOpen(false); }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <span>📊 {lang === 'ur' ? 'فیول سیلز رجسٹر' : 'Fuel Sales Register'}</span>
                <span className="text-[10px] text-slate-400">FS_REGISTER</span>
              </button>
              <button
                onClick={() => { selectReport('L1'); setCommandPaletteOpen(false); }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <span>📒 {lang === 'ur' ? 'کسٹمر لیجر' : 'Customer Ledger'}</span>
                <span className="text-[10px] text-slate-400">L1</span>
              </button>
              <button
                onClick={() => { selectReport('P1'); setCommandPaletteOpen(false); }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <span>💰 {lang === 'ur' ? 'اصل منافع (True Profit)' : 'True Profit Workspace'}</span>
                <span className="text-[10px] text-slate-400">P1</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
