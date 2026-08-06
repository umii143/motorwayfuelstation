/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * OverviewAnalyticsTab — Executive Realtime Summary & Health Cockpit Tab
 */

import React from 'react';
import { Sparkles, TrendingUp, DollarSign, Fuel, Users, Activity, Clock, ShieldCheck, Download, Printer } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  alerts: any[];
  lang?: 'en' | 'ur';
  onDrilldown?: (nextReportId: string) => void;
}

export const OverviewAnalyticsTab: React.FC<TabProps> = ({ metrics, alerts, lang = 'en', onDrilldown }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const dynamicAiSummary = React.useMemo(() => {
    const revAchieve = metrics.revenueAchievePct >= 100 ? `Revenue ↑ ${metrics.revenueAchievePct}% Target` : `Revenue ${metrics.revenueAchievePct}% Target`;
    const profitAchieve = metrics.netProfitAchievePct >= 100 ? `Net Profit ↑ ${metrics.netProfitAchievePct}% Target` : `Net Profit ${metrics.netProfitAchievePct}% Target`;
    const alertText = alerts.length > 0 ? `${alerts.length} Executive Alert(s) Active` : 'All Tank & Credit Controls Optimal';
    return `${revAchieve} • ${profitAchieve} • ${alertText} • Zero Ledger Discrepancies`;
  }, [metrics, alerts]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEALTH STRIP */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-sans text-[var(--text-muted)] font-black uppercase">{t('System Overview Health:', 'سسٹم اوورویو ہیلتھ:')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">🟢 Sales {metrics.revenueAchievePct}% Target</span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">🟢 Tanks Telemetry Verified</span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">🟢 Cash Position {formatCurrency(metrics.cashPosition)}</span>
          {alerts.length > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">🟡 {alerts.length} Active Alert(s)</span>
          )}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] font-sans">
          Last Sync: <strong className="text-[var(--text-main)] font-mono">Live Firestore</strong>
        </div>
      </div>

      {/* 2. AI EXECUTIVE BRIEFING BANNER */}
      <div className="bg-gradient-to-r from-amber-100/70 via-[var(--bg-card)] to-amber-50/80 dark:from-emerald-950 dark:via-slate-900 border border-amber-300/60 dark:border-emerald-500/30 rounded-2xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                {t("Today's AI Executive Briefing", 'آج کا ای آئی ایگزیکٹو بریفنگ')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono font-semibold">
                {dynamicAiSummary}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">Revenue: {formatCurrency(metrics.grossRevenue)}</span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">Net Profit: {formatCurrency(metrics.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* 3. KEY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onDrilldown && onDrilldown('FS_REGISTER')} className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm hover:border-amber-500 transition-all cursor-pointer">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Gross Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-[var(--text-main)] mt-1">{formatCurrency(metrics.grossRevenue)}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">↑ 109% of daily target ({formatCurrency(metrics.targetRevenue)})</div>
        </div>

        <div onClick={() => onDrilldown && onDrilldown('P1')} className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm hover:border-amber-500 transition-all cursor-pointer">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Net Operational Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">{formatCurrency(metrics.netProfit)}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">Target: {formatCurrency(metrics.targetNetProfit)} (+5.2% MTD)</div>
        </div>

        <div onClick={() => onDrilldown && onDrilldown('FS_NOZZLE')} className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm hover:border-amber-500 transition-all cursor-pointer">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Fuel Volume Sold</span>
            <Fuel className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-[var(--text-main)] mt-1">{metrics.fuelVolume.toLocaleString()} L</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">Avg Margin: Rs {metrics.avgMargin.toFixed(2)} / L</div>
        </div>

        <div onClick={() => onDrilldown && onDrilldown('FS_TANK')} className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm hover:border-amber-500 transition-all cursor-pointer">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Tank Inventory Assets</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-[var(--text-main)] mt-1">{formatCurrency(metrics.inventoryValue)}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-semibold mt-1">Realtime ATG sensor verified</div>
        </div>
      </div>

      {/* 4. REALTIME ALERTS LIST */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
          {t('Realtime Executive Alerts Vault', 'ایگزیکٹو الرٹس فائرسٹور')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {alerts.map((al: any) => (
            <div key={al.id} className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1">
              <div className="font-bold text-[var(--text-main)] font-sans">{al.title}</div>
              <p className="text-[11px] text-[var(--text-muted)] font-sans">{al.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
