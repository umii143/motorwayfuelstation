/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * UniversalWorkspaceLayout — PRD v6.1 Addendum A.12.1
 *
 * Enforces the strict 10-Layer UX sequence across all 10 workspaces.
 * Replaces ad-hoc local tabs with a unified Enterprise standard.
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { UniversalEnterpriseToolbar } from './UniversalEnterpriseToolbar';
import { DateFilterState } from '../components/WorkspaceDateFilterMenu';
import { RightInspectorPanel } from '../components/RightInspectorPanel';
import { NavigateFunction } from 'react-router-dom';
import { Download, Printer, Copy, Columns, Bookmark } from 'lucide-react';

export const enforceOperationalSSOT = (navigate: NavigateFunction, moduleName: string, path: string, isEn: boolean) => {
  toast.custom((t) => (
    <div className="bg-card border border-border p-4 rounded-xl shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in w-80">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-black text-foreground">Permission Dialog</h4>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            {isEn 
              ? 'This action is managed from the operational module. Reporting workspaces are strictly read-only.' 
              : 'یہ کام آپریشنل ماڈیول سے منجمد ہے۔ رپورٹس صرف دیکھنے کے لیے ہیں۔'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-2">
        <button 
          onClick={() => toast.dismiss(t.id)} 
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            toast.dismiss(t.id);
            navigate(path);
          }} 
          className="px-4 py-1.5 rounded-lg text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
        >
          {moduleName}
        </button>
      </div>
    </div>
  ), { duration: 5000, position: 'bottom-right' });
};

export type WorkspaceLayer = 
  | 'overview' 
  | 'kpis' 
  | 'register' 
  | 'analytics' 
  | 'ai' 
  | 'documents' 
  | 'workflow' 
  | 'audit' 
  | 'reports' 
  | 'settings';

interface UniversalWorkspaceLayoutProps {
  lang: 'en' | 'ur';
  title: string;
  titleUr: string;
  icon: string;
  domainName: string;
  dateFilter: DateFilterState;
  onDateFilterChange: (newVal: DateFilterState) => void;
  renderLayer: (layer: WorkspaceLayer) => React.ReactNode;
  selectedRecord?: Record<string, any> | null;
  onCloseInspector?: () => void;
  onNavigateRelated?: (reportId: string) => void;
}

const LAYERS = [
  { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
  { id: 'kpis', label: 'Realtime KPIs', labelUr: 'بنیادی اشاریے' },
  { id: 'register', label: 'Operational Register', labelUr: 'آپریشنل رجسٹر' },
  { id: 'analytics', label: 'Analytics', labelUr: 'تجزیات' },
  { id: 'ai', label: 'AI Advisor', labelUr: 'اے آئی مشیر' },
  { id: 'documents', label: 'Documents', labelUr: 'دستاویزات' },
  { id: 'workflow', label: 'Workflow', labelUr: 'ورک فلو' },
  { id: 'audit', label: 'Audit Trail', labelUr: 'آڈٹ ٹریل' },
  { id: 'reports', label: 'Reports', labelUr: 'رپورٹس' },
  { id: 'settings', label: 'Settings', labelUr: 'ترتیبات' },
] as const;

export const UniversalWorkspaceLayout: React.FC<UniversalWorkspaceLayoutProps> = ({
  lang,
  title,
  titleUr,
  icon,
  domainName,
  dateFilter,
  onDateFilterChange,
  renderLayer,
  selectedRecord,
  onCloseInspector,
  onNavigateRelated,
}) => {
  const isEn = lang === 'en';
  const [activeLayer, setActiveLayer] = useState<WorkspaceLayer>('overview');

  return (
    <div className={`space-y-4 font-sans text-foreground pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      
      {/* ── 1. UNIVERSAL TOOLBAR (A.12.2) ── */}
      <UniversalEnterpriseToolbar 
        lang={lang}
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
      />

      {/* ── 2. DOMAIN HEADER & QUICK CREATES ── */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shadow-2xs">
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight leading-tight">
              {isEn ? title : titleUr}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Domain: {domainName}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary-hover text-[9px] font-black border border-primary/25">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Export & Utility Actions (Replacing Operational Buttons) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => toast.success(isEn ? "Preparing Export..." : "رپورٹ ایکسپورٹ ہو رہی ہے...")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground border border-border hover:bg-muted rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            {isEn ? 'Export' : 'ایکسپورٹ'}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground border border-border hover:bg-muted rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer hidden sm:flex"
          >
            <Printer className="w-4 h-4 text-sky-600" />
            {isEn ? 'Print' : 'پرنٹ'}
          </button>
          <button
            onClick={() => toast.success(isEn ? "Opening Comparison View..." : "موازنہ منظر کھل رہا ہے...")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground border border-border hover:bg-muted rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer hidden md:flex"
          >
            <Columns className="w-4 h-4 text-amber-600" />
            {isEn ? 'Compare' : 'موازنہ'}
          </button>
          <button
            onClick={() => toast.success(isEn ? "Saving Current View..." : "موجودہ منظر محفوظ ہو رہا ہے...")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground border border-border hover:bg-muted rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer hidden lg:flex"
          >
            <Bookmark className="w-4 h-4 text-primary" />
            {isEn ? 'Save View' : 'محفوظ کریں'}
          </button>
        </div>
      </div>

      {/* ── 3. 10-LAYER NAVIGATION (A.12.1) ── */}
      <div className="bg-card rounded-2xl border border-border p-2 shadow-xs flex items-center gap-1 overflow-x-auto custom-horizontal-scrollbar" data-horizontal-scroll="true">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as WorkspaceLayer)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeLayer === layer.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {isEn ? layer.label : layer.labelUr}
          </button>
        ))}
      </div>

      {/* ── 4. LAYER RENDERER ── */}
      <div className="min-h-[400px]">
        {renderLayer(activeLayer)}
      </div>

      {/* ── 5. RIGHT INSPECTOR (UNIVERSAL DRILLDOWN SUPPORT) ── */}
      <RightInspectorPanel
        isOpen={!!selectedRecord}
        onClose={() => onCloseInspector?.()}
        record={selectedRecord || null}
        language={lang}
        onNavigateRelated={onNavigateRelated}
      />
    </div>
  );
};
