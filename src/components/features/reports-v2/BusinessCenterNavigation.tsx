/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0 — Business Center Navigation
 *
 * ENTERPRISE RULE #130 — Business-Process-Oriented Navigation.
 * Grouped, expandable sidebar with ⭐ Favorites and 🕐 Recent sections.
 * Every business process is discoverable. The Dashboard is only the entry point.
 *
 * Matches the active FuelPro Enterprise theme (design tokens / green #0B5C3D).
 */

import React, { useState } from 'react';
import {
  Fuel, Package, ShoppingCart, DollarSign, BookOpen, Users, Truck,
  UserCog, Tag, TrendingUp, Star, Clock, ChevronDown, LayoutDashboard, Search,
} from 'lucide-react';
import { BUSINESS_CENTER_MENU, findMenuItem } from '../../../lib/reports-v2/config/businessCenterMenu';

const ICONS: Record<string, React.ElementType> = {
  Fuel, Package, ShoppingCart, DollarSign, BookOpen, Users, Truck, UserCog, Tag, TrendingUp,
};

const FAV_KEY = 'fuelpro_bc_favorites';
const RECENT_KEY = 'fuelpro_bc_recents';

export function readFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
export function toggleFavorite(reportId: string): string[] {
  const cur = readFavorites();
  const next = cur.includes(reportId) ? cur.filter((r) => r !== reportId) : [...cur, reportId];
  try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* noop */ }
  return next;
}
export function readRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
export function pushRecent(reportId: string): string[] {
  const cur = readRecents().filter((r) => r !== reportId);
  const next = [reportId, ...cur].slice(0, 6);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
  return next;
}

interface Props {
  selectedReportId: string;
  onSelectReport: (reportId: string) => void;
  favorites: string[];
  recents: string[];
  onToggleFavorite: (reportId: string) => void;
  lang: 'en' | 'ur';
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function BusinessCenterNavigation({
  selectedReportId, onSelectReport, favorites, recents, onToggleFavorite, lang,
  isMobileOpen = false, onCloseMobile,
}: Props) {
  const isEn = lang === 'en';
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Expand the group containing the selected report by default
    const active = findMenuItem(selectedReportId);
    return active ? { [active.groupId]: true, fuel_operations: true } : { fuel_operations: true };
  });
  const [query, setQuery] = useState('');

  const toggleGroup = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const handleSelect = (reportId: string) => {
    onSelectReport(reportId);
    onCloseMobile?.();
  };

  const q = query.trim().toLowerCase();
  const filterItem = (label: string, labelUr: string) =>
    !q || label.toLowerCase().includes(q) || labelUr.includes(query.trim());

  const renderReportRow = (reportId: string, label: string, labelUr: string, comingSoon?: boolean) => {
    const isActive = selectedReportId === reportId;
    const isFav = favorites.includes(reportId);
    return (
      <div
        key={reportId}
        className={`group flex items-center gap-2 pl-9 pr-2 py-1.5 rounded-lg cursor-pointer transition-all ${
          isActive ? 'bg-emerald-50 text-[#0B5C3D]' : 'text-slate-600 hover:bg-slate-50'
        } ${comingSoon ? 'opacity-70' : ''}`}
        onClick={() => handleSelect(reportId)}
      >
        <span className={`flex-1 text-[12.5px] font-semibold truncate ${isActive ? 'text-[#0B5C3D]' : ''}`}>
          {isEn ? label : labelUr}
        </span>
        {comingSoon && (
          <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
            {isEn ? 'Soon' : 'جلد'}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(reportId); }}
          title={isEn ? 'Favorite' : 'پسندیدہ'}
          className={`shrink-0 transition-opacity ${isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <Star size={13} className={isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'} />
        </button>
      </div>
    );
  };

  const body = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#0B5C3D] text-white flex items-center justify-center">
            <LayoutDashboard size={15} />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-extrabold text-slate-900">{isEn ? 'Business Center' : 'بزنس سینٹر'}</div>
            <div className="text-[9px] font-bold text-slate-400">{isEn ? 'Reports & Registers' : 'رپورٹس اور رجسٹرز'}</div>
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isEn ? 'Search reports...' : 'رپورٹس تلاش کریں...'}
            className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11.5px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6" style={{ scrollbarWidth: 'thin' }}>
        {/* Dashboard entry */}
        <button
          onClick={() => handleSelect('A')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-2 transition-all ${
            selectedReportId === 'A' ? 'bg-[#0B5C3D] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard size={15} />
          <span className="text-[12.5px] font-extrabold">{isEn ? 'Dashboard' : 'ڈیش بورڈ'}</span>
        </button>

        {/* Favorites */}
        {favorites.length > 0 && !q && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600">
              <Star size={11} className="fill-amber-400 text-amber-400" /> {isEn ? 'Favorites' : 'پسندیدہ'}
            </div>
            {favorites.map((rid) => {
              const it = findMenuItem(rid);
              if (!it) return null;
              return renderReportRow(rid, it.label, it.labelUr, it.comingSoon);
            })}
          </div>
        )}

        {/* Recent */}
        {recents.length > 0 && !q && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Clock size={11} /> {isEn ? 'Recent' : 'حالیہ'}
            </div>
            {recents.map((rid) => {
              const it = findMenuItem(rid);
              if (!it) return null;
              return renderReportRow(rid, it.label, it.labelUr, it.comingSoon);
            })}
          </div>
        )}

        {/* Grouped menu */}
        {BUSINESS_CENTER_MENU.map((group) => {
          const Icon = ICONS[group.iconName] || Package;
          const items = group.items.filter((i) => filterItem(i.label, i.labelUr));
          if (q && items.length === 0) return null;
          const isOpen = q ? true : !!expanded[group.id];
          return (
            <div key={group.id} className="mb-0.5">
              <div
                onClick={() => handleSelect(group.homeReportId)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Icon size={15} className="text-[#0B5C3D] shrink-0" />
                <span className="flex-1 text-left text-[12.5px] font-extrabold group-hover:text-[#0B5C3D]">{isEn ? group.label : group.labelUr}</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {group.items.length}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleGroup(group.id); }}
                  className="p-0.5 rounded hover:bg-slate-200/60 text-slate-400"
                >
                  <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {items.map((i) => renderReportRow(i.reportId, i.label, i.labelUr, i.comingSoon))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 rounded-l-2xl"
        style={{ maxHeight: '100%' }}
      >
        {body}
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative bg-white w-72 max-w-[85vw] h-full shadow-2xl border-r border-slate-200">
            {body}
          </div>
        </div>
      )}
    </>
  );
}
