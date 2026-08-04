/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FinanceWorkspaceView — Dedicated Finance, Cash Book & Banking Product Workspace
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

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role }),
    [stationId, orgId, userId, role]
  );

  const cashQuery = useReportExecution('FIN_CASHBOOK', queryContext);
  const bankQuery = useReportExecution('B', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cashbook' | 'bank' | 'pnl'>('overview');
  const [search, setSearch] = useState('');

  const cashRows: Record<string, any>[] = cashQuery.result?.register?.rows || [];
  const bankRows: Record<string, any>[] = bankQuery.result?.register?.rows || [];

  const totalCashPosition = useMemo(() => {
    return cashRows.reduce((sum, r) => sum + (Number(r.amount || r.balance) || 0), 0);
  }, [cashRows]);

  const totalBankBalance = useMemo(() => {
    return bankRows.reduce((sum, r) => sum + (Number(r.balance || r.amount) || 0), 0);
  }, [bankRows]);

  const filteredCashRows = useMemo(() => {
    if (!search.trim()) return cashRows;
    const q = search.toLowerCase();
    return cashRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [cashRows, search]);

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5C3D] flex items-center justify-center text-xl font-bold">
              💰
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Finance & Cash Book Workspace' : 'مالیات و کیش بک ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isEn ? 'Live Treasury Stream' : 'لائیو کیش پوزیشن'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${cashRows.length} Cash Transactions` : `${cashRows.length} کیش اندراجات`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectReport?.('FIN_CASHBOOK')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>💵</span>
              <span>{isEn ? '+ Cash Voucher' : '+ کیش واؤچر'}</span>
            </button>
            <button
              onClick={() => onSelectReport?.('B')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>🏦</span>
              <span>{isEn ? '+ Bank Deposit' : '+ بینک ڈیپازٹ'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
            { id: 'cashbook', label: 'Cash Book', labelUr: 'کیش بک' },
            { id: 'bank', label: 'Bank Ledger', labelUr: 'بینک کھاتہ' },
            { id: 'pnl', label: 'Profit & Loss', labelUr: 'نفع و نقصان' },
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

      {/* ── LIVE FINANCE KPIS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-emerald-900">{isEn ? 'Cash Position' : 'نقد کیش پوزیشن'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">{formatCurrency(totalCashPosition)}</div>
          <div className="text-[10px] font-extrabold text-emerald-700 mt-2">{isEn ? 'Station cash in hand' : 'اسٹیشن نقد کیش'}</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-blue-900">{isEn ? 'Bank Balances' : 'بینک اکاؤنٹس بیلنس'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">HBL / MCB</span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{formatCurrency(totalBankBalance)}</div>
          <div className="text-[10px] font-extrabold text-blue-700 mt-2">{isEn ? 'Bank deposits' : 'بینک بیلنس'}</div>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-purple-900">{isEn ? 'Total Liquidity' : 'کل نقد و بینک پوزیشن'}</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">TOTAL</span>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">{formatCurrency(totalCashPosition + totalBankBalance)}</div>
          <div className="text-[10px] font-extrabold text-purple-700 mt-2">{isEn ? 'Cash + Bank sum' : 'مجموعی لیکویڈیٹی'}</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-amber-900">{isEn ? 'Bank Accounts' : 'بینک اکاؤنٹس'}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">{bankRows.length} Active</span>
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">{bankRows.length} Accounts</div>
          <div className="text-[10px] font-extrabold text-amber-700 mt-2">{isEn ? 'Registered banks' : 'اسٹیشن بینکس'}</div>
        </div>
      </div>

      {/* ── REGISTER TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? '📋 Cash Book Register' : '📋 کیش بک رجسٹر'}
          </h2>

          <input
            type="text"
            placeholder={isEn ? '🔍 Search voucher, description...' : '🔍 واؤچر یا تفصیل تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[220px]"
          />
        </div>

        {filteredCashRows.length > 0 ? (
          <EnterpriseRegisterTable
            columns={[
              { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
              { id: 'voucherNo', header: 'Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo', sortable: true },
              { id: 'description', header: 'Particulars', headerUr: 'تفصیل', accessor: 'description' },
              { id: 'amount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'amount', isCurrency: true, sortable: true },
            ]}
            data={filteredCashRows}
            language={lang}
            onRowClick={(row) => setSelectedRecord(row)}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
            <div className="text-4xl mb-3 opacity-60">💵</div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              {isEn ? 'No Cash Book Transactions Recorded' : 'کوئی کیش منتقلی نہیں ملی'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6 max-w-md mx-auto">
              {isEn ? 'Record cash collections and bank deposits to manage treasury position.' : 'کیش واؤچرز کا اندراج شروع کریں۔'}
            </p>
            <button
              onClick={() => onSelectReport?.('FIN_CASHBOOK')}
              className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
            >
              💵 {isEn ? 'Record First Cash Transaction' : 'نقد کا اندراج کریں'}
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
