/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FinanceWorkspaceView — Finance & Treasury Domain Workspace Router
 *
 * Implements Enterprise Rules #130, #131, #135, #162, #163 & #168
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 6 Audit
 * Complete Double-Entry Financial Control & Treasury Management.
 */

import React, { useState, useMemo } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { useFinancialStore } from '../../../../../stores/useFinancialStore';
import { useWorkspaceFirebaseData } from '../../hooks/useWorkspaceFirebaseData';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { UniversalWorkspaceLayout, WorkspaceLayer, enforceOperationalSSOT } from '../../framework/UniversalWorkspaceLayout';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';

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
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const FinanceWorkspaceView: React.FC<FinanceWorkspaceViewProps> = ({
  stationId = 'st_default',
  orgId = 'org_main',
  userId = 'u_default',
  role = 'owner',
  lang = 'en',
  onSelectReport,
}) => {
  const isEn = lang === 'en';
  const isUr = lang === 'ur';

  // Global Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role, dateRange: { startDate: dateFilter.startDate, endDate: dateFilter.endDate } }),
    [stationId, orgId, userId, role, dateFilter]
  );

  const navigate = useNavigate();

  // Global store values
  const banks = useFinancialStore((state) => state.banks || []);
  const digitalAccounts = useFinancialStore((state) => state.digitalAccounts || []);
  const standaloneExpenses = useFinancialStore((state) => state.standaloneExpenses || []);
  const journalEntries = useFinancialStore((state) => state.journalEntries || []);

  const { data: finRecords = [] } = useWorkspaceFirebaseData('FINANCIAL_RECORDS', { orgId, stationId });

  // Subtab State for Register, Workflow, Analytics
  const [registerSubTab, setRegisterSubTab] = useState<'cash' | 'banks' | 'wallets' | 'income' | 'expenses'>('cash');
  const [workflowSubTab, setWorkflowSubTab] = useState<'transfers' | 'journals'>('transfers');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'pnl' | 'cashflow'>('pnl');

  // Render 10 Layers Functionally
  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return (
          <FinanceOverviewTab
            lang={lang}
            orgId={orgId}
            stationId={stationId}
            onSelectTab={(t) => {
              if (t === 'cash') setRegisterSubTab('cash');
              else if (t === 'banks') setRegisterSubTab('banks');
              else if (t === 'wallets') setRegisterSubTab('wallets');
              else if (t === 'expenses') setRegisterSubTab('expenses');
              else if (t === 'journals') setWorkflowSubTab('journals');
            }}
            onOpenInspector={(r) => setSelectedRecord(r)}
          />
        );

      case 'kpis':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {isEn ? 'Treasury Position & Liquidity KPI Scorecard' : 'ٹریژری پوزیشن کے پی آئی'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Commercial Bank Accounts</span>
                  <div className="text-xl font-black text-foreground">{banks.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Digital Wallets Linked</span>
                  <div className="text-xl font-black text-primary">{digitalAccounts.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Operating Expenses Logged</span>
                  <div className="text-xl font-black text-rose-600">{standaloneExpenses.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Posted Journal Entries</span>
                  <div className="text-xl font-black text-purple-600">{journalEntries.length}</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'cash', label: 'Cash Book' },
                { id: 'banks', label: 'Bank Accounts' },
                { id: 'wallets', label: 'Digital Wallets' },
                { id: 'income', label: 'Income Register' },
                { id: 'expenses', label: 'Expense Register' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRegisterSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    registerSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {registerSubTab === 'cash' && <CashBookTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {registerSubTab === 'banks' && <BankAccountsTab lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {registerSubTab === 'wallets' && <DigitalWalletsTab lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {registerSubTab === 'income' && <IncomeRegisterTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {registerSubTab === 'expenses' && <ExpenseRegisterTab lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'pnl', label: 'Profit & Loss Statement' },
                { id: 'cashflow', label: 'Cash Flow Statement' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAnalyticsSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    analyticsSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {analyticsSubTab === 'pnl' && <ProfitLossTab lang={lang} orgId={orgId} stationId={stationId} />}
            {analyticsSubTab === 'cashflow' && <CashFlowTab lang={lang} orgId={orgId} stationId={stationId} />}
          </div>
        );

      case 'ai':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {isEn ? 'AI Cash Flow Advisor & Working Capital Forecast' : 'اے آئی فنانشل مشیر'}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {isEn ? 'Realtime liquidity forecast, cash drawer threshold alerts, and supplier payment scheduling.' : 'کیش فلو کی پیشگوئی بپراۓ ورکنگ کیپیٹل'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs font-bold text-foreground">
              💡 {isEn ? 'Recommendation: Maintain minimum Rs 500,000 liquid buffer for weekend OMC fuel purchases.' : 'مشورہ: ویک اینڈ فیول آرڈر کیلئے کیش بفر رکھیں۔'}
            </div>
          </div>
        );

      case 'workflow':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'transfers', label: 'Cash Deposits & Transfers' },
                { id: 'journals', label: 'Journal Entry Vouchers' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWorkflowSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    workflowSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {workflowSubTab === 'transfers' && <CashTransfersTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {workflowSubTab === 'journals' && <JournalEntriesTab lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
          </div>
        );

      case 'audit':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Immutable Financial Audit Log & Double-Entry Verification' : 'مالیاتی آڈٹ لاگ'}
            </h3>
            {journalEntries.length === 0 && finRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'No financial audit events recorded.' : 'کوئی آڈٹ لاگ موجود نہیں۔'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {journalEntries.slice(0, 8).map((j, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                    <div>
                      <span className="font-bold text-foreground font-sans">JV #{(j as any).jvNo || j.id}</span>
                      <div className="text-[10px] text-muted-foreground">{j.date || 'Today'} • Debit: {(j as any).debitAccount || j.partyName || '—'}</div>
                    </div>
                    <span className="font-bold text-primary">Rs {(Number(j.amount) || 0).toLocaleString('en-PK')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Bank Statements, Vouchers & Deposit Slips Archive' : 'بینک اسٹیٹمنٹس اور واؤچرز'}
            </h3>
            <div className="space-y-2 text-xs font-bold">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                <span>HBL Bank Statement (May 2025)</span>
                <button onClick={() => toast.success(isEn ? 'Downloading Bank Statement...' : 'ڈاؤن لوڈ ہو رہا ہے...')} className="text-primary hover:underline font-black">
                  Download PDF ↗
                </button>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                <span>MCB Bank Statement (May 2025)</span>
                <button onClick={() => toast.success(isEn ? 'Downloading Bank Statement...' : 'ڈاؤن لوڈ ہو رہا ہے...')} className="text-primary hover:underline font-black">
                  Download PDF ↗
                </button>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return <DomainReportsCenterTab domainName="finance" lang={lang} />;

      case 'settings':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Chart of Accounts & Treasury Limit Settings' : 'چارٹ آف اکاؤنٹس سیٹنگز'}
            </h3>
            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Maximum Cash Drawer Limit Alert' : 'کیش ڈراور کی حد'}</span>
                <span className="font-mono text-primary font-black">Rs 500,000</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Double Entry Vault Verification Mode' : 'ڈبل اینٹری موڈ'}</span>
                <span className="font-mono text-emerald-600 font-black">STRICT GAAP</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <UniversalWorkspaceLayout
        lang={lang}
        title="Finance & Treasury Control Center"
        titleUr="مالیات و ٹریژری کنٹرول سینٹر"
        icon="💰"
        domainName="finance"
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        renderLayer={renderLayer}
        onNavigateRelated={onSelectReport}
      />

      {/* 7-TAB RIGHT INSPECTOR DRAWER */}
      <RightInspectorPanel
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        language={lang}
        onNavigateRelated={(repId) => onSelectReport?.(repId)}
      />
    </>
  );
};
