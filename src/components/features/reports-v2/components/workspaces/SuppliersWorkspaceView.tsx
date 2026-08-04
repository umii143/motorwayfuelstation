/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SuppliersWorkspaceView — Dedicated Supplier Directory & Payables Product Workspace
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137, #138 & #139
 * Single Source of Truth Ledger Engine for Supplier Payables
 */

import React, { useState, useMemo } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { EnterpriseRegisterTable } from '../EnterpriseRegisterTable';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { LedgerEngine, SupplierEnrichedRecord } from '../../../../../lib/reports-v2/engines/LedgerEngine';

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

  // Realtime Firestore Queries
  const supplierQuery = useReportExecution('SUP_REGISTER', queryContext);
  const purchasesQuery = useReportExecution('PUR_REGISTER', queryContext);
  const paymentsQuery = useReportExecution('PAYMENTS', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'ledger' | 'payables'>('overview');
  const [search, setSearch] = useState('');

  const rawSupplierRows: Record<string, any>[] = supplierQuery.result?.register?.rows || [];
  const purchaseRows: Record<string, any>[] = purchasesQuery.result?.register?.rows || [];
  const paymentRows: Record<string, any>[] = paymentsQuery.result?.register?.rows || [];

  // SINGLE SOURCE OF TRUTH LEDGER ENGINE CALCULATION
  const enrichedSupplierRows: SupplierEnrichedRecord[] = useMemo(() => {
    return LedgerEngine.calculateSupplierBalances(rawSupplierRows, purchaseRows, paymentRows);
  }, [rawSupplierRows, purchaseRows, paymentRows]);

  const totalPayables = useMemo(() => {
    return enrichedSupplierRows.reduce((sum, r) => sum + r.balance, 0);
  }, [enrichedSupplierRows]);

  const filteredSupplierRows = useMemo(() => {
    if (!search.trim()) return enrichedSupplierRows;
    const q = search.toLowerCase();
    return enrichedSupplierRows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.contactPerson?.toLowerCase().includes(q)
    );
  }, [enrichedSupplierRows, search]);

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-bold">
              🏢
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Supplier Directory & Payables Workspace' : 'سپلائر ڈائریکٹری و واجبات ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-black border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  {isEn ? 'Single Source of Truth Ledger Engine' : 'لائیو سپلائر لیجر سنک'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${enrichedSupplierRows.length} Fuel Vendors` : `${enrichedSupplierRows.length} درج شدہ سپلائرز`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectReport?.('SUP_PAYMENTS')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>💵</span>
              <span>{isEn ? '+ Settle Payment' : '+ ادائیگی کریں'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
            { id: 'register', label: 'Supplier Register', labelUr: 'سپلائر رجسٹر' },
            { id: 'ledger', label: 'Supplier Ledger', labelUr: 'سپلائر کھاتہ' },
            { id: 'payables', label: 'Outstanding Payables', labelUr: 'واجب الادا بقایا' },
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
            <span className="text-xs font-black text-indigo-900">{isEn ? 'Total Supplier Payables' : 'کل سپلائرز واجب الادا'}</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 tracking-tight">{formatCurrency(totalPayables)}</div>
          <div className="text-[10px] font-extrabold text-indigo-700 mt-2">{isEn ? 'Calculated via Single Source Ledger Engine' : 'لیجر انجن سے سنکرونائزڈ'}</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-blue-900">{isEn ? 'Active OMC Vendors' : 'ایکٹو سپلائرز'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">{enrichedSupplierRows.length} Vendors</span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{enrichedSupplierRows.length} Registered</div>
          <div className="text-[10px] font-extrabold text-blue-700 mt-2">{isEn ? 'PSO / Shell / Total / OMC' : 'تیل کمپنیاں'}</div>
        </div>
      </div>

      {/* ── REGISTER TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? '📋 Supplier Directory & Synchronized Ledger' : '📋 سپلائرز ڈائریکٹری و لیجر سنک'}
          </h2>

          <input
            type="text"
            placeholder={isEn ? '🔍 Search supplier, phone...' : '🔍 سپلائر یا فون تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[200px]"
          />
        </div>

        {filteredSupplierRows.length > 0 ? (
          <EnterpriseRegisterTable
            columns={[
              { id: 'name', header: 'Supplier Name', headerUr: 'سپلائر نام', accessor: 'name', sortable: true },
              { id: 'phone', header: 'Phone', headerUr: 'فون', accessor: 'phone' },
              { id: 'balance', header: 'Payable Balance (₨)', headerUr: 'واجب الادا رقم', accessor: 'balance', isCurrency: true, sortable: true },
            ]}
            data={filteredSupplierRows}
            language={lang}
            onRowClick={(row) => setSelectedRecord(row)}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
            <div className="text-4xl mb-3 opacity-60">🏢</div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              {isEn ? 'No Supplier Records Found' : 'کوئی سپلائر نہیں ملا'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6 max-w-md mx-auto">
              {isEn ? 'Register fuel suppliers and OMCs to track bowser deliveries and payables.' : 'سپلائرز کا اندراج شروع کریں۔'}
            </p>
            <button
              onClick={() => onSelectReport?.('SUP_REGISTER')}
              className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
            >
              🏢 {isEn ? 'Register First Supplier' : 'نیا سپلائر درج کریں'}
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
