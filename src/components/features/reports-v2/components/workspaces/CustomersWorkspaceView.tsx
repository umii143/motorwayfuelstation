/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomersWorkspaceView — Dedicated Customer Directory & AR Control Center
 *
 * Implements Enterprise Rules #130, #131, #135, #140, #166 & #167
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 8 Audit
 * Customer Accounts Receivable Command Center.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { UniversalWorkspaceLayout, WorkspaceLayer, enforceOperationalSSOT } from '../../framework/UniversalWorkspaceLayout';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { LedgerEngine, CustomerEnrichedRecord } from '../../../../../lib/reports-v2/engines/LedgerEngine';
import { TransactionEngine } from '../../../../../lib/reports-v2/engines/TransactionEngine';
import { Send, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';

import { CustomerOverviewTab } from './customers/CustomerOverviewTab';
import { CustomerRegisterTab } from './customers/CustomerRegisterTab';
import { CustomerLedgerTab } from './customers/CustomerLedgerTab';
import { OutstandingReceivablesTab } from './customers/OutstandingReceivablesTab';
import { RecoveryCenterTab } from './customers/RecoveryCenterTab';
import { CustomerAgingAnalysisTab } from './customers/CustomerAgingAnalysisTab';
import { CreditLimitsTab } from './customers/CreditLimitsTab';
import { CustomerStatementsTab } from './customers/CustomerStatementsTab';
import { CustomerSalesAnalyticsTab } from './customers/CustomerSalesAnalyticsTab';
import { CustomerAuditTrailTab } from './customers/CustomerAuditTrailTab';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface CustomersWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const CustomersWorkspaceView: React.FC<CustomersWorkspaceViewProps> = ({
  stationId = 'st_default',
  orgId = 'org_main',
  userId = 'u_default',
  role = 'owner',
  lang = 'en',
  onSelectReport,
}) => {
  const isEn = lang === 'en';

  // Global Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role, dateRange: { startDate: dateFilter.startDate, endDate: dateFilter.endDate } }),
    [stationId, orgId, userId, role, dateFilter]
  );

  // Realtime Firestore Stream Subscriptions
  const customerQuery = useReportExecution('L1', queryContext);
  const salesQuery = useReportExecution('FS_REGISTER', queryContext);
  const paymentsQuery = useReportExecution('PAYMENTS', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const navigate = useNavigate();

  // Subtab State for Register, Analytics, Reports
  const [registerSubTab, setRegisterSubTab] = useState<'register' | 'credit_limits'>('register');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'sales' | 'aging'>('sales');
  const [reportsSubTab, setReportsSubTab] = useState<'outstanding' | 'ledger'>('outstanding');

  // Subscribe to TransactionEngine events for real-time double-entry updates
  useEffect(() => {
    const unsubscribe = TransactionEngine.subscribe((result) => {
      if (result.success) {
        customerQuery.refetch?.();
      }
    });
    return unsubscribe;
  }, [customerQuery]);

  const rawCustomerRows: Record<string, any>[] = customerQuery.result?.register?.rows || [];
  const salesRows: Record<string, any>[] = salesQuery.result?.register?.rows || [];
  const paymentRows: Record<string, any>[] = paymentsQuery.result?.register?.rows || [];

  // Single Source of Truth Customer Ledger Calculation (Rule #140)
  const enrichedCustomers: CustomerEnrichedRecord[] = useMemo(() => {
    const base = LedgerEngine.calculateCustomerBalances(rawCustomerRows, salesRows, paymentRows);
    return base.map((c) => ({
      ...c,
      balance: Math.max(0, c.balance),
    }));
  }, [rawCustomerRows, salesRows, paymentRows]);

  // Strict Balance > 0 Debtor Filtering
  const debtorCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => c.balance > 0);
  }, [enrichedCustomers]);

  const totalOutstanding = useMemo(() => {
    return debtorCustomers.reduce((sum, c) => sum + c.balance, 0);
  }, [debtorCustomers]);

  const overdueCount = useMemo(() => {
    return debtorCustomers.filter((c) => c.isOverdue).length;
  }, [debtorCustomers]);


  // Render 10 Layers Functionally
  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return (
          <CustomerOverviewTab
            customers={enrichedCustomers}
            debtorCustomers={debtorCustomers}
            totalOutstanding={totalOutstanding}
            overdueCount={overdueCount}
            lang={lang}
            onOpenInspector={(rec) => setSelectedRecord(rec)}
            onSelectTab={(t) => {
              if (t === 'recovery') setRegisterSubTab('register');
            }}
          />
        );

      case 'kpis':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {isEn ? 'Customer Receivables & Portfolio Risk Scorecard' : 'کسٹمر کھاتے کے پی آئی'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Total Customer Accounts</span>
                  <div className="text-xl font-black text-foreground">{enrichedCustomers.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Active Debtors</span>
                  <div className="text-xl font-black text-primary">{debtorCustomers.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Total Outstanding (AR)</span>
                  <div className="text-xl font-black text-rose-600">{formatCurrency(totalOutstanding)}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Overdue Dues Count</span>
                  <div className="text-xl font-black text-purple-600">{overdueCount}</div>
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
                { id: 'register', label: 'Customer Register' },
                { id: 'credit_limits', label: 'Credit Limits & Risk' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRegisterSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    registerSubTab === tab.id 
                      ? 'bg-primary text-primary-foreground shadow-2xs' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {registerSubTab === 'register' && (
              <CustomerRegisterTab
                customers={enrichedCustomers}
                lang={lang}
                onOpenInspector={(rec) => setSelectedRecord(rec)}
                onOpenNewCustomerModal={() => enforceOperationalSSOT(navigate, 'Customer Module', '/customers', isEn)}
              />
            )}
            {registerSubTab === 'credit_limits' && (
              <CreditLimitsTab
                customers={enrichedCustomers}
                lang={lang}
                onOpenInspector={(rec) => setSelectedRecord(rec)}
              />
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'sales', label: 'Customer Sales Analytics' },
                { id: 'aging', label: 'Aging Analysis' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAnalyticsSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    analyticsSubTab === tab.id 
                      ? 'bg-primary text-primary-foreground shadow-2xs' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {analyticsSubTab === 'sales' && <CustomerSalesAnalyticsTab customers={enrichedCustomers} lang={lang} />}
            {analyticsSubTab === 'aging' && <CustomerAgingAnalysisTab customers={enrichedCustomers} lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
          </div>
        );

      case 'ai':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {isEn ? 'AI Customer Credit Risk & Recovery Forecast' : 'اے آئی کسٹمر کریڈٹ مشیر'}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {isEn ? 'Predictive debtor payment probability and automated recovery prioritization.' : 'خودکار وصولی کی پیشگوئی'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs font-bold text-foreground">
              💡 {isEn ? `Recommendation: Prioritize recovery phone calls for ${overdueCount} overdue accounts.` : 'مشورہ: لیٹ کھاتوں سے ریکوری شروع کریں۔'}
            </div>
          </div>
        );

      case 'workflow':
        return (
          <RecoveryCenterTab
            debtorCustomers={debtorCustomers}
            lang={lang}
            onOpenInspector={(rec) => setSelectedRecord(rec)}
            onOpenPaymentModal={() => enforceOperationalSSOT(navigate, 'Customer Module', '/customers', isEn)}
          />
        );

      case 'audit':
        return <CustomerAuditTrailTab customers={enrichedCustomers} lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />;

      case 'documents':
        return <CustomerStatementsTab customers={enrichedCustomers} lang={lang} />;

      case 'reports':
        return <DomainReportsCenterTab domainName="customers" lang={lang} />;

      case 'settings':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Credit Limit Approval & Aging Threshold Rules' : 'کریڈٹ لمٹ سیٹنگز'}
            </h3>
            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Default Customer Credit Limit' : 'بنیادی ادھار حد'}</span>
                <span className="font-mono text-primary font-black">₨ 500,000</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Overdue Freeze Threshold' : 'اکاؤنٹ بلاک کی حد'}</span>
                <span className="font-mono text-rose-600 font-black">&gt; 60 DAYS OVERDUE</span>
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
        title="Customer Relationship & AR Command Center"
        titleUr="کسٹمر ریلیشن شپ و اے آر کنٹرول سینٹر"
        icon="👥"
        domainName="customers"
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
