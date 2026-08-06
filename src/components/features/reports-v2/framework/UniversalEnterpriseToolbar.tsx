/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * UniversalEnterpriseToolbar — PRD v6.1 Addendum A.12.2
 *
 * Consistent top-level toolbar containing Filters, Exports, and Actions.
 */

import React from 'react';
import { 
  Search, Building2, Fuel, Users, Filter, 
  FileText, Table, Printer, Bell, Star, Pin, Maximize 
} from 'lucide-react';
import { WorkspaceDateFilterMenu, DateFilterState } from '../components/WorkspaceDateFilterMenu';

interface UniversalEnterpriseToolbarProps {
  lang: 'en' | 'ur';
  dateFilter: DateFilterState;
  onDateFilterChange: (newVal: DateFilterState) => void;
  onSearchChange?: (query: string) => void;
  // Placed hooks for future implementations
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

export const UniversalEnterpriseToolbar: React.FC<UniversalEnterpriseToolbarProps> = ({
  lang,
  dateFilter,
  onDateFilterChange,
  onSearchChange,
  onExportPdf,
  onExportExcel,
  onPrint,
}) => {
  const isEn = lang === 'en';

  return (
    <div className={`w-full bg-card rounded-2xl border border-border shadow-xs p-3 flex flex-col gap-3 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* Top Row: Core Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Universal Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder={isEn ? "Search universally..." : "تلاش کریں..."}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={`w-full bg-muted border-none rounded-xl py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground ${lang === 'ur' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>

          {/* Date Filter */}
          <WorkspaceDateFilterMenu value={dateFilter} onChange={onDateFilterChange} lang={lang} />
          
          {/* Mock Pickers for Universal Filters */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all">
            <Building2 size={13} className="text-muted-foreground" />
            <span>{isEn ? "All Branches" : "تمام برانچز"}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all">
            <Fuel size={13} className="text-muted-foreground" />
            <span>{isEn ? "All Products" : "تمام پراڈکٹس"}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all">
            <Users size={13} className="text-muted-foreground" />
            <span>{isEn ? "All Staff" : "تمام اسٹاف"}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-primary transition-all">
            <Filter size={13} />
            <span>{isEn ? "More Filters" : "مزید فلٹرز"}</span>
          </button>
        </div>

        {/* Right Row: Exports & Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t xl:border-t-0 xl:border-l border-border pt-3 xl:pt-0 xl:pl-3">
          <div className="flex items-center gap-1">
            <button onClick={onExportPdf} className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all" title="Export PDF">
              <FileText size={15} />
            </button>
            <button onClick={onExportExcel} className="p-1.5 rounded-lg text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all" title="Export Excel">
              <Table size={15} />
            </button>
            <button onClick={onPrint} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Print">
              <Printer size={15} />
            </button>
          </div>
          
          <div className="w-px h-4 bg-border"></div>
          
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-orange-500 hover:bg-orange-50 transition-all" title="Alerts">
              <Bell size={15} />
            </button>
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-yellow-500 hover:bg-yellow-50 transition-all" title="Favorite">
              <Star size={15} />
            </button>
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" title="Pin">
              <Pin size={15} />
            </button>
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" title="Fullscreen">
              <Maximize size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
