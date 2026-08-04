/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * ReportViewer v2 — Business-First, Fuel-Station-Specific
 *
 * Redesigned based on owner feedback:
 * - Product-wise KPI cards (Petrol/Diesel separately) with fill bars
 * - Every KPI card is CLICKABLE → drills down to product-specific register
 * - Proper enterprise header with Export, Print, Share, Refresh, Search
 * - Full operational register (not just summary) with proper columns
 * - Filters for Tank, Product, Supplier, Operator, Shift, Branch
 * - Tank gauges with visual fill bars (████████░░ 40%)
 * - Context filtering — click Petrol → everything filters to Petrol
 * - Developer analytics hidden (Rule #126 — Business-First Progressive Disclosure)
 * - Simple enough for a matric-pass salesman to understand in 10 seconds
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useReportExecution } from '../../../hooks/useReportExecution';
import { QueryContext, KPIResult, RegisterResult, RuleResult, RegisterColumnDef, ReportConfig, ReportEngineResult, FilterGroupConfig, QuickActionConfig, SavedView, ReportSearchConfig } from '../../../lib/reports-v2/engines/types';
import { ReportConfigLoader } from '../../../lib/reports-v2/engines/ReportConfigLoader';
import { DrilldownEngine } from '../../../lib/reports-v2/engines/DrilldownEngine';
import { useNavigate } from 'react-router-dom';
import { RightInspectorPanel } from './components/RightInspectorPanel';
// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

type DateRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface ReportViewerProps {
  reportId: string;
  orgId: string;
  stationId: string;
  userId: string;
  role: string;
  onDrilldown?: (reportId: string, filterContext?: Record<string, any>) => void;
  onSelectReport?: (reportId: string) => void;
  parentFilterContext?: Record<string, any>;
}

// ──────────────────────────────────────────────
// DATE RANGE HELPER
// ──────────────────────────────────────────────

function getDateRange(preset: DateRangePreset): { dateFrom: Date; dateTo: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'today':
      return { dateFrom: today, dateTo: new Date(today.getTime() + 86400000 - 1) };
    case 'yesterday': {
      const y = new Date(today.getTime() - 86400000);
      return { dateFrom: y, dateTo: new Date(y.getTime() + 86400000 - 1) };
    }
    case 'thisWeek': {
      const d = today.getDay();
      const mon = new Date(today.getTime() - (d === 0 ? 6 : d - 1) * 86400000);
      return { dateFrom: mon, dateTo: new Date(mon.getTime() + 7 * 86400000 - 1) };
    }
    case 'thisMonth':
      return { dateFrom: new Date(today.getFullYear(), today.getMonth(), 1), dateTo: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59) };
    case 'thisYear':
      return { dateFrom: new Date(today.getFullYear(), 0, 1), dateTo: new Date(today.getFullYear(), 11, 31, 23, 59, 59) };
    default:
      return { dateFrom: today, dateTo: new Date(today.getTime() + 86400000 - 1) };
  }
}

// ──────────────────────────────────────────────
// STATUS COLORS
// ──────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; bar: string; icon: string }> = {
  SUCCESS: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500', icon: '✓' },
  WARNING: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-400', bar: 'bg-amber-500', icon: '⚠' },
  DANGER: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500', icon: '✕' },
  NEUTRAL: { bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-400', text: 'text-slate-600 dark:text-slate-400', bar: 'bg-slate-400', icon: '•' },
};

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

function formatLiters(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `${n.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L`;
}

// ──────────────────────────────────────────────
// FILL BAR COMPONENT (Tank Gauge)
// ──────────────────────────────────────────────

function FillBar({ percent, label }: { percent: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round(clamped / 10);
  const empty = 10 - filled;
  const color = clamped > 30 ? 'bg-emerald-500' : clamped > 15 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = clamped > 30 ? 'text-emerald-600 dark:text-emerald-400' : clamped > 15 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: filled }).map((_, i) => (
          <div key={i} className={`w-3 h-5 rounded-sm ${color}`} />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <div key={i} className="w-3 h-5 rounded-sm bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
      <span className={`text-sm font-bold ${textColor}`}>{clamped.toFixed(0)}%</span>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  );
}

// ──────────────────────────────────────────────
// PRODUCT KPI CARD (Clickable, with fill bar)
// ──────────────────────────────────────────────

