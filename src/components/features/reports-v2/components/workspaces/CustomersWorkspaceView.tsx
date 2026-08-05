/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomersWorkspaceView — Dedicated Customer Directory & AR Control Center
 *
 * Implements Enterprise Rules #130, #131, #135, #140, #166 & #167
 * 3-Layer Component & Data Isolation delegating to 10 modular sub-workspace tabs.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { LedgerEngine, CustomerEnrichedRecord } from '../../../../../lib/reports-v2/engines/LedgerEngine';
import { TransactionEngine } from '../../../../../lib/reports-v2/engines/TransactionEngine';
import { resolveWorkspaceRoute } from '../../../../../lib/reports-v2/config/WorkspaceRegistry';
import { DollarSign, Send, CheckCircle, X, Plus, Users, PhoneCall } from 'lucide-react';

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

export type CustomerTabId =
  | 'overview'
  | 'register'
  | 'ledger'
  | 'outstanding'
  | 'recovery'
  | 'aging'
  | 'credit_limits'
  | 'statements'
  | 'analytics'
  | 'audit';

interface CustomersWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const CustomersWorkspaceView: React.FC<CustomersWorkspaceViewProps> = ({
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
  const customerQuery = useReportExecution('L1', queryContext);
  const salesQuery = useReportExecution('FS_REGISTER', queryContext);
  const paymentsQuery = useReportExecution('PAYMENTS', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  // Metadata-Driven Active Tab Resolution (Rule #162 & #165)
  const resolvedRoute = useMemo(() => resolveWorkspaceRoute(reportId), [reportId]);
  const [activeTab, setActiveTab] = useState<CustomerTabId>((resolvedRoute?.tabId as CustomerTabId) || 'overview');

  useEffect(() => {
    if (resolvedRoute?.tabId) {
      setActiveTab(resolvedRoute.tabId as CustomerTabId);
    }
  }, [reportId, resolvedRoute]);

  const [paymentCustomer, setPaymentCustomer] = useState<CustomerEnrichedRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'easypaisa'>('cash');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [localSettlements, setLocalSettlements] = useState<Record<string, number>>({});

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
    return base.map((c) => {
      const settled = localSettlements[c.id] || 0;
      return {
        ...c,
        balance: Math.max(0, c.balance - settled),
      };
    });
  }, [rawCustomerRows, salesRows, paymentRows, localSettlements]);

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

  // Atomic Double-Entry Recovery Payment Settlement
  const handleSettlePayment = () => {
    if (!paymentCustomer || !paymentAmount || Number(paymentAmount) <= 0) return;
    const amt = Number(paymentAmount);

    const result = TransactionEngine.processTransaction({
      transactionType: 'CUSTOMER_RECOVERY',
      referenceId: paymentCustomer.id,
      amount: amt,
      paymentMethod: paymentMode,
      partyId: paymentCustomer.id,
      partyName: paymentCustomer.name,
      operatorId: userId,
      notes: `Recovery payment collected via ${paymentMode}`,
    });

    if (result.success) {
      setLocalSettlements((prev) => ({
        ...prev,
        [paymentCustomer.id]: (prev[paymentCustomer.id] || 0) + amt,
      }));

      setPaymentSuccessMsg(
        isEn
          ? `Double-Entry Txn ${result.transactionId} posted! ₨ ${amt.toLocaleString()} credited to ${paymentCustomer.name}.`
          : `ڈبل اینٹری ٹرانزیکشن ${result.transactionId} لاگ ہو گئی! ₨ ${amt.toLocaleString()} درج ہو گئی۔`
      );

      setTimeout(() => {
        setPaymentCustomer(null);
        setPaymentAmount('');
        setPaymentSuccessMsg('');
      }, 2000);
    }
  };

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── 1. WORKSPACE HEADER & TOP CONTROLS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5C3D] flex items-center justify-center text-xl font-bold shrink-0">
              👥
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Customer Relationship & AR Command Center' : 'گاہک ریلیشن شپ و اے آر کنٹرول سینٹر'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isEn ? 'Double-Entry AR Ledger Engine (Rule #166)' : 'ڈبل اینٹری اے آر لیجر انجن'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn
                    ? `SAP / NetSuite Standard • ${enrichedCustomers.length} Accounts | ${debtorCustomers.length} Active Debtors`
                    : `${enrichedCustomers.length} کل کھاتے | ${debtorCustomers.length} مقروض`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('register')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Plus size={14} />
              <span>{isEn ? '+ New Customer' : '+ نیا کسٹمر'}</span>
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <span>💵</span>
              <span>{isEn ? 'Recovery Center 💰' : 'ریکوری سینٹر 💰'}</span>
            </button>
          </div>
        </div>

        {/* ── 2. SUB-HEADER TABS BAR (10 DEDICATED SUB-WORKSPACES) ── */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto custom-horizontal-scrollbar pb-1.5" data-horizontal-scroll="true">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'register', label: 'Customer Register' },
            { id: 'ledger', label: 'Customer Ledger' },
            { id: 'outstanding', label: 'Outstanding Receivables' },
            { id: 'recovery', label: 'Recovery Center 💰' },
            { id: 'aging', label: 'Aging Analysis' },
            { id: 'credit_limits', label: 'Credit Limits & Risk' },
            { id: 'statements', label: 'Customer Statements' },
            { id: 'analytics', label: 'Sales Analytics' },
            { id: 'audit', label: 'Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CustomerTabId)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0B5C3D] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. DYNAMIC SUB-WORKSPACE RENDERER (RULE #165 & #166 ISOLATED COMPONENTS) ── */}
      {activeTab === 'overview' && (
        <CustomerOverviewTab
          customers={enrichedCustomers}
          debtorCustomers={debtorCustomers}
          totalOutstanding={totalOutstanding}
          overdueCount={overdueCount}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onSelectTab={(t) => setActiveTab(t)}
        />
      )}

      {activeTab === 'register' && (
        <CustomerRegisterTab
          customers={enrichedCustomers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenNewCustomerModal={() => alert('New Customer Registration Modal')}
        />
      )}

      {activeTab === 'ledger' && (
        <CustomerLedgerTab
          customers={enrichedCustomers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenPaymentModal={(c) => setPaymentCustomer(c)}
        />
      )}

      {activeTab === 'outstanding' && (
        <OutstandingReceivablesTab
          debtorCustomers={debtorCustomers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenPaymentModal={(c) => setPaymentCustomer(c)}
        />
      )}

      {activeTab === 'recovery' && (
        <RecoveryCenterTab
          debtorCustomers={debtorCustomers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenPaymentModal={(c) => setPaymentCustomer(c)}
        />
      )}

      {activeTab === 'aging' && (
        <CustomerAgingAnalysisTab
          customers={enrichedCustomers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'credit_limits' && (
        <CreditLimitsTab
          customers={enrichedCustomers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'statements' && (
        <CustomerStatementsTab
          customers={enrichedCustomers}
          lang={lang}
        />
      )}

      {activeTab === 'analytics' && (
        <CustomerSalesAnalyticsTab
          customers={enrichedCustomers}
          lang={lang}
        />
      )}

      {activeTab === 'audit' && (
        <CustomerAuditTrailTab
          customers={enrichedCustomers}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {/* ── DOUBLE-ENTRY PAYMENT SETTLEMENT MODAL (RULE #140) ── */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl max-w-md w-full font-sans animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-[#0B5C3D] tracking-wider">Double-Entry Settlement</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{paymentCustomer.name}</h3>
                <p className="text-xs font-bold text-slate-500">Current Due: {formatCurrency(paymentCustomer.balance)}</p>
              </div>
              <button
                onClick={() => setPaymentCustomer(null)}
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
                    {isEn ? 'Collection Amount (₨)' : 'وصولی کی رقم (روپے)'}
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-[#0B5C3D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isEn ? 'Payment Deposit Account' : 'ادائیگی کا ذریعہ'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Cash Drawer' },
                      { id: 'bank', label: 'HBL Bank' },
                      { id: 'easypaisa', label: 'Digital Wallet' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMode(m.id as any)}
                        className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          paymentMode === m.id
                            ? 'bg-[#0B5C3D] text-white border-[#0B5C3D]'
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
                    onClick={() => setPaymentCustomer(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettlePayment}
                    className="flex-1 py-2.5 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>Post Settlement</span>
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
