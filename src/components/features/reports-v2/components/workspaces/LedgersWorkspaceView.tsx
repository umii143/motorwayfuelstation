/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * LedgersWorkspaceView — General Accounting Ledgers Workspace Router
 *
 * Implements Enterprise Rules #130, #131, #135, #162, #163, #168 & #169
 * Lightweight domain router delegating to modular, isolated sub-workspace components.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { WorkspaceDateFilterMenu, DateFilterState } from '../WorkspaceDateFilterMenu';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { resolveWorkspaceRoute } from '../../../../../lib/reports-v2/config/WorkspaceRegistry';
import { Plus } from 'lucide-react';

import { OverviewTab } from './ledgers/OverviewTab';
import { ChartOfAccountsTab } from './ledgers/ChartOfAccountsTab';
import { GeneralLedgerTab } from './ledgers/GeneralLedgerTab';
import { CustomerLedgersTab } from './ledgers/CustomerLedgersTab';
import { SupplierLedgersTab } from './ledgers/SupplierLedgersTab';
import { CashBookLedgerTab } from './ledgers/CashBookLedgerTab';
import { BankLedgersTab } from './ledgers/BankLedgersTab';
import { ExpenseLedgersTab } from './ledgers/ExpenseLedgersTab';
import { JournalEntriesTab } from './ledgers/JournalEntriesTab';
import { TrialBalanceTab } from './ledgers/TrialBalanceTab';

interface LedgersWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const LedgersWorkspaceView: React.FC<LedgersWorkspaceViewProps> = ({
  reportId,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
}) => {
  const isEn = lang === 'en';

  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const resolvedRoute = useMemo(() => resolveWorkspaceRoute(reportId), [reportId]);
  const [activeTab, setActiveTab] = useState<string>(resolvedRoute?.tabId || 'overview');

  useEffect(() => {
    if (resolvedRoute?.tabId) {
      setActiveTab(resolvedRoute.tabId);
    }
  }, [reportId, resolvedRoute]);

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── 1. WORKSPACE HEADER & TOP CONTROLS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <span>📒</span>
            <span>General Accounting Ledgers & Chart of Accounts</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Double-Entry Accounting Engine 🟢
            </span>
            <span className="text-xs font-bold text-slate-500">
              SAP & NetSuite Standard GL Master
            </span>
          </div>
        </div>

        {/* Right Top Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <WorkspaceDateFilterMenu value={dateFilter} onChange={setDateFilter} lang={lang} />

          <button
            onClick={() => setActiveTab('journals')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>+ New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* ── 2. SUB-HEADER TABS BAR (10 DEDICATED SUB-WORKSPACES) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center gap-1 overflow-x-auto custom-horizontal-scrollbar" data-horizontal-scroll="true">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'coa', label: 'Chart of Accounts (COA)' },
          { id: 'general', label: 'General Ledger' },
          { id: 'customers', label: 'Customer Ledgers' },
          { id: 'suppliers', label: 'Supplier Ledgers' },
          { id: 'cash', label: 'Cash Book' },
          { id: 'bank', label: 'Bank Ledgers' },
          { id: 'expenses', label: 'Expense Ledgers' },
          { id: 'journals', label: 'Journal Entries' },
          { id: 'trial_balance', label: 'Trial Balance' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0B5C3D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 3. DYNAMIC SUB-WORKSPACE RENDERER (RULE #169 ISOLATED COMPONENTS) ── */}
      {activeTab === 'overview' && (
        <OverviewTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'coa' && (
        <ChartOfAccountsTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'general' && (
        <GeneralLedgerTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'customers' && (
        <CustomerLedgersTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'suppliers' && (
        <SupplierLedgersTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'cash' && (
        <CashBookLedgerTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'bank' && (
        <BankLedgersTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpenseLedgersTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'journals' && (
        <JournalEntriesTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'trial_balance' && (
        <TrialBalanceTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {/* ── 7-TAB RIGHT INSPECTOR DRAWER ── */}
      <RightInspectorPanel
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        language={lang}
        onNavigateRelated={(repId) => onSelectReport?.(repId)}
      />
    </div>
  );
};