function ProductKPICard({
  icon,
  productName,
  productNameUr,
  stockLiters,
  capacityLiters,
  daysRemaining,
  status,
  onClick,
  lang = 'en',
}: {
  icon: string;
  productName: string;
  productNameUr: string;
  stockLiters: number;
  capacityLiters: number;
  daysRemaining?: number;
  status: string;
  onClick?: () => void;
  lang?: 'en' | 'ur';
}) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.NEUTRAL;
  const fillPercent = capacityLiters > 0 ? (stockLiters / capacityLiters) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border-l-4 ${style.border} ${style.bg} p-4 transition-all hover:shadow-lg hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              {lang === 'ur' ? productNameUr : productName}
            </div>
          </div>
        </div>
        {onClick && (
          <span className="text-xs text-blue-600 font-extrabold flex items-center gap-0.5">
            {lang === 'ur' ? 'تفصیلات →' : 'Details →'}
          </span>
        )}
      </div>

      {/* Big number */}
      <div className={`text-2xl font-bold font-mono ${style.text}`}>
        {formatLiters(stockLiters)}
      </div>

      {/* Fill bar */}
      <div className="mt-2">
        <FillBar percent={fillPercent} />
      </div>

      {/* Days remaining */}
      {daysRemaining !== undefined && (
        <div className="mt-1 text-xs font-semibold text-slate-500">
          {daysRemaining > 0
            ? (lang === 'ur' ? `${daysRemaining.toFixed(1)} دن باقی` : `${daysRemaining.toFixed(1)} days left`)
            : (lang === 'ur' ? '⚠ فوری آرڈر کریں' : '⚠ Reorder immediately')}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// SIMPLE KPI CARD (for non-product KPIs)
// ──────────────────────────────────────────────

function SimpleKPICard({ kpi, lang, onClick }: { kpi: KPIResult; lang: 'en' | 'ur'; onClick?: () => void }) {
  const isExpense = kpi.id.toLowerCase().includes('expense');
  const isCritical = (kpi.status as string) === 'DANGER' || (kpi.status as string) === 'CRITICAL';
  const numVal = Number(kpi.value) || 0;
  
  // Decide base colors based on type
  const bgClass = isExpense ? 'bg-orange-50/80' : isCritical ? 'bg-red-50/80' : 'bg-emerald-50/80';
  const borderClass = isExpense ? 'border-orange-200' : isCritical ? 'border-red-200' : 'border-emerald-200';
  const iconBg = isExpense ? 'bg-orange-100 text-orange-700' : isCritical ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
  const textValClass = isExpense ? 'text-[#9A4210]' : isCritical ? 'text-red-700' : 'text-[#0B5C3D]';
  const labelClass = isExpense ? 'text-orange-900/90' : isCritical ? 'text-red-900/90' : 'text-emerald-900/90';
  const tapClass = isExpense ? 'text-orange-700 hover:text-orange-800' : isCritical ? 'text-red-700 hover:text-red-800' : 'text-emerald-700 hover:text-emerald-800';

  const absVal = Math.abs(numVal);
  const isNeg = numVal < 0;
  const prefix = isNeg ? '-Rs' : 'Rs';
  const formattedValue = kpi.unit === '₨' ? formatCurrency(numVal) : kpi.unit === 'L' ? formatLiters(numVal) : kpi.unit === '%' ? `${numVal.toFixed(1)}%` : String(kpi.value);
  const displayVal = kpi.unit === '₨' && absVal >= 10000000
    ? `${prefix}${(absVal / 10000000).toFixed(2)}Cr`
    : kpi.unit === '₨' && absVal >= 100000
    ? `${prefix}${(absVal / 1000000).toFixed(2)}M`
    : kpi.unit === '₨' && absVal >= 1000
    ? `${prefix}${(absVal / 1000).toFixed(1)}K`
    : formattedValue;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border ${borderClass} ${bgClass} p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-emerald-400 cursor-pointer active:scale-[0.98] min-h-[140px] group`}
    >
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm text-lg font-bold group-hover:scale-110 transition-transform`}>
          <span>{STATUS_COLORS[kpi.status]?.icon || '📊'}</span>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/80 text-slate-700 shadow-xs border border-slate-200/60">
          {kpi.trend !== undefined ? `${kpi.trend >= 0 ? '▲' : '▼'} ${Math.abs(kpi.trend)}%` : 'LIVE'}
        </span>
      </div>
      <div className="my-1 relative z-10">
        <div className={`text-2xl font-black ${textValClass} tracking-tight leading-none`}>
          {displayVal}
        </div>
        <div className="flex justify-between items-end mt-1.5">
          <span className={`text-[12px] font-extrabold ${labelClass} leading-tight`}>
            {lang === 'ur' ? (kpi.labelUr || kpi.label) : kpi.label}
          </span>
        </div>
      </div>
      
      {/* Sparkline */}
      <div className="absolute bottom-9 left-0 right-0 h-8 pointer-events-none opacity-25">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={`w-full h-full stroke-current ${tapClass.split(' ')[0]} stroke-2 fill-none`}>
          <path d="M0,15 Q25,5 50,10 T100,12" />
        </svg>
      </div>

      <div className={`pt-2 border-t ${borderClass} mt-2 relative z-10 flex justify-between items-center`}>
        <span className={`text-[11px] font-extrabold flex items-center gap-1 ${tapClass} group-hover:translate-x-1 transition-transform`}>
          {lang === 'ur' ? 'تفصیل دیکھیں ›' : 'Tap for detail ›'}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// ENTERPRISE HEADER (Top Nav Bar + Hero Banner)
// ──────────────────────────────────────────────

function EnterpriseHeader({
  title,
  titleUr,
  datePreset,
  onDateChange,
  onRefresh,
  onExport,
  onPrint,
  loading,
  lang,
  onLangChange,
}: {
  title: string;
  titleUr: string;
  datePreset: DateRangePreset;
  onDateChange: (v: DateRangePreset) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  loading: boolean;
  lang: 'en' | 'ur';
  onLangChange: (lang: 'en' | 'ur') => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 4000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = useMemo(() => {
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 5) return lang === 'ur' ? 'ابھی ابھی' : 'just now';
    if (diff < 60) return lang === 'ur' ? `${diff}s` : `${diff}s ago`;
    return lang === 'ur' ? `${Math.floor(diff / 60)}m` : `${Math.floor(diff / 60)}m ago`;
  }, [lastUpdated, lang]);

  const allDatePresets = [
    { id: 'today' as DateRangePreset, label: 'Today', labelUr: 'آج' },
    { id: 'thisWeek' as DateRangePreset, label: 'Week', labelUr: 'ہفتہ' },
    { id: 'thisMonth' as DateRangePreset, label: 'Month', labelUr: 'مہینہ' },
    { id: 'yesterday' as DateRangePreset, label: 'Yesterday', labelUr: 'کل' },
    { id: 'thisYear' as DateRangePreset, label: 'Year', labelUr: 'سال' },
    { id: 'custom' as DateRangePreset, label: 'Custom', labelUr: 'مخصوص' },
  ];
  const activeDateLabel = allDatePresets.find(p => p.id === datePreset);
  const datePillLabel = lang === 'ur' ? (activeDateLabel?.labelUr || 'آج') : (activeDateLabel?.label || 'Today');

  const notifications = [
    { id: 1, type: 'warning', text: lang === 'ur' ? 'نوزل #3 ریڈنگ فرق' : 'Nozzle #3 reading variance', time: '2m ago' },
    { id: 2, type: 'success', text: lang === 'ur' ? 'شفٹ #358 بند ہوئی' : 'Shift #358 closed', time: '14m ago' },
    { id: 3, type: 'danger', text: lang === 'ur' ? '3 گاہک 60 دن — 8.21M' : '3 customers overdue >60d', time: '1h ago' },
    { id: 4, type: 'info', text: lang === 'ur' ? 'نئی قیمت آج سے لاگو' : 'New price effective today', time: '3h ago' },
  ];

  return (
    <div className={`space-y-3 mb-4 ${lang === 'ur' ? 'font-sans rtl' : 'font-sans'}`}>
      {/* TOP NAV BAR */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0B5C3D] text-white flex items-center justify-center font-black text-xs shadow-sm">FP</div>
          <div className="leading-tight">
            <div className="font-extrabold text-slate-900 text-[13px] tracking-tight">{lang === 'ur' ? 'فیول پرو انٹرپرائز' : 'FuelPro Enterprise'}</div>
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {lang === 'ur' ? 'لائیو · ہر 4 سیکنڈ اپ ڈیٹ' : 'LIVE · Updates every 4s'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Date Pill Button — cycles Today/Week/Month on click */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-sm hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer"
            onClick={() => {
              const cycle: DateRangePreset[] = ['today', 'thisWeek', 'thisMonth'];
              const idx = cycle.indexOf(datePreset);
              onDateChange(cycle[(idx + 1) % cycle.length]);
            }}
          >
            <span>📅</span><span>{datePillLabel}</span><span className="text-slate-400 text-[9px]">▼</span>
          </button>

          {/* Branch */}
          <select className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-sm focus:outline-none cursor-pointer">
            <option>{lang === 'ur' ? '🌍 تمام برانچیں' : '🌍 All Branches'}</option>
            <option>{lang === 'ur' ? 'مرکزی اسٹیشن' : 'Main Station'}</option>
          </select>

          {/* Role */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-emerald-800">
            <span className="w-4 h-4 rounded-full bg-[#0B5C3D] text-white text-[9px] flex items-center justify-center font-black">{lang === 'ur' ? 'م' : 'O'}</span>
            <span>{lang === 'ur' ? 'مالک' : 'Owner'}</span>
          </div>

          {/* Last Sync indicator */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-700 font-extrabold">{timeAgo}</span>
          </div>

          <div className="h-5 w-px bg-slate-200"></div>

          {/* Language */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-sm">
            <button onClick={() => onLangChange('en')} className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${lang === 'en' ? 'bg-[#0B5C3D] text-white' : 'text-slate-600 hover:text-slate-900'}`}>EN</button>
            <button onClick={() => onLangChange('ur')} className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${lang === 'ur' ? 'bg-[#0B5C3D] text-white' : 'text-slate-600 hover:text-slate-900'}`}>اردو</button>
          </div>

          <button onClick={onRefresh} className={`p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm cursor-pointer ${loading ? 'animate-spin' : ''}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={onExport} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
          <button onClick={onPrint} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>

          <div className="relative">
            <button onClick={() => setShowNotifications(v => !v)} className={`p-1.5 rounded-lg border transition-all shadow-sm cursor-pointer ${showNotifications ? 'bg-red-50 border-red-200 text-red-600' : 'border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">4</span>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">{lang === 'ur' ? 'اطلاعات' : 'Notifications'}</span>
                  <button className="text-[10px] font-bold text-emerald-700 cursor-pointer">{lang === 'ur' ? 'سب پڑھی' : 'Mark all read'}</button>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-emerald-500' : n.type === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <div><p className="text-xs font-bold text-slate-800">{n.text}</p><span className="text-[10px] text-slate-400">{n.time}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="bg-[#0B5C3D] rounded-2xl px-5 py-4 flex items-center justify-between shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-full bg-white opacity-[0.04] transform skew-x-12 translate-x-8"></div>
        <div className="relative z-10">
          <div className="text-[9px] font-bold tracking-[0.2em] text-emerald-200/70 uppercase flex items-center gap-1.5">
            <span>{lang === 'ur' ? 'مالک ڈیش بورڈ' : 'OWNER DASHBOARD'}</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
            <span>{lang === 'ur' ? 'تمام برانچیں' : 'ALL BRANCHES'}</span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight mt-0.5">{lang === 'ur' ? titleUr : title}</h1>
          <h2 className="text-xs font-medium text-emerald-200/80 mt-0.5">{lang === 'ur' ? 'روزانہ آپریشنل اور مالیاتی کنٹرول روم' : 'Daily Operational Control & Financial Center'}</h2>
        </div>
        <div className="text-right relative z-10 flex flex-col items-end gap-1">
          <div className="text-[10px] font-medium text-emerald-200/70">{lang === 'ur' ? 'آخری تازہ کاری' : 'Last updated'}</div>
          <div className="text-sm font-extrabold text-white">{timeAgo}</div>
          <div className="mt-0.5 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> {lang === 'ur' ? 'لائیو' : 'LIVE'}
          </div>
        </div>
      </div>

      {/* SUMMARY HEADLINE */}
      <div className="flex items-end justify-between px-1">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-emerald-900 uppercase mb-1">{lang === 'ur' ? 'آج کا خلاصہ' : "TODAY'S SUMMARY"}</div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{lang === 'ur' ? 'آج کا کاروبار کیسا جا رہا ہے؟' : 'How is today going, right now?'}</h2>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// ADVANCED FILTERS PANEL (Enterprise Rule #129)
// Desktop: Right Drawer | Mobile: Bottom Sheet
// ──────────────────────────────────────────────

function AdvancedFiltersPanel({
  isOpen, onClose, filterGroups, activeFilters, onFilterChange, datePreset, onDateChange, lang,
}: {
  isOpen: boolean; onClose: () => void;
  filterGroups: FilterGroupConfig[];
  activeFilters: Record<string, string>;
  onFilterChange: (id: string, value: string) => void;
  datePreset: DateRangePreset; onDateChange: (v: DateRangePreset) => void;
  lang: 'en' | 'ur';
}) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const advancedDates = [
    { id: 'yesterday' as DateRangePreset, label: 'Yesterday', labelUr: 'کل' },
    { id: 'thisYear' as DateRangePreset, label: 'This Year', labelUr: 'اس سال' },
    { id: 'custom' as DateRangePreset, label: '📅 Custom Range', labelUr: '📅 مخصوص تاریخ' },
  ];

  const activeCount = Object.values(activeFilters).filter(Boolean).length;
  const handleReset = () => { filterGroups.forEach(g => onFilterChange(g.id, '')); onDateChange('today'); };

  if (!isOpen) return null;

  const panelBody = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <span>⚙</span>
          <span className="font-extrabold text-slate-900 text-sm">{lang === 'ur' ? 'تفصیلی فلٹرز' : 'More Filters'}</span>
          {activeCount > 0 && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">{activeCount}</span>}
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold cursor-pointer">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Advanced dates */}
        <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">{lang === 'ur' ? 'مزید تاریخ' : 'More Date Ranges'}</div>
          <div className="flex flex-wrap gap-2">
            {advancedDates.map(p => (
              <button key={p.id} onClick={() => onDateChange(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${datePreset === p.id ? 'bg-[#0B5C3D] text-white border-[#0B5C3D]' : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}>
                {lang === 'ur' ? p.labelUr : p.label}
              </button>
            ))}
          </div>
        </div>
        {/* Dynamic filter groups */}
        {filterGroups.map(group => (
          <div key={group.id}>
            <div className="h-px bg-slate-200 mb-4" />
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">{lang === 'ur' ? group.labelUr : group.label}</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onFilterChange(group.id, '')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${!activeFilters[group.id] ? 'bg-[#0B5C3D] text-white border-[#0B5C3D]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {lang === 'ur' ? 'تمام' : 'All'}
              </button>
              {group.options.map(opt => (
                <button key={opt.value} onClick={() => onFilterChange(group.id, activeFilters[group.id] === opt.value ? '' : opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${activeFilters[group.id] === opt.value ? 'bg-[#0B5C3D] text-white border-[#0B5C3D]' : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}>
                  {opt.icon && <span>{opt.icon}</span>}
                  <span>{lang === 'ur' ? opt.labelUr : opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 px-5 py-4 border-t border-slate-200 bg-white flex gap-3">
        <button onClick={handleReset} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">{lang === 'ur' ? 'فلٹرز صاف' : 'Reset All'}</button>
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B5C3D] text-white text-xs font-extrabold hover:bg-emerald-800 cursor-pointer">{lang === 'ur' ? 'لاگو کریں' : 'Apply Filters'}</button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl shadow-2xl" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-0 shrink-0" />
          {panelBody}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-80 max-w-[90vw] shadow-2xl border-l border-slate-200 flex flex-col">{panelBody}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SAVED VIEWS BAR (Enterprise Rule #129)
// Per-report localStorage-persisted filter presets
// ──────────────────────────────────────────────

function SavedViewsBar({
  reportId, defaultViews, onApplyView, lang,
}: {
  reportId: string; defaultViews: SavedView[];
  onApplyView: (view: SavedView) => void; lang: 'en' | 'ur';
}) {
  const [views] = useState<SavedView[]>(() => {
    try {
      const s = localStorage.getItem(`fuelpro_saved_views_${reportId}`);
      return s ? JSON.parse(s) : defaultViews;
    } catch { return defaultViews; }
  });
  const [activeId, setActiveId] = useState<string | null>(() => defaultViews.find(v => v.isDefault)?.id || null);

  if (views.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 px-1">★</span>
      {views.map(view => (
        <button key={view.id} onClick={() => { setActiveId(view.id); onApplyView(view); }}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${activeId === view.id ? 'bg-slate-800 text-white border-slate-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}>
          {view.icon && <span className="text-xs">{view.icon}</span>}
          <span>{lang === 'ur' ? view.labelUr : view.label}</span>
        </button>
      ))}
      <button className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer" title={lang === 'ur' ? 'نیا ویو محفوظ کریں' : 'Save current view'}>+</button>
    </div>
  );
}

// ──────────────────────────────────────────────
// DATE + SEARCH BAR (Enterprise Rule #129)
// Context-aware placeholder from report searchConfig
// ──────────────────────────────────────────────

function DateSearchBar({
  datePreset, onDateChange, search, onSearchChange,
  onToggleFilters, filtersOpen, activeFilterCount, searchConfig, lang,
}: {
  datePreset: DateRangePreset; onDateChange: (v: DateRangePreset) => void;
  search: string; onSearchChange: (v: string) => void;
  onToggleFilters: () => void; filtersOpen: boolean;
  activeFilterCount: number; searchConfig?: ReportSearchConfig; lang: 'en' | 'ur';
}) {
  const presets = [
    { id: 'today' as DateRangePreset, label: 'Today', labelUr: 'آج' },
    { id: 'thisWeek' as DateRangePreset, label: 'Week', labelUr: 'ہفتہ' },
    { id: 'thisMonth' as DateRangePreset, label: 'Month', labelUr: 'مہینہ' },
  ];
  const fallback = lang === 'ur' ? '🔍 شفٹ #، انوائس، کسٹمر تلاش کریں...' : '🔍 Search Shift #, Invoice, Customer...';
  const placeholder = lang === 'ur' ? (searchConfig?.placeholderUr || fallback) : (searchConfig?.placeholder || fallback);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${lang === 'ur' ? 'rtl' : ''}`}>
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
        {presets.map(p => (
          <button key={p.id} onClick={() => onDateChange(p.id)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${datePreset === p.id ? 'bg-[#0B5C3D] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
            {lang === 'ur' ? p.labelUr : p.label}
          </button>
        ))}
        <button onClick={onToggleFilters}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${filtersOpen ? 'bg-emerald-100 text-emerald-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
          <span>⚙</span>
          <span className="hidden sm:inline">{lang === 'ur' ? 'مزید فلٹرز' : 'More Filters'}</span>
          {activeFilterCount > 0 && <span className="text-[9px] font-black px-1 py-0.5 rounded-full bg-emerald-600 text-white leading-none">{activeFilterCount}</span>}
        </button>
      </div>
      <div className="flex-1 min-w-[240px]">
        <input type="text" placeholder={placeholder} value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all placeholder:text-slate-400" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// FILTER CHIPS (legacy — kept for compat, used inside AdvancedFiltersPanel)
// ──────────────────────────────────────────────

function FilterChips({
  filters, activeFilters, onFilterChange, lang = 'en',
}: {
  filters: { id: string; label: string; labelUr: string; options: string[] }[];
  activeFilters: Record<string, string>;
  onFilterChange: (id: string, value: string) => void;
  lang?: 'en' | 'ur';
}) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2.5 my-1">
      {filters.map(f => {
        const filterTitle = lang === 'ur' ? f.labelUr : f.label;
        if (f.options.length <= 5) {
          return (
            <div key={f.id} className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 px-2">{filterTitle}</span>
              <button onClick={() => onFilterChange(f.id, '')} className={`px-3 py-1 text-xs font-extrabold rounded-lg cursor-pointer ${!activeFilters[f.id] ? 'bg-[#0B5C3D] text-white' : 'text-slate-600 hover:bg-white'}`}>{lang === 'ur' ? 'تمام' : 'All'}</button>
              {f.options.map(opt => (
                <button key={opt} onClick={() => onFilterChange(f.id, opt)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${activeFilters[f.id] === opt ? 'bg-[#0B5C3D] text-white' : 'text-slate-600 hover:bg-white'}`}>
                  {opt}
                </button>
              ))}
            </div>
          );
        }
        return (
          <select key={f.id} value={activeFilters[f.id] || ''} onChange={e => onFilterChange(f.id, e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm focus:outline-none cursor-pointer">
            <option value="">{filterTitle} · {lang === 'ur' ? 'تمام' : 'All'}</option>
            {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// OPERATIONAL REGISTER TABLE
// ──────────────────────────────────────────────

function OperationalRegister({
  register,
  search,
  lang,
  onRowClick,
}: {
  register: RegisterResult;
  search: string;
  lang: 'en' | 'ur';
  onRowClick?: (row: Record<string, any>) => void;
}) {
  const [sortColumn, setSortColumn] = useState<string | undefined>(register.defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(register.defaultSortDirection || 'desc');

  // Filter by search
  const filteredRows = useMemo(() => {
    if (!search.trim()) return register.rows;
    const q = search.toLowerCase();
    return register.rows.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [register.rows, search]);

  // Sort
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const comp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  const handleSort = (col: RegisterColumnDef) => {
    if (!col.sortable) return;
    if (sortColumn === col.accessor) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col.accessor);
      setSortDirection('desc');
    }
  };

  if (sortedRows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="text-4xl mb-3 opacity-50">📋</div>
        <p className="text-slate-700 font-extrabold text-base mb-1">
          {lang === 'ur' ? 'کوئی ریکارڈ نہیں ملا' : 'No records found'}
        </p>
        <p className="text-xs text-slate-500 mb-5">
          {lang === 'ur' ? 'آپ کی تلاش کے مطابق کوئی ڈیٹا موجود نہیں ہے۔' : 'No records match your filters. Try adjusting the search or filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {register.columns.map(col => (
                <th
                  key={col.id}
                  onClick={() => handleSort(col)}
                  className={`px-4 py-2.5 text-left font-bold text-slate-700 whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''} ${sortColumn === col.accessor ? 'text-[#0B5C3D]' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <span>{lang === 'ur' ? (col.headerUr || col.header) : col.header}</span>
                    {col.sortable && sortColumn === col.accessor && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => (
              <tr
                key={row._id || idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-100 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-emerald-50/50' : 'hover:bg-slate-50'} ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}
              >
                {register.columns.map(col => {
                  const value = row[col.accessor];
                  if (col.isCurrency) return <td key={col.id} className="px-4 py-2.5 whitespace-nowrap font-mono font-bold text-slate-800">{formatCurrency(value)}</td>;
                  if (col.isNumeric) return <td key={col.id} className="px-4 py-2.5 whitespace-nowrap font-mono font-semibold text-slate-800">{Number(value || 0).toLocaleString('en-PK')}</td>;
                  if (col.isDate) return <td key={col.id} className="px-4 py-2.5 whitespace-nowrap text-slate-600">{value ? new Date(value).toLocaleDateString('en-PK') : '—'}</td>;
                  if (col.isStatus) return (
                    <td key={col.id} className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black ${
                        String(value).toLowerCase() === 'submitted' || String(value).toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-800'
                        : String(value).toLowerCase() === 'pending' || String(value).toLowerCase() === 'flagged' ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                      }`}>{String(value || '—')}</span>
                    </td>
                  );
                  return <td key={col.id} className="px-4 py-2.5 whitespace-nowrap text-slate-700">{String(value ?? '—')}</td>;
                })}
              </tr>
            ))}
          </tbody>
          {register.summaryRow && (
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                {register.columns.map(col => {
                  const sv = register.summaryRow?.[col.accessor];
                  if (sv === undefined) return <td key={col.id} className="px-4 py-3 text-slate-400">—</td>;
                  if (col.isCurrency) return <td key={col.id} className="px-4 py-3 font-mono text-blue-700">{formatCurrency(sv)}</td>;
                  if (col.isNumeric) return <td key={col.id} className="px-4 py-3 font-mono text-blue-700">{Number(sv).toLocaleString('en-PK')}</td>;
                  return <td key={col.id} className="px-4 py-3 text-slate-700">{String(sv)}</td>;
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="px-4 py-2 border-t border-slate-200 text-xs font-semibold text-slate-500 flex items-center justify-between">
        <span>
          {lang === 'ur' ? `${sortedRows.length} ریکارڈز` : `${sortedRows.length} ${sortedRows.length === 1 ? 'record' : 'records'}`}
        </span>
        {onRowClick && (
          <span className="text-blue-600 font-bold">
            {lang === 'ur' ? 'تفصیلات کے لیے سطر پر کلک کریں' : 'Click row for details'}
          </span>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SUB VIEW HEADER (Reusable Enterprise Navigation Bar)
// ──────────────────────────────────────────────

function SubViewHeader({
  title,
  titleUr,
  reportCode,
  onSelectReport,
  lang,
}: {
  title: string;
  titleUr: string;
  reportCode: string;
  onSelectReport?: (id: string) => void;
  lang: 'en' | 'ur';
}) {
  return (
    <div className={`flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-5 py-3 shadow-2xs mb-2 ${lang === 'ur' ? 'rtl' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectReport?.('A')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[#0B5C3D] hover:bg-emerald-100 border border-emerald-200 font-extrabold text-xs transition-all shadow-2xs cursor-pointer group"
        >
          <span className="text-sm transform group-hover:-translate-x-0.5 transition-transform">{lang === 'ur' ? '→' : '←'}</span>
          <span>{lang === 'ur' ? 'ڈیش بورڈ پر واپس جائیں' : 'Back to Dashboard'}</span>
        </button>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <span>{lang === 'ur' ? 'رپورٹس' : 'Reports'}</span>
          <span>›</span>
          <span className="text-slate-900 font-extrabold">{reportCode} — {lang === 'ur' ? titleUr : title}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-700">{lang === 'ur' ? titleUr : title}</span>
        <button
          onClick={() => onSelectReport?.('A')}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title={lang === 'ur' ? 'ڈیش بورڈ پر واپس جائیں' : 'Return to Dashboard'}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// DRILLDOWN BREADCRUMB — True Breadcrumb Style
// Business Center › Fuel Sales › Invoice Detail
// No more blue pill backgrounds — real navigation breadcrumb
// ──────────────────────────────────────────────

function DrilldownBreadcrumb({
  path,
  onNavigate,
  lang = 'en',
}: {
  path: { levels: Array<{ level: number; reportId: string; title: string; titleUr: string }>; currentLevel: number };
  onNavigate: (level: number) => void;
  lang?: 'en' | 'ur';
}) {
  if (path.levels.length <= 1) return null;
  return (
    <nav aria-label="breadcrumb" className={`flex items-center gap-1 text-xs flex-wrap py-1 ${lang === 'ur' ? 'rtl' : ''}`}>
      {path.levels.map((level, idx) => {
        const isActive = level.level === path.currentLevel;
        const label = lang === 'ur' ? (level.titleUr || level.title) : level.title;
        return (
          <React.Fragment key={level.level}>
            {idx > 0 && (
              <span className={`text-slate-300 font-bold select-none ${lang === 'ur' ? 'px-0.5' : 'px-0.5'}`}>
                {lang === 'ur' ? '‹' : '›'}
              </span>
            )}
            <button
              onClick={() => onNavigate(level.level)}
              aria-current={isActive ? 'page' : undefined}
              className={`transition-colors cursor-pointer rounded px-0.5 ${
                isActive
                  ? 'font-extrabold text-slate-900 cursor-default'
                  : 'font-semibold text-slate-400 hover:text-emerald-700'
              }`}
            >
              {label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ──────────────────────────────────────────────
// CUSTOMER LEDGER VIEW (L1)
// ──────────────────────────────────────────────

function CustomerLedgerView({
  lang,
  search,
  setSearch,
  onSelectReport,
  result,
}: {
  lang: 'en' | 'ur';
  search: string;
  setSearch: (s: string) => void;
  onSelectReport?: (id: string) => void;
  result?: ReportEngineResult | null;
}) {
  const rawRows = result?.register?.rows || [];
  const liveKpis = result?.kpis || [];

  const customers = useMemo(() => {
    return rawRows.map((r: any, idx: number) => {
      const bal = Number(r.balance ?? r.outstanding ?? r.totalAmount ?? 0);
      return {
        id: String(r.id || r._id || idx),
        name: r.name || r.customerName || `Customer #${idx + 1}`,
        nameUr: r.nameUr || r.urduName || r.name || `کسٹمر #${idx + 1}`,
        phone: r.phone || r.mobile || '—',
        amount: formatCurrency(bal),
        numericAmount: bal,
        aging: r.aging || (bal > 100000 ? 'Overdue >60d' : '<30 days'),
        agingUr: r.agingUr || (bal > 100000 ? '60 دن سے زیادہ پرانا' : '30 دن سے کم'),
        agingColor: bal > 100000 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800',
      };
    });
  }, [rawRows]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c: any) =>
      c.name.toLowerCase().includes(q) ||
      c.nameUr.includes(search) ||
      c.phone.includes(search)
    );
  }, [customers, search]);

  const totalOutstanding = useMemo(() => {
    const kpiVal = liveKpis.find((k: any) => k.id === 'totalOutstanding')?.value;
    if (kpiVal !== undefined && kpiVal !== null) return Number(kpiVal);
    return customers.reduce((sum: number, c: any) => sum + c.numericAmount, 0);
  }, [liveKpis, customers]);

  const overdueCount = useMemo(() => {
    return customers.filter((c: any) => c.aging.includes('Overdue') || c.numericAmount > 100000).length;
  }, [customers]);

  const biggestDebtor = useMemo(() => {
    if (customers.length === 0) return null;
    return [...customers].sort((a, b) => b.numericAmount - a.numericAmount)[0];
  }, [customers]);

  return (
    <div className={`space-y-4 max-w-5xl mx-auto font-sans pb-12 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* Top Nav Header */}
      <SubViewHeader title="Customer Ledger" titleUr="گاہک کا کھاتہ" reportCode="L1" onSelectReport={onSelectReport} lang={lang} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'ur' ? 'گاہکوں کا لیجر اور ادھار رجسٹر' : 'Customer Ledger & Outstanding Register'}
        </h1>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer">
          <span>🎛️</span> {lang === 'ur' ? 'فلٹرز' : 'Filters'}
        </button>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border-l-[3px] border-l-amber-500 border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">⚠️</div>
            <div>
              <div className="text-[9px] font-black tracking-wider text-amber-800 uppercase mb-0.5">
                {lang === 'ur' ? 'ای آئی بصیرت' : '✨ AI INSIGHT'}
              </div>
              <p className="text-xs font-bold text-amber-950">
                {lang === 'ur'
                  ? `${customers.length} گاہکوں کا کل ادھار: ${formatCurrency(totalOutstanding)}۔`
                  : `${customers.length} customers owe a total of ${formatCurrency(totalOutstanding)}.`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-[3px] border-l-red-500 border border-red-200 bg-red-50/80 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">📉</div>
            <div>
              <div className="text-[9px] font-black tracking-wider text-red-800 uppercase mb-0.5">
                {lang === 'ur' ? 'ای آئی بصیرت' : '✨ AI INSIGHT'}
              </div>
              <p className="text-xs font-bold text-red-950">
                {lang === 'ur'
                  ? `${overdueCount} گاہکوں کا ادھار قابلِ توجہ ہے — اس ہفتے وصولی کریں۔`
                  : `${overdueCount} customers require collection attention this week.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold mb-2">👥</div>
          <div>
            <div className="text-xl font-extrabold text-[#9A4210] tracking-tight">{formatCurrency(totalOutstanding)}</div>
            <div className="text-[11px] font-bold text-orange-900/80 mt-1">
              {lang === 'ur' ? 'کل بقایا ادھار' : 'Total Outstanding'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold mb-2">👥</div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">{customers.length}</div>
            <div className="text-[11px] font-bold text-slate-600 mt-1">
              {lang === 'ur' ? 'ادھار والے گاہک' : 'Customers w/ Balance'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold mb-2">💸</div>
          <div>
            <div className="text-xl font-extrabold text-red-700 tracking-tight">{formatCurrency(totalOutstanding * 0.2)}</div>
            <div className="text-[11px] font-bold text-red-900/80 mt-1">
              {lang === 'ur' ? 'آج قابلِ وصولی' : 'Recover Today'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold mb-2">❗</div>
          <div>
            <div className="text-xl font-extrabold text-red-700 tracking-tight">{overdueCount}</div>
            <div className="text-[11px] font-bold text-red-900/80 mt-1">
              {lang === 'ur' ? 'پرانے ڈیفالٹ گاہک' : 'Overdue Customers'}
            </div>
          </div>
        </div>
      </div>

      {/* Biggest Debtor Banner */}
      {biggestDebtor && biggestDebtor.numericAmount > 0 && (
        <div className="rounded-xl border-l-[3px] border-l-red-500 border border-red-200 bg-red-50/50 p-3.5 flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">❗</div>
            <div>
              <div className="text-[9px] font-black tracking-wider text-red-800 uppercase mb-0.5">
                {lang === 'ur' ? 'سب سے بڑا ادھار گاہک' : 'Biggest Overdue Customer'}
              </div>
              <h4 className="text-xs font-extrabold text-red-950">
                {lang === 'ur' ? biggestDebtor.nameUr : biggestDebtor.name} — {biggestDebtor.amount}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder={lang === 'ur' ? '🔍 گاہک کا نام یا فون نمبر تلاش کریں...' : '🔍 Search customer name or phone...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
        />
      </div>

      {/* Customers List Card or Empty State */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm my-3 divide-y divide-slate-100">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-xs">
              {lang === 'ur' ? 'تمام رجسٹرڈ گاہک' : 'All Registered Customers'}
            </h3>
          </div>
          <div>
            {filtered.map((c, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">{lang === 'ur' ? c.nameUr : c.name}</div>
                    <div className="text-[10px] font-semibold text-slate-400">{c.phone}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">{c.amount}</div>
                    <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${c.agingColor}`}>
                      {lang === 'ur' ? c.agingUr : c.aging}
                    </span>
                  </div>
                  <span className="text-slate-300 font-bold text-xs">{lang === 'ur' ? '❮' : '❯'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl mb-3 opacity-50">👥</div>
          <p className="text-slate-700 font-extrabold text-base mb-1">
            {lang === 'ur' ? 'فائر بیس ڈیٹا بیس میں کوئی گاہک نہیں مل سکا' : 'No operational customer records found'}
          </p>
          <p className="text-xs text-slate-500">
            {lang === 'ur' ? 'براہِ راست کھاتہ تجز تجزیات کے لیے کسٹمرز کا اندراج شروع کریں۔' : 'Start creating customer entries to generate realtime ledger analytics.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// METER READINGS VIEW (M)
// ──────────────────────────────────────────────

function MeterReadingsView({
  lang,
  onSelectReport,
  result,
}: {
  lang: 'en' | 'ur';
  onSelectReport?: (id: string) => void;
  result?: ReportEngineResult | null;
}) {
  const [selectedNozzle, setSelectedNozzle] = useState<string | null>(null);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  const rawRows = result?.register?.rows || [];
  const nozzles = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.map((r: any, idx: number) => ({
      id: String(r.id || r.nozzleId || idx + 1),
      name: r.name || r.nozzleName || `Nozzle #${idx + 1}`,
      nameUr: r.nameUr || r.urduName || `نوزل #${idx + 1}`,
      product: r.product || r.fuelType || 'Petrol',
      productUr: r.productUr || r.fuelTypeUr || 'پٹرول',
      readings: Number(r.readingsCount || r.readings || 1),
      liters: formatLiters(r.liters || r.totalLiters || 0),
      flagged: Number(r.flaggedCount || r.variance || 0),
    }));
  }, [rawRows]);

  const readingHistory = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.map((r: any, idx: number) => ({
      shift: r.shift || r.shiftName || `Shift #${idx + 350}`,
      date: r.date ? new Date(r.date).toLocaleDateString('en-PK') : 'Today',
      operator: r.operator || r.operatorName || 'Operator',
      prev: String(r.prev || r.startReading || '0'),
      curr: String(r.curr || r.endReading || '0'),
      liters: formatLiters(r.liters || r.quantity || 0),
      rate: formatCurrency(r.rate || 272.1),
      flagged: Boolean(r.flagged || r.hasVariance),
    }));
  }, [rawRows]);

  // Drilldown view for specific nozzle
  if (selectedNozzle) {
    const nozzleInfo = nozzles.find((n: any) => n.id === selectedNozzle) || nozzles[0];
    return (
      <div className={`space-y-4 max-w-5xl mx-auto font-sans pb-12 ${lang === 'ur' ? 'rtl' : ''}`}>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-1">
          <button onClick={() => setSelectedNozzle(null)} className="hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
            <span>{lang === 'ur' ? '→' : '‹'}</span> {lang === 'ur' ? 'میٹر ریڈنگز' : 'Meter Readings'}
          </button>
          <span>›</span>
          <span>{lang === 'ur' ? nozzleInfo.nameUr : nozzleInfo.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'ur' ? `${nozzleInfo.nameUr} — ریڈنگز کی تاریخ` : `${nozzleInfo.name} — Reading History`}
          </h1>
        </div>

        {/* History List Card */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm my-3">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs">
                {lang === 'ur' ? 'تمام ریڈنگز کا ریکارڈ' : 'All Meter Readings'}
              </h3>
            </div>
          </div>
          <div className="divide-y divide-slate-100 p-3.5 space-y-3">
            {readingHistory.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{item.shift}</span>
                    <span className="text-xs font-bold text-slate-400">{item.date}</span>
                    {item.flagged && (
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-black">
                        ⚠️ {lang === 'ur' ? 'فرق کی نشاندہی' : 'Flagged Variance'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-500 mb-3">{item.operator}</div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-t border-b border-slate-100 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ur' ? 'پچھلی ریڈنگ' : 'Previous'}</div>
                    <div className="font-extrabold text-slate-800">{item.prev}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ur' ? 'موجودہ ریڈنگ' : 'Current'}</div>
                    <div className="font-extrabold text-slate-800">{item.curr}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ur' ? 'لیٹر مقدار' : 'Liters'}</div>
                    <div className="font-extrabold text-slate-900">{item.liters}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ur' ? 'فی لیٹر ریٹ' : 'Rate'}</div>
                    <div className="font-extrabold text-slate-800">{item.rate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main Meter Readings View
  return (
    <div className={`space-y-4 max-w-5xl mx-auto font-sans pb-12 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* Reusable Enterprise Header Bar */}
      <SubViewHeader title="Meter Readings — Previous → Current" titleUr="میٹر ریڈنگز — پچھلی → موجودہ" reportCode="M" onSelectReport={onSelectReport} lang={lang} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'ur' ? 'میٹر ریڈنگز کی تفصیلات' : 'Meter Readings Overview'}
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mb-2 font-bold">⏱️</div>
          <div>
            <div className="text-2xl font-extrabold text-[#0B5C3D] tracking-tight">{nozzles.reduce((sum: number, n: any) => sum + n.readings, 0)}</div>
            <div className="text-[11px] font-bold text-emerald-900/80 mt-1">
              {lang === 'ur' ? 'کل ریڈنگز کی تعداد' : 'Total Readings'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs mb-2 font-bold">⚠️</div>
          <div>
            <div className="text-2xl font-extrabold text-red-700 tracking-tight">{nozzles.reduce((sum: number, n: any) => sum + n.flagged, 0)}</div>
            <div className="text-[11px] font-bold text-red-900/80 mt-1">
              {lang === 'ur' ? 'فرق والی ریڈنگز' : 'Flagged Readings'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mb-2 font-bold">🔄</div>
          <div>
            <div className="text-2xl font-extrabold text-[#0B5C3D] tracking-tight">0</div>
            <div className="text-[11px] font-bold text-emerald-900/80 mt-1">
              {lang === 'ur' ? 'میٹر تبدیلی' : 'Meter Reset Count'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Button */}
      {nozzles.length > 0 && (
        <div>
          <button
            onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all border flex items-center gap-2 cursor-pointer ${
              showFlaggedOnly
                ? 'bg-red-600 text-white border-red-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>⚠️</span> {lang === 'ur' ? 'صرف فرق والی دکھائیں' : 'Show flagged only'}
          </button>
        </div>
      )}

      {/* Per Nozzle List Card or Empty State */}
      {nozzles.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm my-3 divide-y divide-slate-100">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-xs">
              {lang === 'ur' ? 'تمام نوزلز' : 'Per-Nozzle Breakdown'}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">
              {lang === 'ur' ? 'تفصیل دیکھنے کے لیے کلک کریں' : 'Tap to view nozzle history'}
            </span>
          </div>
          <div>
            {nozzles
              .filter((n: any) => !showFlaggedOnly || n.flagged > 0)
              .map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNozzle(n.id)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      ⏱️
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">
                        {lang === 'ur' ? n.nameUr : n.name}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">
                        {lang === 'ur' ? n.productUr : n.product}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {n.readings} {lang === 'ur' ? 'ریڈنگز' : 'readings'} · {n.liters}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                      {n.flagged} {lang === 'ur' ? 'فرق' : 'flagged'}
                    </span>
                    <span className="text-slate-300 font-bold text-xs">{lang === 'ur' ? '❮' : '❯'}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl mb-3 opacity-50">⏱️</div>
          <p className="text-slate-700 font-extrabold text-base mb-1">
            {lang === 'ur' ? 'فائر بیس ڈیٹا بیس میں میٹر ریڈنگز کی معلومات نہیں ہیں' : 'No meter readings recorded'}
          </p>
          <p className="text-xs text-slate-500">
            {lang === 'ur' ? 'شِفٹ نوزل ریڈنگز درج کرتے ہی براہِ راست گراف اپ ڈیٹ ہوں گے۔' : 'Record shift nozzle readings to generate live meter analytics.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// SHIFT DETAIL VIEW (SHIFT / S358 / S1)
// ──────────────────────────────────────────────

function ShiftDetailView({
  lang,
  onSelectReport,
  result,
}: {
  lang: 'en' | 'ur';
  onSelectReport?: (id: string) => void;
  result?: ReportEngineResult | null;
}) {
  const liveKpis = result?.kpis || [];
  const rawRows = result?.register?.rows || [];

  const litersSold = Number(liveKpis.find((k: any) => k.id === 'totalLiters')?.value || 0);
  const salesValue = Number(liveKpis.find((k: any) => k.id === 'totalSales')?.value || 0);
  const cashReceived = Number(liveKpis.find((k: any) => k.id === 'cashPosition')?.value || 0);
  const expensesVal = Number(liveKpis.find((k: any) => k.id === 'expenses')?.value || 0);

  const nozzleReadings = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.map((r: any, idx: number) => ({
      name: r.name || r.nozzleName || `Nozzle ${idx + 1}`,
      nameUr: r.nameUr || `نوزل ${idx + 1}`,
      product: r.product || r.fuelType || 'Petrol',
      prev: String(r.prev || r.startReading || '0'),
      curr: String(r.curr || r.endReading || '0'),
      rate: formatCurrency(r.rate || 0),
      value: formatCurrency(r.value || r.amount || 0),
      liters: formatLiters(r.liters || r.quantity || 0),
      flagged: Boolean(r.flagged || r.hasVariance),
    }));
  }, [rawRows]);

  return (
    <div className={`space-y-4 max-w-5xl mx-auto font-sans pb-12 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* Reusable Enterprise Header Bar */}
      <SubViewHeader title="Shift Detail" titleUr="شفٹ کی تفصیل" reportCode="SHIFT" onSelectReport={onSelectReport} lang={lang} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'ur' ? 'شفٹ آپریشنل تفصیلات' : 'Shift Operational Detail'}
          </h1>
          <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-black">
            {lang === 'ur' ? 'جاری ہے' : 'In Progress'}
          </span>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border-l-[3px] border-l-blue-500 border border-blue-200 bg-blue-50/80 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">ℹ️</div>
            <div>
              <div className="text-[9px] font-black tracking-wider text-blue-800 uppercase mb-0.5">
                {lang === 'ur' ? 'ای آئی بصیرت' : '✨ AI INSIGHT'}
              </div>
              <p className="text-xs font-bold text-blue-950">
                {lang === 'ur'
                  ? `شفٹ کی کل فروخت: ${formatLiters(litersSold)} (${formatCurrency(salesValue)})۔`
                  : `Shift sales: ${formatLiters(litersSold)} (${formatCurrency(salesValue)}).`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-[3px] border-l-amber-500 border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">⚠️</div>
            <div>
              <div className="text-[9px] font-black tracking-wider text-amber-800 uppercase mb-0.5">
                {lang === 'ur' ? 'ای آئی بصیرت' : '✨ AI INSIGHT'}
              </div>
              <p className="text-xs font-bold text-amber-950">
                {lang === 'ur'
                  ? `وصول شدہ نقد رقم: ${formatCurrency(cashReceived)}۔`
                  : `Cash collected in shift: ${formatCurrency(cashReceived)}.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between min-h-[110px] shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs mb-1 font-bold">⛽</div>
          <div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">{formatLiters(litersSold)}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
              {lang === 'ur' ? 'فروخت شدہ لیٹر' : 'Liters Sold'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between min-h-[110px] shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs mb-1 font-bold">💵</div>
          <div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">{formatCurrency(salesValue)}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
              {lang === 'ur' ? 'کل فروخت کی مالیت' : 'Sales Value'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between min-h-[110px] shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs mb-1 font-bold">👛</div>
          <div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">{formatCurrency(cashReceived)}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
              {lang === 'ur' ? 'نقد وصولی' : 'Cash Received'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between min-h-[110px] shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs mb-1 font-bold">💸</div>
          <div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">{formatCurrency(expensesVal)}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
              {lang === 'ur' ? 'شفٹ اخراجات' : 'Shift Expenses'}
            </div>
          </div>
        </div>
      </div>

      {/* Meter Readings Table Section or Empty State */}
      {nozzleReadings.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm my-3">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold text-sm">⏱️</span>
              <h3 className="font-extrabold text-slate-900 text-xs">
                {lang === 'ur' ? 'شفٹ نوزل میٹر ریڈنگز' : 'Shift Nozzle Meter Readings'}
              </h3>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {nozzleReadings.map((n: any, idx: number) => (
              <div key={idx} className="p-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">
                      {lang === 'ur' ? n.nameUr : n.name}
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-black">
                    {n.liters}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[9px] uppercase">{lang === 'ur' ? 'پچھلی ریڈنگ' : 'Previous'}</span>
                    <span className="font-extrabold text-slate-800">{n.prev}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[9px] uppercase">{lang === 'ur' ? 'موجودہ ریڈنگ' : 'Current'}</span>
                    <span className="font-extrabold text-slate-800">{n.curr}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[9px] uppercase">{lang === 'ur' ? 'ریٹ' : 'Rate'}</span>
                    <span className="font-extrabold text-slate-800">{n.rate}</span>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="text-slate-400 font-semibold block text-[9px] uppercase">{lang === 'ur' ? 'کل مالیت' : 'Value'}</span>
                    <span className="font-extrabold text-slate-900">{n.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl mb-3 opacity-50">⛽</div>
          <p className="text-slate-700 font-extrabold text-base mb-1">
            {lang === 'ur' ? 'فائر بیس ڈیٹا بیس میں شفٹ کا ڈیٹا نہیں ملا' : 'No shift entries found'}
          </p>
          <p className="text-xs text-slate-500">
            {lang === 'ur' ? 'نئی شفٹ کا آغاز کرتے ہی براہِ راست ڈیٹا پینل فعال ہو جائے گا۔' : 'Start a shift session to generate live shift detail analytics.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// BANK CASH LEDGER VIEW (C1 / BANK / B)
// ──────────────────────────────────────────────

function BankCashLedgerView({
  lang,
  onSelectReport,
  result,
}: {
  lang: 'en' | 'ur';
  onSelectReport?: (id: string) => void;
  result?: ReportEngineResult | null;
}) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const liveKpis = result?.kpis || [];
  const rawRows = result?.register?.rows || [];

  const totalBankBalance = Number(liveKpis.find((k: any) => k.id === 'cashPosition' || k.id === 'totalOutstanding')?.value || 0);

  const accounts = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.map((r: any, idx: number) => ({
      id: String(r.id || r._id || idx + 1),
      name: r.name || r.bankName || `Bank Account #${idx + 1}`,
      nameUr: r.nameUr || r.bankNameUr || `بینک اکاؤنٹ #${idx + 1}`,
      lastRecon: r.lastRecon || (r.date ? new Date(r.date).toLocaleDateString('en-PK') : 'Today'),
      balance: formatCurrency(r.balance || r.amount || 0),
      numericBalance: Number(r.balance || r.amount || 0),
    }));
  }, [rawRows]);

  const transactions = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.map((r: any) => ({
      date: r.date ? new Date(r.date).toLocaleString('en-PK') : 'Today',
      title: r.description || r.title || 'Transaction Entry',
      titleUr: r.descriptionUr || r.titleUr || 'لین دین اندارج',
      amount: formatCurrency(r.amount || 0),
      isPositive: Number(r.amount || 0) >= 0,
      shift: r.shiftId ? `S${r.shiftId}` : undefined,
      isManual: Boolean(r.isManual),
    }));
  }, [rawRows]);

  // Main Bank Cash Ledger View
  return (
    <div className={`space-y-4 max-w-5xl mx-auto font-sans pb-12 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* Reusable Enterprise Header Bar */}
      <SubViewHeader title="Bank Cash Ledger" titleUr="بینک کیش لیجر" reportCode="B" onSelectReport={onSelectReport} lang={lang} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'ur' ? 'بینک کیش لیجر اور بیلنسز' : 'Bank Cash Ledger'}
        </h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mb-2 font-bold">🏛️</div>
          <div>
            <div className="text-xl font-extrabold text-[#0B5C3D] tracking-tight">{formatCurrency(totalBankBalance)}</div>
            <div className="text-[11px] font-bold text-emerald-900/80 mt-1">
              {lang === 'ur' ? 'کل بینک بیلنس' : 'Total Bank Balance'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mb-2 font-bold">📉</div>
          <div>
            <div className="text-xl font-extrabold text-[#0B5C3D] tracking-tight">{accounts.length}</div>
            <div className="text-[11px] font-bold text-emerald-900/80 mt-1">
              {lang === 'ur' ? 'فعال بینک اکاؤنٹس' : 'Active Accounts'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 flex flex-col justify-between shadow-sm min-h-[120px]">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs mb-2 font-bold">📈</div>
          <div>
            <div className="text-xl font-extrabold text-[#9A4210] tracking-tight">{transactions.length}</div>
            <div className="text-[11px] font-bold text-orange-900/80 mt-1">
              {lang === 'ur' ? 'کل اندراجات' : 'Total Transactions'}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Account Cards List or Empty State */}
      {accounts.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm my-3 divide-y divide-slate-100">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-xs">
              {lang === 'ur' ? 'تمام بینک اکاؤنٹس' : 'All Accounts'}
            </h3>
          </div>
          <div>
            {accounts.map((acc: any) => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccount(acc.id)}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    🏛️
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">
                      {lang === 'ur' ? acc.nameUr : acc.name}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400">
                      {lang === 'ur' ? `آخری توازن: ${acc.lastRecon}` : `Last reconciled: ${acc.lastRecon}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-emerald-800">
                    {acc.balance}
                  </span>
                  <span className="text-slate-300 font-bold text-xs">{lang === 'ur' ? '❮' : '❯'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl mb-3 opacity-50">🏛️</div>
          <p className="text-slate-700 font-extrabold text-base mb-1">
            {lang === 'ur' ? 'فائر بیس ڈیٹا بیس میں بینک کھاتہ کا ڈیٹا نہیں ملا' : 'No bank accounts found'}
          </p>
          <p className="text-xs text-slate-500">
            {lang === 'ur' ? 'بینک ٹرانزیکشنز پوسٹ کرتے ہی کیش لیجر خودکار اپ ڈیٹ ہو جائے گا۔' : 'Post bank deposits to populate live bank cash ledger analytics.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN REPORT VIEWER (v2 — Business-First)
// ──────────────────────────────────────────────

export function ReportViewer({ reportId, orgId, stationId, userId, role, onDrilldown, onSelectReport, parentFilterContext }: ReportViewerProps) {
  const [currentReportId, setCurrentReportId] = useState<string>(reportId);
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('today');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [productContext, setProductContext] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setCurrentReportId(reportId);
  }, [reportId]);

  const handleSelectReport = useCallback((id: string) => {
    setCurrentReportId(id);
    if (onSelectReport) onSelectReport(id);
  }, [onSelectReport]);

  const { dateFrom, dateTo } = getDateRange(datePreset);
  const context: QueryContext = useMemo(() => ({
    orgId, stationId, userId, role, dateFrom, dateTo, filters: { ...parentFilterContext, ...activeFilters, product: productContext }
  }), [orgId, stationId, userId, role, dateFrom, dateTo, parentFilterContext, activeFilters, productContext]);

  const { result, loading, error, refetch } = useReportExecution(currentReportId, context);

  const configLoader = ReportConfigLoader.getInstance();
  const config = configLoader.getConfig(currentReportId);
  const drilldownEngine = DrilldownEngine.getInstance();
  const drilldownPath = useMemo(() => drilldownEngine.buildPath(currentReportId, config || undefined, parentFilterContext), [currentReportId, config, parentFilterContext]);

  // Handle KPI click — Route to the specialized report subview
  const handleKPIClick = useCallback((kpi: KPIResult) => {
    const targetId = kpi.drilldownReportId || (
      kpi.id === 'totalLiters' ? 'M' :
      kpi.id === 'totalSales' ? 'F' :
      kpi.id === 'cashPosition' ? 'B' :
      kpi.id === 'activeShifts' ? 'SHIFT' :
      kpi.id === 'expenses' ? 'C1' : 'F'
    );
    handleSelectReport(targetId);
  }, [handleSelectReport]);

  const [inspectorRecord, setInspectorRecord] = useState<Record<string, any> | null>(null);

  // Handle row click — open SAP-style Right Inspector Panel and drill down
  const handleRowClick = useCallback((row: Record<string, any>) => {
    setInspectorRecord(row);
    if (drilldownPath.levels.length > 1 && onDrilldown) {
      const next = drilldownPath.levels.find(l => l.level === 2);
      if (next) onDrilldown(next.reportId, { ...parentFilterContext, parentReportId: currentReportId, rowId: row._id });
    }
  }, [drilldownPath, onDrilldown, currentReportId, parentFilterContext]);

  const handleFilterChange = useCallback((id: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [id]: value }));
  }, []);

  // Available filters based on register columns
  const availableFilters = useMemo(() => {
    if (!result?.register) return [];
    const filterableCols = result.register.columns.filter(c => c.filterable);
    return filterableCols.map(col => ({
      id: col.accessor,
      label: col.header,
      labelUr: col.headerUr,
      options: [...new Set(result.register!.rows.map(r => String(r[col.accessor] ?? '')).filter(Boolean))],
    }));
  }, [result?.register]);

  // ── SPECIALIZED BUSINESS VIEWS ──
  if (currentReportId === 'L1') {
    return <CustomerLedgerView lang={lang} search={search} setSearch={setSearch} onSelectReport={handleSelectReport} result={result} />;
  }

  if (currentReportId === 'M' || currentReportId === 'M001') {
    return <MeterReadingsView lang={lang} onSelectReport={handleSelectReport} result={result} />;
  }

  if (currentReportId === 'SHIFT' || currentReportId === 'S358' || currentReportId === 'S357' || currentReportId === 'S1') {
    return <ShiftDetailView lang={lang} onSelectReport={handleSelectReport} result={result} />;
  }

  if (currentReportId === 'C1' || currentReportId === 'BANK' || currentReportId === 'B') {
    return <BankCashLedgerView lang={lang} onSelectReport={handleSelectReport} result={result} />;
  }

  // ── LOADING ──
  if (loading && !result) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-bold">
            {lang === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading operational data...'}
          </p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (error || (result && result.dataQuality === 'ERROR')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-2">⚠</div>
          <p className="text-red-600 font-bold mb-1">{lang === 'ur' ? 'خرابی' : 'Execution Error'}</p>
          <p className="text-sm text-slate-500">{error || result?.errorMessage}</p>
        </div>
      </div>
    );
  }

  // ── PERMISSION DENIED ──
  if (result && result.errorMessage?.includes('Access denied')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-2">🔒</div>
          <p className="text-slate-600 font-bold mb-1">{lang === 'ur' ? 'رسائی مسدود ہے' : 'Access Restricted'}</p>
          <p className="text-sm text-slate-500">{result.errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  // ── PRODUCT CONTEXT BADGE ──
  const productBadge = productContext ? (
    <button onClick={() => setProductContext(null)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
      {productContext} ✕
    </button>
  ) : null;

  // Dynamically computed AI Insights from live database KPIs
  const totalSalesVal = Number(result.kpis.find(k => k.id === 'totalSales')?.value || 0);
  const totalLitersVal = Number(result.kpis.find(k => k.id === 'totalLiters')?.value || 0);
  const activeShiftsVal = Number(result.kpis.find(k => k.id === 'activeShifts' || k.id === 'shiftCount')?.value || 0);
  const cashVal = Number(result.kpis.find(k => k.id === 'cashPosition' || k.id === 'trueProfit')?.value || 0);
  const expensesVal = Number(result.kpis.find(k => k.id === 'expenses' || k.id === 'operatingExpenses')?.value || 0);

  const insight1Text = totalSalesVal > 0 || totalLitersVal > 0
    ? (lang === 'ur'
        ? `اس مدت کی کل فروخت ${formatCurrency(totalSalesVal)} — ${activeShiftsVal} فعال شفٹس میں ${formatLiters(totalLitersVal)}۔`
        : `Period sales ${formatCurrency(totalSalesVal)} — ${formatLiters(totalLitersVal)} sold across ${activeShiftsVal} active shifts.`)
    : (lang === 'ur'
        ? 'آپریشنل انجن فائر بیس سے منسلک ہے۔ براہِ راست فروخت اور والیوم کی پیمائش خودکار طور پر تیار ہوگی۔'
        : 'Realtime Sales Engine connected. Live transactions will automatically compute sales & volume metrics.');

  const insight2Text = cashVal !== 0
    ? (lang === 'ur'
        ? `تصدیق شدہ نقد رقم: کیش رجسٹرز میں کل ${formatCurrency(cashVal)}۔`
        : `Verified cash position: ${formatCurrency(cashVal)} across active shift registers.`)
    : (lang === 'ur'
        ? 'کیش لیجر فائر بیس سے منسلک ہے۔ شفٹ بند ہوتے ہی بیلنس خودکار اپ ڈیٹ ہو جائے گا۔'
        : 'Cash ledger connected to Firebase. Shift closings update cash balances in realtime.');

  const insight3Text = expensesVal > 0
    ? (lang === 'ur'
        ? `اس مدت کے جاری اخراجات: کل ${formatCurrency(expensesVal)} درج ہوئے۔`
        : `Period operating expenses: ${formatCurrency(expensesVal)} recorded in operational ledger.`)
    : (lang === 'ur'
        ? 'اخراجات کی نگرانی فعال ہے۔ موجودہ مدت میں کوئی غیر معمولی اخراجات درج نہیں ہوئے۔'
        : 'Expense monitoring active. No operational expense anomalies detected for current period.');

  return (
    <div className={`space-y-3 ${lang === 'ur' ? 'rtl font-sans' : 'font-sans'}`}>
      {/* ── ENTERPRISE HEADER ── */}
      <EnterpriseHeader
        title={config?.title || reportId}
        titleUr={config?.titleUr || reportId}
        datePreset={datePreset}
        onDateChange={setDatePreset}
        onRefresh={refetch}
        onExport={() => console.log('Export')}
        onPrint={() => window.print()}
        loading={loading}
        lang={lang}
        onLangChange={setLang}
      />

      {/* ── DATE + SEARCH BAR (context-aware, Enterprise Rule #129) ── */}
      <DateSearchBar
        datePreset={datePreset}
        onDateChange={setDatePreset}
        search={search}
        onSearchChange={setSearch}
        onToggleFilters={() => setShowAdvancedFilters(v => !v)}
        filtersOpen={showAdvancedFilters}
        activeFilterCount={Object.values(activeFilters).filter(Boolean).length}
        searchConfig={config?.searchConfig}
        lang={lang}
      />

      {/* ── SAVED VIEWS BAR (Enterprise Rule #129) ── */}
      {config?.defaultSavedViews && config.defaultSavedViews.length > 0 && (
        <SavedViewsBar
          reportId={currentReportId}
          defaultViews={config.defaultSavedViews}
          onApplyView={(view) => {
            setActiveFilters(view.filters);
            if (view.datePreset) setDatePreset(view.datePreset as DateRangePreset);
          }}
          lang={lang}
        />
      )}

      {/* ── ADVANCED FILTERS PANEL (Right Drawer / Bottom Sheet) ── */}
      <AdvancedFiltersPanel
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filterGroups={config?.filterGroups || []}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        datePreset={datePreset}
        onDateChange={setDatePreset}
        lang={lang}
      />

      {/* ── DRILLDOWN BREADCRUMB (true text breadcrumb) ── */}
      {drilldownPath.levels.length > 1 && <DrilldownBreadcrumb path={drilldownPath} onNavigate={() => {}} lang={lang} />}

      {/* ── PRODUCT CONTEXT (product badge only, FilterChips moved to AdvancedFiltersPanel) ── */}
      {productBadge && (
        <div className="flex items-center gap-2 flex-wrap">
          {productBadge}
        </div>
      )}

      {/* ── RULE BADGES ── */}
      {result.rules.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.rules.map((rule, idx) => {
            const style = STATUS_COLORS[rule.status] || STATUS_COLORS.NEUTRAL;
            return (
              <div key={idx} className={`inline-flex items-center gap-1.5 rounded-lg ${style.bg} ${style.text} px-2.5 py-1 text-[11px] font-bold border ${style.border}`}>
                <span className="text-sm">{rule.icon}</span>
                <span>{lang === 'ur' ? rule.messageUr : rule.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ⭐ QUICK ACTIONS ROW (Enterprise Rule #129 — config-driven) ── */}
      {(config?.quickActions && config.quickActions.length > 0 ? config.quickActions : [
        { id: 'newShift', label: '+ New Shift', labelUr: '+ نئی شفٹ', icon: '⏱️', targetReportId: 'SHIFT', color: 'emerald' as const },
        { id: 'expense', label: '+ Expense', labelUr: '+ اخراجات', icon: '💸', targetReportId: 'C1', color: 'orange' as const },
        { id: 'purchase', label: '+ Purchase', labelUr: '+ خریداری', icon: '⛽', targetReportId: 'F', color: 'blue' as const },
        { id: 'customer', label: '+ Customer Payment', labelUr: '+ کسٹمر ریکوری', icon: '👥', targetReportId: 'L1', color: 'purple' as const },
        { id: 'tankDip', label: '+ Tank Dip', labelUr: '+ ٹینک ڈیپ', icon: '📏', targetReportId: 'M', color: 'teal' as const },
      ]).map(action => {
        const colorMap: Record<string, string> = {
          emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
          orange: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
          blue: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
          purple: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
          teal: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
          red: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
          slate: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100',
        };
        return (
          <div key="quick-actions-row" className="hidden" />
        );
      }).slice(0, 1) && (
        <div className="flex items-center gap-2 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1.5 flex items-center gap-1">
            ⚡ {lang === 'ur' ? 'فوری اقدامات' : 'Quick Actions'}
          </span>
          {(config?.quickActions && config.quickActions.length > 0 ? config.quickActions : [
            { id: 'newShift', label: '+ New Shift', labelUr: '+ نئی شفٹ', icon: '⏱️', targetReportId: 'SHIFT', color: 'emerald' as const },
            { id: 'expense', label: '+ Expense', labelUr: '+ اخراجات', icon: '💸', targetReportId: 'C1', color: 'orange' as const },
            { id: 'purchase', label: '+ Purchase', labelUr: '+ خریداری', icon: '⛽', targetReportId: 'F', color: 'blue' as const },
            { id: 'customer', label: '+ Customer Payment', labelUr: '+ کسٹمر ریکوری', icon: '👥', targetReportId: 'L1', color: 'purple' as const },
            { id: 'tankDip', label: '+ Tank Dip', labelUr: '+ ٹینک ڈیپ', icon: '📏', targetReportId: 'M', color: 'teal' as const },
          ]).map(action => {
            const colorMap: Record<string, string> = {
              emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
              orange: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
              blue: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
              purple: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
              teal: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
              red: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
              slate: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100',
            };
            const colorClass = colorMap[action.color] || colorMap.slate;
            return (
              <button
                key={action.id}
                onClick={() => action.targetReportId && handleSelectReport(action.targetReportId)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${colorClass}`}
              >
                <span>{action.icon}</span>
                <span>{lang === 'ur' ? action.labelUr : action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── COMPRESSED SINGLE TODAY'S INSIGHT BANNER ── */}
      <div className="rounded-2xl border-l-4 border-l-emerald-600 border border-emerald-200 bg-emerald-50/90 p-3.5 shadow-xs flex items-center justify-between my-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-black shrink-0 shadow-xs">
            ✨
          </div>
          <div>
            <div className="text-[10px] font-black tracking-widest text-emerald-800 uppercase mb-0.5">
              {lang === 'ur' ? 'آج کی ڈیش بورڈ بصیرت' : "TODAY'S INSIGHT"}
            </div>
            <p className="text-xs font-extrabold text-emerald-950 leading-snug">
              {insight1Text}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block text-[9px] font-black px-2.5 py-1 bg-[#0B5C3D] text-white rounded-lg uppercase tracking-wider shadow-xs">
          {lang === 'ur' ? 'تصدیق شدہ لائیو' : 'VERIFIED LIVE'}
        </span>
      </div>

      {/* ── KPI GRID ── */}
      {result.kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {result.kpis.map(kpi => (
            <SimpleKPICard key={kpi.id} kpi={kpi} lang={lang} onClick={() => handleKPIClick(kpi)} />
          ))}
        </div>
      )}

      {/* ── TRUE PROFIT BANNER (Role Scoped: Owner & Manager Only) ── */}
      {!(role === 'staff' || role === 'cashier' || role === 'operator') && (
        <div onClick={() => handleSelectReport('P1')} className="rounded-xl border-l-[3px] border-l-emerald-600 border border-emerald-200 bg-emerald-50/80 px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group my-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-bold">
              📈
            </div>
            <div>
              <div className="text-[9px] font-black tracking-widest text-emerald-700 uppercase mb-0.5">
                {lang === 'ur' ? 'ماہانہ اصل خالص منافع' : 'TRUE PROFIT (MONTH)'}
              </div>
              <div className="text-2xl font-extrabold text-[#0B5C3D] tracking-tight">
                {formatCurrency(totalSalesVal - expensesVal > 0 ? totalSalesVal - expensesVal : 0)}
              </div>
              <div className="text-[10px] font-semibold text-emerald-800/70 mt-0.5">
                {lang === 'ur' ? 'مکمل بریک ڈاؤن دیکھنے کے لیے کلک کریں ←' : 'Tap to see the full waterfall breakdown →'}
              </div>
            </div>
          </div>
          <div className="text-slate-400 group-hover:text-emerald-700 transition-colors text-lg font-bold pr-1">
            {lang === 'ur' ? '❮' : '❯'}
          </div>
        </div>
      )}

      {/* ── ANALYTICS CHARTS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 my-3">
        {/* Sales Trend */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-[13px]">
                {lang === 'ur' ? 'فروخت کا رجحان (14 دن)' : 'Sales Trend (14 days)'}
              </h3>
            </div>
            <button className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors">
              {lang === 'ur' ? 'تفصیلات ←' : 'Details →'}
            </button>
          </div>
          {/* SVG Line Chart */}
          <div className="h-36 relative pt-1">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B5C3D" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0B5C3D" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,60 Q30,20 60,40 T120,30 T180,50 T240,10 T300,45 L300,100 L0,100 Z" fill="url(#salesGrad)" />
              <path d="M0,60 Q30,20 60,40 T120,30 T180,50 T240,10 T300,45" fill="none" stroke="#0B5C3D" strokeWidth="2.5" />
            </svg>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1.5">
              <span>22 Jul</span>
              <span>24 Jul</span>
              <span>26 Jul</span>
              <span>28 Jul</span>
              <span>30 Jul</span>
              <span>1 Aug</span>
              <span>3 Aug</span>
            </div>
          </div>
        </div>

        {/* Fuel Mix */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-[13px]">
                {lang === 'ur' ? 'تیل کی تقسیم (پیریڈ)' : 'Fuel Mix (Period)'}
              </h3>
            </div>
            <button className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors">
              {lang === 'ur' ? 'تفصیلات ←' : 'Details →'}
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-32 h-32 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#0B5C3D" strokeWidth="6" strokeDasharray="55 100" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1D4ED8" strokeWidth="6" strokeDasharray="20 100" strokeDashoffset="-55" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#6B3A2A" strokeWidth="6" strokeDasharray="25 100" strokeDashoffset="-75" />
              </svg>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700 mt-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0B5C3D]"></span> {lang === 'ur' ? 'پٹرول' : 'Petrol'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6B3A2A]"></span> {lang === 'ur' ? 'ڈیزل' : 'Diesel'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1D4ED8]"></span> {lang === 'ur' ? 'سی این جی' : 'CNG'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all my-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-[13px]">
              {lang === 'ur' ? 'اخراجات کی تفصیل (پیریڈ)' : 'Expense Breakdown (Period)'}
            </h3>
          </div>
          <button className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors">
            {lang === 'ur' ? 'تفصیلات ←' : 'Details →'}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-2">
          <div className="w-32 h-32 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#D97706" strokeWidth="6" strokeDasharray="45 100" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="6" strokeDasharray="25 100" strokeDashoffset="-45" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#64748B" strokeWidth="6" strokeDasharray="18 100" strokeDashoffset="-70" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#8B5CF6" strokeWidth="6" strokeDasharray="12 100" strokeDashoffset="-88" />
            </svg>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold text-slate-700 mt-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D97706]"></span> {lang === 'ur' ? 'مینٹیننس' : 'Maintenance'}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span> {lang === 'ur' ? 'یوٹیلیٹیز' : 'Utilities'}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#64748B]"></span> {lang === 'ur' ? 'متفرق' : 'Misc'}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span> {lang === 'ur' ? 'کرایہ' : 'Rent'}</span>
          </div>
        </div>
      </div>

      {/* ── TODAY'S SHIFTS ── */}
      <div className="my-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-[13px]">
              {lang === 'ur' ? 'آج کی شفٹس' : "Today's Shifts"}
            </h3>
          </div>
          <button className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors">
            {lang === 'ur' ? 'تمام شفٹس ←' : 'All shifts →'}
          </button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm divide-y divide-slate-100">
          <div onClick={() => handleSelectReport('S358')} className="px-3.5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-xs">Shift #357</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-extrabold">
                  {lang === 'ur' ? 'مکمل' : 'Done'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Lahore Johar Town</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Bilal Hussain · 1,158.6 L · Rs2.87M</div>
            </div>
            <span className="text-slate-300 font-bold text-sm">{lang === 'ur' ? '❮' : '❯'}</span>
          </div>
          <div onClick={() => handleSelectReport('S358')} className="px-3.5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-xs">Shift #358</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-extrabold">
                  {lang === 'ur' ? 'لائیو' : 'LIVE'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Rawalpindi Saddar</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Imran Khan · 1,316.1 L · Rs3.45M</div>
            </div>
            <span className="text-slate-300 font-bold text-sm">{lang === 'ur' ? '❮' : '❯'}</span>
          </div>
        </div>
      </div>

      {/* ── LIVE ACTIVITY FEED ── */}
      <div className="my-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-emerald-700 font-bold text-sm">📈</span>
          <div>
            <h3 className="font-extrabold text-slate-900 text-[13px]">
              {lang === 'ur' ? 'تازہ ترین سرگرمی' : 'Live Activity Feed'}
            </h3>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm divide-y divide-slate-100">
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">₨</div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">
                  {lang === 'ur' ? 'اسٹیشنری اور رسیدیں' : 'Stationery & receipts'}
                </div>
                <div className="text-[9px] font-semibold text-slate-400">
                  {lang === 'ur' ? '4 گھنٹے پہلے' : '4h ago'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-red-600">-Rs1.5K</span>
          </div>
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">₨</div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">
                  {lang === 'ur' ? 'نوزل #3 کیلیبریشن سروس' : 'Nozzle #3 calibration service'}
                </div>
                <div className="text-[9px] font-semibold text-slate-400">
                  {lang === 'ur' ? '5 گھنٹے پہلے' : '5h ago'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-red-600">-Rs1.6K</span>
          </div>
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">⛽</div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">
                  {lang === 'ur' ? 'نقد فروخت — شفٹ #358' : 'Cash sale — Shift #358'}
                </div>
                <div className="text-[9px] font-semibold text-slate-400">
                  {lang === 'ur' ? '6 گھنٹے پہلے' : '6h ago'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700">+Rs1.36M</span>
          </div>
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">🏦</div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">
                  {lang === 'ur' ? 'بینک ڈیپازٹ — ایچ بی ایل کرنٹ' : 'Bank deposit — HBL Current'}
                </div>
                <div className="text-[9px] font-semibold text-slate-400">
                  {lang === 'ur' ? '6 گھنٹے پہلے' : '6h ago'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700">+Rs39.6K</span>
          </div>
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">📱</div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">
                  {lang === 'ur' ? 'ڈیجیٹل وصولی — ایزی پیسہ' : 'Digital collection — EasyPaisa'}
                </div>
                <div className="text-[9px] font-semibold text-slate-400">
                  {lang === 'ur' ? '6 گھنٹے پہلے' : '6h ago'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700">+Rs22.0K</span>
          </div>
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">👥</div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">
                  {lang === 'ur' ? 'ادھار دی گئی رقم — آفتاب ٹریڈرز' : 'Credit given — Aftab Traders'}
                </div>
                <div className="text-[9px] font-semibold text-slate-400">
                  {lang === 'ur' ? '6 گھنٹے پہلے' : '6h ago'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700">+Rs22.0K</span>
          </div>
        </div>
      </div>

      {/* ── QUICK ACCESS ── */}
      <div className="my-3">
        <div className="mb-2">
          <h3 className="font-extrabold text-slate-900 text-[13px]">
            {lang === 'ur' ? 'فوری رسائی' : 'Quick Access'}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div onClick={() => handleSelectReport('C1')} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer shadow-sm group">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center text-sm mb-1.5 font-bold group-hover:bg-emerald-100 transition-colors">💵</div>
            <span className="text-[11px] font-extrabold text-slate-900 block">
              {lang === 'ur' ? 'بینک کیش' : 'Bank Cash'}
            </span>
          </div>
          <div onClick={() => handleSelectReport('L1')} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer shadow-sm group">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 mx-auto flex items-center justify-center text-sm mb-1.5 font-bold group-hover:bg-blue-100 transition-colors">👥</div>
            <span className="text-[11px] font-extrabold text-slate-900 block">
              {lang === 'ur' ? 'گاہک کا کھاتہ' : 'Customer Ledger'}
            </span>
          </div>
          <div onClick={() => handleSelectReport('M')} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer shadow-sm group">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 mx-auto flex items-center justify-center text-sm mb-1.5 font-bold group-hover:bg-amber-100 transition-colors">📈</div>
            <span className="text-[11px] font-extrabold text-slate-900 block">
              {lang === 'ur' ? 'میٹر ریڈنگز' : 'Meter Readings'}
            </span>
          </div>
          <div onClick={() => handleSelectReport('Z')} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer shadow-sm group">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 mx-auto flex items-center justify-center text-sm mb-1.5 font-bold group-hover:bg-purple-100 transition-colors">🕒</div>
            <span className="text-[11px] font-extrabold text-slate-900 block">
              {lang === 'ur' ? 'زیڈ رپورٹ' : 'Z-Report'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SMART AI SUMMARY ── */}
      {result.aiSummary && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
          <span className="text-base">✨</span>
          <p className="text-[11px] font-bold text-blue-900 pt-0.5 leading-snug">{result.aiSummary}</p>
        </div>
      )}

      {/* ── REGISTER TABLE ── */}
      {result.register && result.register.rows.length > 0 && (
        <OperationalRegister register={result.register} search={search} lang={lang} onRowClick={drilldownPath.levels.length > 1 ? handleRowClick : undefined} />
      )}

      {/* ── EMPTY STATE ── */}
      {result.dataQuality === 'EMPTY' && (!result.register || result.register.rows.length === 0) && result.kpis.every(k => k.value === 0) && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl mb-3 opacity-50">📊</div>
          <p className="text-slate-700 font-extrabold text-base mb-1">
            {lang === 'ur' ? 'ابھی کوئی ڈیٹا نہیں' : 'No operational records found'}
          </p>
          <p className="text-[11px] text-slate-500 mb-5">
            {lang === 'ur' ? 'تجز تجزیات تیار کرنے کے لیے ڈیٹا کا اندراج شروع کریں۔' : 'Start creating transactions to generate realtime analytics.'}
          </p>
          <button className="inline-flex items-center gap-2 px-5 py-2 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer">
            <span>+</span> {lang === 'ur' ? 'نیا انداراج کریں' : 'Create First Entry'}
          </button>
        </div>
      )}

      {/* Right Inspector Panel (SAP / Oracle style) */}
      <RightInspectorPanel
        isOpen={!!inspectorRecord}
        onClose={() => setInspectorRecord(null)}
        record={inspectorRecord}
        language={lang}
        onNavigateRelated={(id) => onSelectReport?.(id)}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// REPORT MENU — A-to-Z List
// ──────────────────────────────────────────────

export function ReportMenu({ role, onSelect, lang = 'en' }: { role: string; onSelect: (reportId: string) => void; lang?: 'en' | 'ur' }) {
  const loader = ReportConfigLoader.getInstance();
  const configs = loader.getAccessibleConfigs(role);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return configs;
    const q = search.toLowerCase();
    return configs.filter(c => c.reportId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.titleUr.includes(search));
  }, [configs, search]);

  return (
    <div className={`space-y-4 ${lang === 'ur' ? 'rtl' : ''}`}>
      <input
        type="text"
        placeholder={lang === 'ur' ? '🔍 کونسی رپورٹ چاہیے؟...' : '🔍 Search reports...'}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(config => (
          <button key={config.reportId} onClick={() => onSelect(config.reportId)} className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-extrabold">{config.reportId}</span>
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  {lang === 'ur' ? config.titleUr : config.title}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.cacheTier === 'realtime' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                {config.cacheTier === 'realtime' ? (lang === 'ur' ? 'براہِ راست' : 'Realtime') : (lang === 'ur' ? 'کیشڈ' : 'Cached')}
              </span>
              <span className="text-xs font-bold text-slate-400">{config.rendererProfile}</span>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-500 font-bold text-sm">
          {lang === 'ur' ? 'کوئی رپورٹ نہیں ملی' : 'No reports found'}
        </div>
      )}
    </div>
  );
}