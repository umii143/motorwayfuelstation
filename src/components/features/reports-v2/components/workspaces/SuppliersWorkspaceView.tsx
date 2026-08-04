/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SuppliersWorkspaceView — Dedicated Accounts Payable (AP) & Supplier Product Workspace
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137, #138, #139, #140, #141, #142, #143, #144, #145 & #146
 * Accounts Payable (AP) Open Item Settlement Engine with TransactionEngine Double Entry
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { EnterpriseRegisterTable } from '../EnterpriseRegisterTable';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { LedgerEngine, SupplierEnrichedRecord } from '../../../../../lib/reports-v2/engines/LedgerEngine';
import { TransactionEngine } from '../../../../../lib/reports-v2/engines/TransactionEngine';
import { DollarSign, CheckCircle, X, CreditCard } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'ledger' | 'payables' | 'payments'>(
    reportId === 'SUP_OUTSTANDING' ? 'payables' :
    reportId === 'SUP_PAYMENTS' ? 'payments' : 'overview'
  );

  const [search, setSearch] = useState('');
  const [paymentSupplier, setPaymentSupplier] = useState<SupplierEnrichedRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'easypaisa'>('cash');
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

  // SINGLE SOURCE OF TRUTH LEDGER ENGINE CALCULATION (RULES #140 & #141)
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

  // ENTERPRISE RULES #138, #139 & #143: STRICT ZERO-BALANCE FILTERING FOR PAYABLES & PAYMENT CENTER
  const payableSuppliers = useMemo(() => {
    return enrichedSuppliers.filter((s) => s.balance > 0);
  }, [enrichedSuppliers]);

  const totalPayables = useMemo(() => {
    return payableSuppliers.reduce((sum, s) => sum + s.balance, 0);
  }, [payableSuppliers]);

  const currentTabRows = useMemo(() => {
    let rows = (activeTab === 'payables' || activeTab === 'payments')
      ? payableSuppliers
      : enrichedSuppliers;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.contactPerson?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [activeTab, payableSuppliers, enrichedSuppliers, search]);

  // RULE #145: ATOMIC DOUBLE-ENTRY SETTLEMENT VIA TRANSACTION ENGINE
  const handleSettleSupplierPayment = () => {
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
      notes: `Supplier AP settlement paid to ${paymentSupplier.name} via ${paymentMode}`,
    });

    if (result.success) {
      setLocalSettlements((prev) => ({
        ...prev,
        [paymentSupplier.id]: (prev[paymentSupplier.id] || 0) + amt,
      }));

      setPaymentSuccessMsg(
        isEn
          ? `Double-Entry AP Txn ${result.transactionId} posted! ₨ ${amt.toLocaleString()} paid to ${paymentSupplier.name}.`
          : `ڈبل اینٹری اے پی ٹرانزیکشن ${result.transactionId} لاگ ہو گئی۔`
      );

      setTimeout(() => {
        setPaymentSupplier(null);
        setPaymentAmount('');
        setPaymentSuccessMsg('');
      }, 2000);
    }
  };

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-bold">
              🚛
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Accounts Payable (AP) & Supplier Workspace' : 'سپلائر ڈائریکٹری و واجبات (AP) ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-black border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  {isEn ? 'Single Source AP Ledger Engine (Rule #143)' : 'لائیو اے پی لیجر سنک'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${enrichedSuppliers.length} OMC Vendors | ${payableSuppliers.length} Open Payables` : `${enrichedSuppliers.length} تیل کمپنیاں | ${payableSuppliers.length} واجب الادا`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('payments')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>💰</span>
              <span>{isEn ? 'Supplier Payment Center' : 'ادائیگی سینٹر'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
            { id: 'register', label: 'Supplier Register', labelUr: 'سپلائر رجسٹر' },
            { id: 'ledger', label: 'Supplier Ledger', labelUr: 'سپلائر کھاتہ' },
            { id: 'payables', label: 'Outstanding Payables (AP > 0)', labelUr: 'واجب الادا بقایا جات' },
            { id: 'payments', label: 'Supplier Payment Center 💰', labelUr: 'ادائیگی سینٹر 💰' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0B5C3D] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {isEn ? tab.label : tab.labelUr}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIVE SUPPLIER KPIS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-indigo-900">{isEn ? 'Total Accounts Payable (AP)' : 'کل سپلائرز واجب الادا'}</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">LIVE AP</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 tracking-tight">{formatCurrency(totalPayables)}</div>
          <div className="text-[10px] font-extrabold text-indigo-700 mt-2">{isEn ? `${payableSuppliers.length} Open Supplier Bills` : `${payableSuppliers.length} کھلے پرچیز بلز`}</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-blue-900">{isEn ? 'Active OMC Vendors' : 'ایکٹو سپلائرز'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">{enrichedSuppliers.length} Vendors</span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{enrichedSuppliers.length} Registered</div>
          <div className="text-[10px] font-extrabold text-blue-700 mt-2">{isEn ? 'PSO / Shell / Total / Attock' : 'تیل کمپنیاں'}</div>
        </div>
      </div>

      {/* ── REGISTER TABLE / PAYMENT CENTER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {activeTab === 'payments'
                ? (isEn ? '💰 Supplier Payment & Settlement Center' : '💰 سپلائر ادائیگی و سیٹلمنٹ سینٹر')
                : activeTab === 'payables'
                ? (isEn ? '📋 Outstanding Payables (AP Balance > 0 Only)' : '📋 واجب الادا بقایا جات (صرف >0 بیلنس)')
                : (isEn ? '📋 Supplier Master Directory & AP Ledger' : '📋 سپلائرز ڈائریکٹری و ای پی لیجر')}
            </h2>
          </div>

          <input
            type="text"
            placeholder={isEn ? '🔍 Search supplier, phone...' : '🔍 سپلائر یا فون تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[200px]"
          />
        </div>

        {/* SUPPLIER PAYMENT CENTER OPERATIONAL VIEW */}
        {activeTab === 'payments' ? (
          currentTabRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">{isEn ? 'Supplier Vendor' : 'سپلائر کا نام'}</th>
                    <th className="p-3">{isEn ? 'Contact Person' : 'رابطہ شخص'}</th>
                    <th className="p-3 text-right">{isEn ? 'Payable Balance (AP)' : 'واجب الادا رقم'}</th>
                    <th className="p-3 text-center">{isEn ? 'Settlement Action' : 'سیٹلمنٹ ایکشن'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {currentTabRows.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-extrabold text-slate-900">{s.name}</td>
                      <td className="p-3 text-slate-600">{s.contactPerson}</td>
                      <td className="p-3 text-right font-black text-indigo-700 text-sm">
                        {formatCurrency(s.balance)}
                      </td>
                      <td className="p-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPaymentSupplier(s)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
                        >
                          <CreditCard size={13} />
                          <span>{isEn ? 'Pay Supplier' : 'ادائیگی کریں'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-10 text-center shadow-xs my-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-base font-black text-emerald-900 mb-1">
                {isEn ? 'Zero Outstanding Supplier Payables!' : 'تمام سپلائر واجبات 100% کلیئر ہیں!'}
              </h3>
              <p className="text-xs font-semibold text-emerald-700">
                {isEn ? 'All OMC fuel bowser invoices are 100% paid and settled.' : 'تمام پرچیز بلز مکمل طور پر ادا شدہ ہیں۔'}
              </p>
            </div>
          )
        ) : (
          currentTabRows.length > 0 ? (
            <EnterpriseRegisterTable
              columns={[
                { id: 'name', header: 'Supplier Name', headerUr: 'سپلائر نام', accessor: 'name', sortable: true },
                { id: 'contactPerson', header: 'Contact Person', headerUr: 'رابطہ شخص', accessor: 'contactPerson' },
                { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
                { id: 'balance', header: 'Payable Balance (₨)', headerUr: 'واجب الادا رقم', accessor: 'balance', isCurrency: true, sortable: true },
              ]}
              data={currentTabRows}
              language={lang}
              onRowClick={(row) => setSelectedRecord(row)}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
              <div className="text-4xl mb-3 opacity-60">🏢</div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                {isEn ? 'No Supplier Payables Found' : 'کوئی سپلائر واجبات نہیں ملے'}
              </h3>
            </div>
          )
        )}
      </div>

      {/* ── SUPPLIER PAYMENT SETTLEMENT MODAL (TRANSACTION ENGINE AP DEBIT/CREDIT) ── */}
      {paymentSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                💰 {isEn ? `Settle Supplier Bill — ${paymentSupplier.name}` : `سپلائر بل ادائیگی — ${paymentSupplier.name}`}
              </h3>
              <button onClick={() => setPaymentSupplier(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {paymentSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-600" />
                <span>{paymentSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs font-bold">
                  <span className="text-slate-500">{isEn ? 'Current Payable Balance (AP):' : 'موجودہ واجب الادا رقم:'}</span>
                  <span className="font-black text-indigo-700 text-sm">{formatCurrency(paymentSupplier.balance)}</span>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    {isEn ? 'Settlement Amount (₨)' : 'ادائیگی کی رقم (رقم)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    {isEn ? 'Payment Source (Credit Target)' : 'ادائیگی کا ذریعہ'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: '💵 Cash Book' },
                      { id: 'bank', label: '🏦 HBL Bank' },
                      { id: 'easypaisa', label: '📱 EasyPaisa' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setPaymentMode(mode.id as any)}
                        className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          paymentMode === mode.id
                            ? 'bg-[#0B5C3D] text-white border-[#0B5C3D]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setPaymentSupplier(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    {isEn ? 'Cancel' : 'منسوخ'}
                  </button>
                  <button
                    onClick={handleSettleSupplierPayment}
                    className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all shadow-xs"
                  >
                    ✓ {isEn ? 'Post AP Settlement' : 'ادائیگی کی تصدیق کریں'}
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
