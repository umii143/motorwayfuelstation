/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SuppliersWorkspaceView — Dedicated Accounts Payable (AP) & Vendor Command Center
 *
 * Implements Enterprise Rules #130, #131, #135, #140, #143, #168 & #169
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 9 Audit
 * Accounts Payable Vendor Control Center.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { UniversalWorkspaceLayout, WorkspaceLayer, enforceOperationalSSOT } from '../../framework/UniversalWorkspaceLayout';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { LedgerEngine, SupplierEnrichedRecord } from '../../../../../lib/reports-v2/engines/LedgerEngine';
import { TransactionEngine } from '../../../../../lib/reports-v2/engines/TransactionEngine';
import { Send, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';

import { SupplierOverviewTab } from './suppliers/SupplierOverviewTab';
import { SupplierRegisterTab } from './suppliers/SupplierRegisterTab';
import { SupplierLedgerTab } from './suppliers/SupplierLedgerTab';
import { OutstandingPayablesTab } from './suppliers/OutstandingPayablesTab';
import { SupplierPaymentCenterTab } from './suppliers/SupplierPaymentCenterTab';
import { SupplierPurchaseHistoryTab } from './suppliers/SupplierPurchaseHistoryTab';
import { SupplierPerformanceTab } from './suppliers/SupplierPerformanceTab';
import { SupplierContractsTab } from './suppliers/SupplierContractsTab';
import { SupplierDocumentsTab } from './suppliers/SupplierDocumentsTab';
import { SupplierAuditTrailTab } from './suppliers/SupplierAuditTrailTab';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface SuppliersWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const SuppliersWorkspaceView: React.FC<SuppliersWorkspaceViewProps> = ({
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

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role, dateRange: { startDate: dateFilter.startDate, endDate: dateFilter.endDate } }),
    [stationId, orgId, userId, role, dateFilter]
  );

  // Realtime Firestore Stream Subscriptions
  const supplierQuery = useReportExecution('SUP_REGISTER', queryContext);
  const purchasesQuery = useReportExecution('PUR_REGISTER', queryContext);
  const paymentsQuery = useReportExecution('SUP_PAYMENTS', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const navigate = useNavigate();



  // Subtab State for Register, Analytics, Reports
  const [registerSubTab, setRegisterSubTab] = useState<'register' | 'contracts'>('register');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'performance' | 'history'>('performance');
  const [reportsSubTab, setReportsSubTab] = useState<'outstanding' | 'ledger'>('outstanding');

  // Subscribe to TransactionEngine events for real-time double-entry updates
  useEffect(() => {
    const unsubscribe = TransactionEngine.subscribe((result) => {
      if (result.success) {
        supplierQuery.refetch?.();
      }
    });
    return unsubscribe;
  }, [supplierQuery]);

  const rawSupplierRows: Record<string, any>[] = supplierQuery.result?.register?.rows || [];
  const purchaseRows: Record<string, any>[] = purchasesQuery.result?.register?.rows || [];
  const paymentRows: Record<string, any>[] = paymentsQuery.result?.register?.rows || [];

  // Single Source of Truth Supplier Balance Calculation (Rule #140 & #143)
  const enrichedSuppliers: SupplierEnrichedRecord[] = useMemo(() => {
    const base = LedgerEngine.calculateSupplierBalances(rawSupplierRows, purchaseRows, paymentRows);
    return base.map((s) => ({
      ...s,
      balance: Math.max(0, s.balance),
    }));
  }, [rawSupplierRows, purchaseRows, paymentRows]);

  // Strict Balance > 0 Payable Filtering
  const payableSuppliers = useMemo(() => {
    return enrichedSuppliers.filter((s) => s.balance > 0);
  }, [enrichedSuppliers]);

  const totalPayable = useMemo(() => {
    return payableSuppliers.reduce((sum, s) => sum + s.balance, 0);
  }, [payableSuppliers]);

  const overdueCount = useMemo(() => {
    return payableSuppliers.filter((s) => s.isOverdue).length;
  }, [payableSuppliers]);

  // Render 10 Layers Functionally
  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return (
          <SupplierOverviewTab
            suppliers={enrichedSuppliers}
            payableSuppliers={payableSuppliers}
            totalPayable={totalPayable}
            overdueCount={overdueCount}
            lang={lang}
            onOpenInspector={(rec) => setSelectedRecord(rec)}
            onSelectTab={(t) => {
              if (t === 'payments') setRegisterSubTab('register');
            }}
          />
        );

      case 'kpis':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {isEn ? 'Accounts Payable (AP) Vendor Scorecard' : 'سپلائر کے پی آئی'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Registered Vendors</span>
                  <div className="text-xl font-black text-foreground">{enrichedSuppliers.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Open Payable Accounts</span>
                  <div className="text-xl font-black text-amber-600">{payableSuppliers.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Total Accounts Payable (AP)</span>
                  <div className="text-xl font-black text-rose-600">{formatCurrency(totalPayable)}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Overdue Payments</span>
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
                { id: 'register', label: 'Supplier Register' },
                { id: 'contracts', label: 'Contract & Pricing' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRegisterSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    registerSubTab === tab.id 
                      ? 'bg-amber-600 text-white shadow-2xs' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {registerSubTab === 'register' && (
              <SupplierRegisterTab
                suppliers={enrichedSuppliers}
                lang={lang}
                onOpenInspector={(r) => setSelectedRecord(r)}
                onOpenNewSupplierModal={() => enforceOperationalSSOT(navigate, 'Supplier Module', '/suppliers', isEn)}
              />
            )}
            {registerSubTab === 'contracts' && (
              <SupplierContractsTab
                suppliers={enrichedSuppliers}
                lang={lang}
                onOpenInspector={(r) => setSelectedRecord(r)}
              />
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'performance', label: 'Supplier Performance' },
                { id: 'history', label: 'Purchase History' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAnalyticsSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    analyticsSubTab === tab.id 
                      ? 'bg-amber-600 text-white shadow-2xs' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {analyticsSubTab === 'performance' && <SupplierPerformanceTab suppliers={enrichedSuppliers} lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {analyticsSubTab === 'history' && <SupplierPurchaseHistoryTab suppliers={enrichedSuppliers} lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
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
                  {isEn ? 'AI Vendor Delivery Index & AP Cash Flow Advisor' : 'اے آئی سپلائر مشیر'}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {isEn ? 'Predictive OMC bowser delivery schedules and cash flow payment planning.' : 'خودکار سپلائر ادائیگیوں کی پیشگوئی'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs font-bold text-foreground">
              💡 {isEn ? `Recommendation: Schedule ${formatCurrency(totalPayable)} OMC disbursements across Tuesday bank clearing window.` : 'مشورہ: بینک کلیئرنگ کے وقت ادائیگی بفر بنائیں۔'}
            </div>
          </div>
        );

      case 'workflow':
        return (
          <SupplierPaymentCenterTab
            payableSuppliers={payableSuppliers}
            lang={lang}
            onOpenInspector={(r) => setSelectedRecord(r)}
            onOpenPaymentModal={() => enforceOperationalSSOT(navigate, 'Supplier Payment Module', '/suppliers/payments', isEn)}
          />
        );

      case 'audit':
        return <SupplierAuditTrailTab suppliers={enrichedSuppliers} lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />;

      case 'documents':
        return <SupplierDocumentsTab suppliers={enrichedSuppliers} lang={lang} />;

      case 'reports':
        return <DomainReportsCenterTab domainName="suppliers" lang={lang} />;

      case 'settings':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Vendor Credit Terms & Disbursement Approval Rules' : 'سپلائر سیٹنگز'}
            </h3>
            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Standard OMC Credit Terms' : 'او ایم سی ادھار شرائط'}</span>
                <span className="font-mono text-amber-600 font-black">NET 14 DAYS</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Disbursement Dual Approval Threshold' : 'دوہری منظوری کی حد'}</span>
                <span className="font-mono text-rose-600 font-black">&gt; ₨ 5,000,000</span>
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
        title="Accounts Payable (AP) & Vendor Control Center"
        titleUr="سپلائرز و واجبات کنٹرول سینٹر"
        icon="🚛"
        domainName="suppliers"
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
