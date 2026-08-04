/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v4.0 — Business Center Workspace Launcher
 *
 * ENTERPRISE RULE #130 & RULE #162 — Metadata-Driven Workspace Navigation Launcher.
 * Clean, high-level Sidebar displaying Enterprise Business Domain Workspaces.
 * Sub-item navigation occurs exclusively through Workspace Header Tabs.
 */

import React, { useState } from 'react';
import {
  Fuel, Package, ShoppingCart, DollarSign, BookOpen, Users, Truck,
  UserCog, Tag, TrendingUp, Star, Clock, ChevronDown, LayoutDashboard, Search, Settings, Flame, Layers, CircleDot
} from 'lucide-react';
import { BUSINESS_CENTER_MENU, findMenuItem } from '../../../lib/reports-v2/config/businessCenterMenu';
import { WORKSPACE_REGISTRY, resolveWorkspaceRoute } from '../../../lib/reports-v2/config/WorkspaceRegistry';

const ICONS: Record<string, React.ElementType> = {
  Fuel, Package, ShoppingCart, DollarSign, BookOpen, Users, Truck, UserCog, Tag, TrendingUp, Settings, Flame, Layers, CircleDot
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
  const [query, setQuery] = useState('');

  const handleSelect = (reportId: string) => {
    onSelectReport(reportId);
    onCloseMobile?.();
  };

  const q = query.trim().toLowerCase();
  const filterItem = (label: string, labelUr: string) =>
    !q || label.toLowerCase().includes(q) || labelUr.includes(query.trim());

  const renderReportRow = (reportId: string, label: string, labelUr: string) => {
    const isActive = selectedReportId === reportId;
    const isFav = favorites.includes(reportId);
    return (
      <div
        key={reportId}
        className={`group flex items-center gap-2 pl-7 pr-2 py-1.5 rounded-lg cursor-pointer transition-all ${
          isActive ? 'bg-emerald-50 text-[#0B5C3D]' : 'text-slate-600 hover:bg-slate-50'
        }`}
        onClick={() => handleSelect(reportId)}
      >
        <span className={`flex-1 text-[12px] font-semibold truncate ${isActive ? 'text-[#0B5C3D]' : ''}`}>
          {isEn ? label : labelUr}
        </span>
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

  return (
    <div
      className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 shadow-xs flex flex-col font-sans transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Sidebar Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#0B5C3D] text-white flex items-center justify-center shadow-xs">
            <LayoutDashboard size={17} />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-black text-slate-900">{isEn ? 'Business Center' : 'بزنس سینٹر'}</div>
            <div className="text-[9px] font-bold text-slate-400">{isEn ? 'Reports & Registers' : 'رپورٹس اور رجسٹرز'}</div>
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isEn ? 'Search workspaces...' : 'تلاش کریں...'}
            className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11.5px] font-semibold text-slate-800 focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Workspace Navigation Launcher */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-6 space-y-1" style={{ scrollbarWidth: 'thin' }}>
        {/* Executive Dashboard */}
        <button
          onClick={() => handleSelect('A')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
            selectedReportId === 'A' ? 'bg-[#0B5C3D] text-white shadow-xs font-black' : 'text-slate-700 hover:bg-slate-50 font-bold'
          }`}
        >
          <LayoutDashboard size={16} />
          <span className="text-[12.5px] flex-1">{isEn ? 'Dashboard' : 'ڈیش بورڈ'}</span>
        </button>

        {/* Favorites */}
        {favorites.length > 0 && !q && (
          <div className="my-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600">
              <Star size={11} className="fill-amber-400 text-amber-400" /> {isEn ? 'Favorites' : 'پسندیدہ'}
            </div>
            {favorites.map((rid) => {
              const route = resolveWorkspaceRoute(rid) || findMenuItem(rid);
              if (!route) return null;
              return renderReportRow(rid, route.label, route.labelUr);
            })}
          </div>
        )}

        {/* Recent */}
        {recents.length > 0 && !q && (
          <div className="my-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Clock size={11} /> {isEn ? 'Recent' : 'حالیہ'}
            </div>
            {recents.map((rid) => {
              const route = resolveWorkspaceRoute(rid) || findMenuItem(rid);
              if (!route) return null;
              return renderReportRow(rid, route.label, route.labelUr);
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100">
          <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            {isEn ? 'WORKSPACES' : 'ورک اسپیسز'}
          </div>

          {/* Group Workspace Launchers */}
          {BUSINESS_CENTER_MENU.map((group) => {
            const Icon = ICONS[group.iconName] || Package;
            if (q && !filterItem(group.label, group.labelUr)) return null;

            const routeMapping = resolveWorkspaceRoute(selectedReportId);
            const isGroupActive = selectedReportId === group.homeReportId || routeMapping?.workspaceId === group.id;

            return (
              <button
                key={group.id}
                onClick={() => handleSelect(group.homeReportId)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer mb-0.5 ${
                  isGroupActive
                    ? 'bg-emerald-50 text-[#0B5C3D] border border-emerald-200/80 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 font-bold'
                }`}
              >
                <Icon size={16} className={isGroupActive ? 'text-[#0B5C3D]' : 'text-slate-400'} />
                <span className="flex-1 text-[12.5px] truncate">{isEn ? group.label : group.labelUr}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {group.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
