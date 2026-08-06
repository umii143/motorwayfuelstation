/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ExpensesWorkspaceView — Dedicated Expense Vouchers Product Workspace
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137 & #138
 */

import React, { useState, useMemo } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { EnterpriseRegisterTable } from '../EnterpriseRegisterTable';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface ExpensesWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const ExpensesWorkspaceView: React.FC<ExpensesWorkspaceViewProps> = ({
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

  const expenseQuery = useReportExecution('FIN_EXPENSE', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vouchers' | 'categories'>('overview');
  const [search, setSearch] = useState('');

  const expenseRows: Record<string, any>[] = expenseQuery.result?.register?.rows || [];

  const totalExpenseAmount = useMemo(() => {
    return expenseRows.reduce((sum, r) => sum + (Number(r.amount || r.totalAmount) || 0), 0);
  }, [expenseRows]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    expenseRows.forEach((r) => {
      const cat = String(r.category || r.expenseCategory || 'General Expense');
      if (!map[cat]) map[cat] = { amount: 0, count: 0 };
      map[cat].amount += Number(r.amount || r.totalAmount) || 0;
      map[cat].count += 1;
    });
    return map;
  }, [expenseRows]);

  const filteredExpenseRows = useMemo(() => {
    if (!search.trim()) return expenseRows;
    const q = search.toLowerCase();
    return expenseRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [expenseRows, search]);

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center text-xl font-bold">
              💸
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Station Expenses Workspace' : 'اسٹیشن اخراجات ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 text-[10px] font-black border border-orange-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  {isEn ? 'Live Expense Stream' : 'لائیو اخراجات اسٹریم'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${expenseRows.length} Vouchers Logged` : `${expenseRows.length} اخراجات واؤچرز`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectReport?.('FIN_EXPENSE')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white hover:bg-primary-hover rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>💸</span>
              <span>{isEn ? '+ Expense Voucher' : '+ اخراجات واؤچر'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto custom-horizontal-scrollbar pb-1.5" data-horizontal-scroll="true">
          {[
            { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
            { id: 'vouchers', label: 'Expense Vouchers', labelUr: 'واؤچرز رجسٹر' },
            { id: 'categories', label: 'Category Breakdown', labelUr: 'زمرہ جات بریک ڈاؤن' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {isEn ? tab.label : tab.labelUr}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIVE EXPENSE KPIS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-orange-50/80 border border-orange-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-orange-900">{isEn ? 'Total Expenses' : 'کل اخراجات رقم'}</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-orange-900 tracking-tight">{formatCurrency(totalExpenseAmount)}</div>
          <div className="text-[10px] font-extrabold text-orange-700 mt-2">{isEn ? 'Total vouchers recorded' : 'کل ریکارڈ شدہ رقم'}</div>
        </div>

        <div className="bg-[#9A4210]/10 border border-orange-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-[#9A4210]">{isEn ? 'Expense Vouchers' : 'کل واؤچرز گنتی'}</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold">{expenseRows.length} Logged</span>
          </div>
          <div className="text-2xl font-black text-[#9A4210] tracking-tight">{expenseRows.length} Vouchers</div>
          <div className="text-[10px] font-extrabold text-[#9A4210] mt-2">{isEn ? 'Station operating cost' : 'واؤچرز ہسٹری'}</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-amber-900">{isEn ? 'Categories Active' : 'اخراجات کی اقسام'}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">{Object.keys(categoryBreakdown).length} Cats</span>
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">{Object.keys(categoryBreakdown).length} Categories</div>
          <div className="text-[10px] font-extrabold text-amber-700 mt-2">{isEn ? 'Active expense breakdown' : 'زمرہ جات'}</div>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-purple-900">{isEn ? 'Avg Voucher Amount' : 'اوسط واؤچر رقم'}</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">AVG</span>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">
            {formatCurrency(expenseRows.length > 0 ? totalExpenseAmount / expenseRows.length : 0)}
          </div>
          <div className="text-[10px] font-extrabold text-purple-700 mt-2">{isEn ? 'Average per entry' : 'اوسط واؤچر لاگت'}</div>
        </div>
      </div>

      {/* ── CATEGORY BREAKDOWN CARDS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? '📊 Expense Category Distribution' : '📊 اخراجات کی زمرہ وار تقسیم'}
          </h2>
          <span className="text-xs font-extrabold text-slate-400">Realtime Firestore</span>
        </div>

        {Object.keys(categoryBreakdown).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(categoryBreakdown).map(([catName, data]) => (
              <div key={catName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-sm text-slate-900">{catName}</span>
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black">{data.count} Vouchers</span>
                </div>
                <div className="text-xl font-black text-orange-700">{formatCurrency(data.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            {isEn ? 'No expense vouchers logged yet.' : 'کوئی اخراجات واؤچر ریکارڈ نہیں ہوا۔'}
          </div>
        )}
      </div>

      {/* ── REGISTER TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? '📋 Expense Voucher Register' : '📋 اخراجات واؤچرز رجسٹر'}
          </h2>

          <input
            type="text"
            placeholder={isEn ? '🔍 Search category, voucher #, description...' : '🔍 واؤچر یا تفصیل تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[220px]"
          />
        </div>

        {filteredExpenseRows.length > 0 ? (
          <EnterpriseRegisterTable
            columns={[
              { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
              { id: 'voucherNo', header: 'Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo', sortable: true },
              { id: 'category', header: 'Category', headerUr: 'زمرہ', accessor: 'category', sortable: true },
              { id: 'description', header: 'Description', headerUr: 'تفصیل', accessor: 'description' },
              { id: 'amount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'amount', isCurrency: true, sortable: true },
            ]}
            data={filteredExpenseRows}
            language={lang}
            onRowClick={(row) => setSelectedRecord(row)}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
            <div className="text-4xl mb-3 opacity-60">💸</div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              {isEn ? 'No Expense Vouchers Recorded' : 'کوئی اخراجات نہیں ملے'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6 max-w-md mx-auto">
              {isEn ? 'Start recording station maintenance, salary, and utility vouchers.' : 'اخراجات واؤچرز کا اندراج شروع کریں۔'}
            </p>
            <button
              onClick={() => onSelectReport?.('FIN_EXPENSE')}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-all cursor-pointer shadow-xs"
            >
              💸 {isEn ? 'Create First Expense Voucher' : 'نیا اخراجات واؤچر کا اندراج کریں'}
            </button>
          </div>
        )}
      </div>

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
