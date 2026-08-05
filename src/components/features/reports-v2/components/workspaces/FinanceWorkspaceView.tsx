/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FinanceWorkspaceView — Finance & Treasury Domain Workspace Router
 *
 * Implements Enterprise Rules #130, #131, #135, #162, #163 & #168
 * Clean domain router delegating to modular, isolated sub-workspace components.
 */

import React, { useState, useMemo } from 'react';
import { WorkspaceDateFilterMenu, DateFilterState } from '../WorkspaceDateFilterMenu';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { resolveWorkspaceRoute } from '../../../../../lib/reports-v2/config/WorkspaceRegistry';
import { Settings } from 'lucide-react';

import { FinanceOverviewTab } from './finance/FinanceOverviewTab';
import { CashBookTab } from './finance/CashBookTab';
import { BankAccountsTab } from './finance/BankAccountsTab';
import { DigitalWalletsTab } from './finance/DigitalWalletsTab';
import { CashTransfersTab } from './finance/CashTransfersTab';
import { IncomeRegisterTab } from './finance/IncomeRegisterTab';
import { ExpenseRegisterTab } from './finance/ExpenseRegisterTab';
import { JournalEntriesTab } from './finance/JournalEntriesTab';
import { ProfitLossTab } from './finance/ProfitLossTab';
import { CashFlowTab } from './finance/CashFlowTab';
import { FinancialReportsTab } from './finance/FinancialReportsTab';

interface FinanceWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const FinanceWorkspaceView: React.FC<FinanceWorkspaceViewProps> = ({
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

  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const resolvedRoute = useMemo(() => resolveWorkspaceRoute(reportId), [reportId]);
  const [activeTab, setActiveTab] = useState<string>(resolvedRoute?.tabId || 'overview');

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── 1. WORKSPACE HEADER & TOP CONTROLS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <span>💰</span>
            <span>Finance & Treasury Workspace</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync 🟢
            </span>
            <span className="text-xs font-bold text-slate-500">
              Complete financial control & treasury management
            </span>
          </div>
        </div>

        {/* Right Top Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <WorkspaceDateFilterMenu value={dateFilter} onChange={setDateFilter} lang={lang} />
          
          <select
            value={selectedAccountFilter}
            onChange={(e) => setSelectedAccountFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0B5C3D]"
          >
            <option value="all">All Accounts ▾</option>
            <option value="cash">Cash In Hand</option>
            <option value="hbl">HBL Operating Account</option>
            <option value="mcb">MCB Bank</option>
            <option value="ubl">UBL Account</option>
            <option value="easypaisa">EasyPaisa Wallet</option>
          </select>

          <button
            onClick={() => setActiveTab('overview')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 cursor-pointer"
          >
            <Settings size={15} />
            <span>⚙ Customize Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── 2. SUB-HEADER TABS BAR (11 DEDICATED TABS) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center gap-1 overflow-x-auto custom-horizontal-scrollbar" data-horizontal-scroll="true">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'cash', label: 'Cash Book' },
          { id: 'banks', label: 'Bank Accounts' },
          { id: 'wallets', label: 'Digital Wallets' },
          { id: 'transfers', label: 'Cash Transfers' },
          { id: 'income', label: 'Income Register' },
          { id: 'expenses', label: 'Expense Register' },
          { id: 'journals', label: 'Journal Entries' },
          { id: 'pnl', label: 'Profit & Loss' },
          { id: 'cashflow', label: 'Cash Flow' },
          { id: 'reports', label: 'Financial Reports' },
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

      {/* ── 3. DYNAMIC SUB-WORKSPACE RENDERER ── */}
      {activeTab === 'overview' && (
        <FinanceOverviewTab
          lang={lang}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'cash' && (
        <CashBookTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'banks' && (
        <BankAccountsTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'wallets' && (
        <DigitalWalletsTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'transfers' && (
        <CashTransfersTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'income' && (
        <IncomeRegisterTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpenseRegisterTab
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

      {activeTab === 'pnl' && (
        <ProfitLossTab lang={lang} />
      )}

      {activeTab === 'cashflow' && (
        <CashFlowTab lang={lang} />
      )}

      {activeTab === 'reports' && (
        <FinancialReportsTab lang={lang} />
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
