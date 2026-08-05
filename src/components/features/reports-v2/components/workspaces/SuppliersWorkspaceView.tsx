/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SuppliersWorkspaceView — Dedicated Accounts Payable (AP) & Vendor Command Center
 *
 * Implements Enterprise Rules #130, #131, #135, #140, #143, #168 & #169
 * 3-Layer Component & Data Isolation delegating to 10 modular sub-workspace tabs.
 * Distinct Deep Navy & Amber AP Logistics Theme.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { LedgerEngine, SupplierEnrichedRecord } from '../../../../../lib/reports-v2/engines/LedgerEngine';
import { TransactionEngine } from '../../../../../lib/reports-v2/engines/TransactionEngine';
import { resolveWorkspaceRoute } from '../../../../../lib/reports-v2/config/WorkspaceRegistry';
import { DollarSign, CheckCircle, X, CreditCard, Plus, Truck, Building2, Send } from 'lucide-react';

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

export type SupplierTabId =
  | 'overview'
  | 'register'
  | 'ledger'
  | 'outstanding'
  | 'payments'
  | 'history'
  | 'performance'
  | 'contracts'
  | 'documents'
  | 'audit';

interface SuppliersWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const SuppliersWorkspaceView: React.FC<SuppliersWorkspaceViewProps> = ({
  reportId,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
}) => {
  const isEn = lang === 'en';

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role }),
    [stationId, orgId, userId, role]
  );

  // Realtime Firestore Stream Subscriptions
  const supplierQuery = useReportExecution('SUP_REGISTER', queryContext);
  const purchasesQuery = useReportExecution('PUR_REGISTER', queryContext);
  const paymentsQuery = useReportExecution('PAYMENTS', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  // Metadata-Driven Active Tab Resolution (Rule #162 & #165)
  const resolvedRoute = useMemo(() => resolveWorkspaceRoute(reportId), [reportId]);
  const [activeTab, setActiveTab] = useState<SupplierTabId>((resolvedRoute?.tabId as SupplierTabId) || 'overview');

  useEffect(() => {
    if (resolvedRoute?.tabId) {
      setActiveTab(resolvedRoute.tabId as SupplierTabId);
    }
  }, [reportId, resolvedRoute]);

  const [paymentSupplier, setPaymentSupplier] = useState<SupplierEnrichedRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'easypaisa'>('bank');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [localSettlements, setLocalSettlements] = useState<Record<string, number>>({});

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
    return base.map((s) => {
      const settled = localSettlements[s.id] || 0;
      return {
        ...s,
        balance: Math.max(0, s.balance - settled),
      };
    });
  }, [rawSupplierRows, purchaseRows, paymentRows, localSettlements]);

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

  // Atomic Double-Entry Supplier Payment Settlement (Rule #140 & #143)
  const handleSettlePayment = () => {
    if (!paymentSupplier || !paymentAmount || Number(paymentAmount) <= 0) return;
    const amt = Number(paymentAmount);

    const result = TransactionEngine.processTransaction({
      transactionType: 'SUPPLIER_PAYMENT',
      referenceId: paymentSupplier.id,
      amount: amt,
      paymentMethod: paymentMode,
      partyId: paymentSupplier.id,
      partyName: paymentSupplier.name,
      operatorId: userId,
      notes: `Supplier payment settlement disbursed via ${paymentMode}`,
    });

    if (result.success) {
      setLocalSettlements((prev) => ({
        ...prev,
        [paymentSupplier.id]: (prev[paymentSupplier.id] || 0) + amt,
      }));

      setPaymentSuccessMsg(
        isEn
          ? `Double-Entry Txn ${result.transactionId} posted! ₨ ${amt.toLocaleString()} debited to ${paymentSupplier.name}.`
          : `ڈبل اینٹری ٹرانزیکشن ${result.transactionId} لاگ ہو گئی! ₨ ${amt.toLocaleString()} درج ہو گئی۔`
      );

      setTimeout(() => {
        setPaymentSupplier(null);
        setPaymentAmount('');
        setPaymentSuccessMsg('');
      }, 2000);
    }
  };

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── 1. WORKSPACE HEADER & TOP CONTROLS (DEEP NAVY & AMBER AP LOGISTICS THEME) ── */}
      <div className="bg-[#0F172A] text-white rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/30 shrink-0">
              🚛
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <span>Accounts Payable (AP) & Vendor Control Center</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  {isEn ? 'Double-Entry AP Settlement Engine (Rule #168)' : 'ڈبل اینٹری اے پی لیجر انجن'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn
                    ? `SAP / NetSuite Standard • ${enrichedSuppliers.length} Vendors | ${payableSuppliers.length} Open Payables`
                    : `${enrichedSuppliers.length} کل سپلائرز | ${payableSuppliers.length} واجب الادا`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('register')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Plus size={14} />
              <span>{isEn ? '+ New Supplier' : '+ نیا سپلائر'}</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E293B] hover:bg-slate-800 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <CreditCard size={14} />
              <span>{isEn ? 'Payment Center 💰' : 'ادائیگی سینٹر 💰'}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
            >
              <Truck size={14} />
              <span>{isEn ? 'Record Purchase' : 'خرید درج کریں'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
            >
              <span>{isEn ? 'Print Statement' : 'پرنٹ رپورٹ'}</span>
            </button>
          </div>
        </div>

        {/* ── 2. SUB-HEADER TABS BAR (10 DEDICATED SUB-WORKSPACES) ── */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto custom-horizontal-scrollbar pb-1.5" data-horizontal-scroll="true">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'register', label: 'Supplier Register' },
            { id: 'ledger', label: 'Supplier Ledger' },
            { id: 'outstanding', label: 'Outstanding Payables' },
            { id: 'payments', label: 'Payment Center 💰' },
            { id: 'history', label: 'Purchase History' },
            { id: 'performance', label: 'Supplier Performance' },
            { id: 'contracts', label: 'Contract & Pricing' },
            { id: 'documents', label: 'Documents' },
            { id: 'audit', label: 'Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SupplierTabId)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. DYNAMIC SUB-WORKSPACE RENDERER (RULE #165 & #168 ISOLATED COMPONENTS) ── */}
      {activeTab === 'overview' && (
        <SupplierOverviewTab
          suppliers={enrichedSuppliers}
          payableSuppliers={payableSuppliers}
          totalPayable={totalPayable}
          overdueCount={overdueCount}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onSelectTab={(t) => setActiveTab(t)}
        />
      )}

      {activeTab === 'register' && (
        <SupplierRegisterTab
          suppliers={enrichedSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenNewSupplierModal={() => alert('New Supplier Account Registration Modal')}
        />
      )}

      {activeTab === 'ledger' && (
        <SupplierLedgerTab
          suppliers={enrichedSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenPaymentModal={(s) => setPaymentSupplier(s)}
        />
      )}

      {activeTab === 'outstanding' && (
        <OutstandingPayablesTab
          payableSuppliers={payableSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenPaymentModal={(s) => setPaymentSupplier(s)}
        />
      )}

      {activeTab === 'payments' && (
        <SupplierPaymentCenterTab
          payableSuppliers={payableSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenPaymentModal={(s) => setPaymentSupplier(s)}
        />
      )}

      {activeTab === 'history' && (
        <SupplierPurchaseHistoryTab
          suppliers={enrichedSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'performance' && (
        <SupplierPerformanceTab
          suppliers={enrichedSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'contracts' && (
        <SupplierContractsTab
          suppliers={enrichedSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'documents' && (
        <SupplierDocumentsTab
          suppliers={enrichedSuppliers}
          lang={lang}
        />
      )}

      {activeTab === 'audit' && (
        <SupplierAuditTrailTab
          suppliers={enrichedSuppliers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {/* ── DOUBLE-ENTRY VENDOR PAYMENT SETTLEMENT MODAL (RULE #140 & #143) ── */}
      {paymentSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl max-w-md w-full font-sans animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">AP Vendor Settlement</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{paymentSupplier.name}</h3>
                <p className="text-xs font-bold text-slate-500">Outstanding Payable: {formatCurrency(paymentSupplier.balance)}</p>
              </div>
              <button
                onClick={() => setPaymentSupplier(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {paymentSuccessMsg ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle size={40} className="mx-auto text-emerald-600" />
                <p className="text-sm font-black text-slate-900">{paymentSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isEn ? 'Disbursement Amount (₨)' : 'ادائیگی کی رقم (روپے)'}
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 1500000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isEn ? 'Paying Account' : 'ادائیگی کا ذریعہ'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bank', label: 'HBL Operating' },
                      { id: 'cash', label: 'Cash Drawer' },
                      { id: 'easypaisa', label: 'Digital Account' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMode(m.id as any)}
                        className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          paymentMode === m.id
                            ? 'bg-[#0F172A] text-amber-400 border-[#0F172A]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setPaymentSupplier(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettlePayment}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>Post Disbursement</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
