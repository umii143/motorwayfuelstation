/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomersWorkspaceView — Dedicated Customer Directory & Credit Product Workspace
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137, #138, #139, #140, #141 & #142
 * Pure Engine-Driven Render Pattern with TransactionEngine Double-Entry Settlement
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { EnterpriseRegisterTable } from '../EnterpriseRegisterTable';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { LedgerEngine, CustomerEnrichedRecord } from '../../../../../lib/reports-v2/engines/LedgerEngine';
import { TransactionEngine } from '../../../../../lib/reports-v2/engines/TransactionEngine';
import { DollarSign, Send, CheckCircle, X } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'ledger' | 'outstanding' | 'recovery' | 'aging'>(
    reportId === 'CUS_OUTSTANDING' ? 'outstanding' :
    reportId === 'CUS_RECOVERY' ? 'recovery' : 'overview'
  );

  const [search, setSearch] = useState('');
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerEnrichedRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'easypaisa'>('cash');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [localSettlements, setLocalSettlements] = useState<Record<string, number>>({});

  // Subscribe to TransactionEngine events for real-time double-entry updates
  useEffect(() => {
    const unsubscribe = TransactionEngine.subscribe((result) => {
      if (result.success) {
        // Trigger Engine State Refetch
        customerQuery.refetch?.();
      }
    });
    return unsubscribe;
  }, [customerQuery]);

  const rawCustomerRows: Record<string, any>[] = customerQuery.result?.register?.rows || [];
  const salesRows: Record<string, any>[] = salesQuery.result?.register?.rows || [];
  const paymentRows: Record<string, any>[] = paymentsQuery.result?.register?.rows || [];

  // SINGLE SOURCE OF TRUTH LEDGER ENGINE CALCULATION (RULE #140 & #141)
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

  // ENTERPRISE RULES #138 & #139: STRICT ZERO-BALANCE FILTERING FOR OUTSTANDING & RECOVERY
  const debtorCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => c.balance > 0);
  }, [enrichedCustomers]);

  const totalOutstanding = useMemo(() => {
    return debtorCustomers.reduce((sum, c) => sum + c.balance, 0);
  }, [debtorCustomers]);

  const overdueCount = useMemo(() => {
    return debtorCustomers.filter((c) => c.isOverdue).length;
  }, [debtorCustomers]);

  const currentTabRows = useMemo(() => {
    let rows = (activeTab === 'outstanding' || activeTab === 'recovery')
      ? debtorCustomers
      : enrichedCustomers;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.cnic?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [activeTab, debtorCustomers, enrichedCustomers, search]);

  // RULE #140: ATOMIC DOUBLE-ENTRY TRANSACTION PROCESSING
  const handleSettlePayment = () => {
    if (!paymentCustomer || !paymentAmount || Number(paymentAmount) <= 0) return;
    const amt = Number(paymentAmount);

    // Process via TransactionEngine (Double Entry: Credit Customer | Debit Cash/Bank)
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
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5C3D] flex items-center justify-center text-xl font-bold">
              👥
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Customer Directory & Credit Workspace' : 'گاہک ڈائریکٹری و کریڈٹ ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isEn ? 'Single Source of Truth Ledger Engine (Rule #140)' : 'لائیو ڈبل اینٹری لیجر انجن'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${enrichedCustomers.length} Total Accounts | ${debtorCustomers.length} Debtor Dues` : `${enrichedCustomers.length} کل کھاتے | ${debtorCustomers.length} مقروض`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectReport?.('CUS_REGISTER')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>👤</span>
              <span>{isEn ? '+ New Customer' : '+ نیا کسٹمر'}</span>
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>💵</span>
              <span>{isEn ? 'Recovery Center' : 'وصولی سینٹر'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
            { id: 'register', label: 'Customer Register', labelUr: 'کسٹمر رجسٹر' },
            { id: 'ledger', label: 'Customer Ledger', labelUr: 'کسٹمر کھاتہ' },
            { id: 'outstanding', label: 'Outstanding Dues (Balance > 0)', labelUr: 'واجب الوصول بقایا' },
            { id: 'recovery', label: 'Recovery Center 💰', labelUr: 'ریکوری سینٹر 💰' },
            { id: 'aging', label: 'Aging Analysis', labelUr: 'ایجنگ تجزیہ' },
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

      {/* ── LIVE CUSTOMER KPIS (RULE #141 UNIFIED ENGINE OUTPUT) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-emerald-900">{isEn ? 'Total Customer Dues' : 'کل گاہک بقایا جات'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">ENGINE</span>
          </div>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">{formatCurrency(totalOutstanding)}</div>
          <div className="text-[10px] font-extrabold text-emerald-700 mt-2">{isEn ? `${debtorCustomers.length} Active Debtors` : `${debtorCustomers.length} مقروض اکاؤنٹس`}</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-blue-900">{isEn ? 'Total Registered Accounts' : 'کل ایکٹو کسٹمرز'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">{enrichedCustomers.length} Total</span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{enrichedCustomers.length} Accounts</div>
          <div className="text-[10px] font-extrabold text-blue-700 mt-2">{isEn ? 'Master directory' : 'رجسٹرڈ کھاتے'}</div>
        </div>

        <div className="bg-red-50/80 border border-red-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-red-900">{isEn ? 'Overdue Debtors (>60d)' : 'پرانے مقروض (>60 دن)'}</span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold">{overdueCount} Overdue</span>
          </div>
          <div className="text-2xl font-black text-red-700 tracking-tight">{overdueCount} Accounts</div>
          <div className="text-[10px] font-extrabold text-red-600 mt-2">{isEn ? 'High collection priority' : 'وصولی کی اعلی ترجیح'}</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-amber-900">{isEn ? 'Avg Outstanding / Debtor' : 'اوسط بقایا فی مقروض'}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">AVG</span>
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">
            {formatCurrency(debtorCustomers.length > 0 ? totalOutstanding / debtorCustomers.length : 0)}
          </div>
          <div className="text-[10px] font-extrabold text-amber-700 mt-2">{isEn ? 'Per debtor balance' : 'اوسط ڈیو'}</div>
        </div>
      </div>

      {/* ── WORKSPACE TABLE / RECOVERY CENTER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {activeTab === 'recovery'
                ? (isEn ? '💰 Customer Recovery Collection Center' : '💰 کسٹمر وصولی کلیکشن سینٹر')
                : activeTab === 'outstanding'
                ? (isEn ? '📒 Outstanding Dues Register (Balance > 0 Only)' : '📒 واجب الوصول بقایا جات (صرف >0 بیلنس)')
                : (isEn ? '📋 Customer Master Directory & Ledger' : '📋 گاہک رجسٹر و کریڈٹ لیجر')}
            </h2>
            {(activeTab === 'outstanding' || activeTab === 'recovery') && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black">
                {isEn ? `${currentTabRows.length} Active Debtors` : `${currentTabRows.length} مقروض`}
              </span>
            )}
          </div>

          <input
            type="text"
            placeholder={isEn ? '🔍 Search customer, phone, CNIC...' : '🔍 گاہک، فون یا شناخت تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[240px]"
          />
        </div>

        {/* RECOVERY CENTER CUSTOM VIEW WITH ACTION BUTTONS */}
        {activeTab === 'recovery' ? (
          currentTabRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">{isEn ? 'Customer Name' : 'گاہک کا نام'}</th>
                    <th className="p-3">{isEn ? 'Phone' : 'فون'}</th>
                    <th className="p-3">{isEn ? 'CNIC' : 'شناختی کارڈ'}</th>
                    <th className="p-3 text-right">{isEn ? 'Outstanding Due' : 'بقایا رقم'}</th>
                    <th className="p-3 text-center">{isEn ? 'Recovery Action' : 'وصولی ایکشن'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {currentTabRows.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-extrabold text-slate-900">{c.name}</td>
                      <td className="p-3 text-slate-600">{c.phone}</td>
                      <td className="p-3 text-slate-600">{c.cnic}</td>
                      <td className="p-3 text-right font-black text-red-600 text-sm">
                        {formatCurrency(c.balance)}
                      </td>
                      <td className="p-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPaymentCustomer(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
                        >
                          <DollarSign size={13} />
                          <span>{isEn ? 'Receive Payment' : 'وصولی کریں'}</span>
                        </button>
                        <a
                          href={`https://wa.me/${c.phone}?text=${encodeURIComponent(
                            `Salam ${c.name}, your outstanding fuel account balance is ${formatCurrency(
                              c.balance
                            )}. Please settle payment.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-black transition-all"
                        >
                          <Send size={13} />
                          <span>WhatsApp</span>
                        </a>
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
                {isEn ? 'Zero Outstanding Debtors in Recovery!' : 'وصولی کے لیے کوئی مقروض گاہک باقی نہیں!'}
              </h3>
              <p className="text-xs font-semibold text-emerald-700">
                {isEn ? 'All customer accounts are 100% settled and paid up.' : 'تمام کسٹمر اکاؤنٹس مکمل طور پر کلیئر اور نل بیلنس ہیں۔'}
              </p>
            </div>
          )
        ) : (
          currentTabRows.length > 0 ? (
            <EnterpriseRegisterTable
              columns={[
                { id: 'name', header: 'Customer Name', headerUr: 'کسٹمر نام', accessor: 'name', sortable: true },
                { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
                { id: 'cnic', header: 'CNIC / NTN', headerUr: 'شناختی کارڈ', accessor: 'cnic' },
                { id: 'balance', header: 'Outstanding Due (₨)', headerUr: 'بقایا رقم', accessor: 'balance', isCurrency: true, sortable: true },
              ]}
              data={currentTabRows}
              language={lang}
              onRowClick={(row) => setSelectedRecord(row)}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
              <div className="text-4xl mb-3 opacity-60">👥</div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                {isEn ? 'No Debtors Found for Selected Criteria' : 'کوئی مقروض گاہک نہیں ملا'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mb-6 max-w-md mx-auto">
                {isEn ? 'All accounts are settled or no records match your filter criteria.' : 'منتخب کردہ فلٹر کے مطابق کوئی ریکارڈ نہیں مل سکا۔'}
              </p>
            </div>
          )
        )}
      </div>

      {/* ── RECOVERY PAYMENT SETTLEMENT MODAL (TRANSACTION ENGINE DOUBLE-ENTRY) ── */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                💵 {isEn ? `Record Payment — ${paymentCustomer.name}` : `وصولی اندراج — ${paymentCustomer.name}`}
              </h3>
              <button onClick={() => setPaymentCustomer(null)} className="text-slate-400 hover:text-slate-600">
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
                  <span className="text-slate-500">{isEn ? 'Current Outstanding Balance:' : 'موجودہ بقایا جات:'}</span>
                  <span className="font-black text-red-600 text-sm">{formatCurrency(paymentCustomer.balance)}</span>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    {isEn ? 'Payment Amount (₨)' : 'وصول شدہ رقم (رقم)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    {isEn ? 'Payment Mode (Double-Entry Debit Target)' : 'ادائیگی کا ذریعہ'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: '💵 Cash' },
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
                    onClick={() => setPaymentCustomer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    {isEn ? 'Cancel' : 'منسوخ'}
                  </button>
                  <button
                    onClick={handleSettlePayment}
                    className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all shadow-xs"
                  >
                    ✓ {isEn ? 'Confirm & Post Transaction' : 'ادائیگی کی تصدیق کریں'}
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
