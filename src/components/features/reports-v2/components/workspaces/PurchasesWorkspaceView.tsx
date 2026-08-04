/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchasesWorkspaceView — Dedicated Purchases & Deliveries Product Workspace
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

function formatLiters(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `${n.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L`;
}

interface PurchasesWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const PurchasesWorkspaceView: React.FC<PurchasesWorkspaceViewProps> = ({
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

  const purchasesQuery = useReportExecution('PUR_REGISTER', queryContext);
  const suppliersQuery = useReportExecution('SUP_REGISTER', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'deliveries' | 'register'>('overview');
  const [search, setSearch] = useState('');

  const purchaseRows: Record<string, any>[] = purchasesQuery.result?.register?.rows || [];
  const supplierRows: Record<string, any>[] = suppliersQuery.result?.register?.rows || [];

  const totalPurchaseAmount = useMemo(() => {
    return purchaseRows.reduce((sum, r) => sum + (Number(r.totalAmount || r.amount) || 0), 0);
  }, [purchaseRows]);

  const totalLitersDelivered = useMemo(() => {
    return purchaseRows.reduce((sum, r) => sum + (Number(r.liters || r.quantity) || 0), 0);
  }, [purchaseRows]);

  const avgCostPerLiter = useMemo(() => {
    if (totalLitersDelivered === 0) return 0;
    return totalPurchaseAmount / totalLitersDelivered;
  }, [totalPurchaseAmount, totalLitersDelivered]);

  const filteredPurchaseRows = useMemo(() => {
    if (!search.trim()) return purchaseRows;
    const q = search.toLowerCase();
    return purchaseRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [purchaseRows, search]);

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl font-bold">
              🚛
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Purchases & Bowser Deliveries Workspace' : 'خریداری و باؤزر ڈیلیوری ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-black border border-purple-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                  {isEn ? 'Live Purchases Stream' : 'لائیو فائر بیس اسٹریم'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${purchaseRows.length} Purchase Invoices` : `${purchaseRows.length} خریداری انوائسز`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectReport?.('PUR_REGISTER')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>🧾</span>
              <span>{isEn ? '+ Record Purchase' : '+ خریداری اندراج'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
            { id: 'history', label: 'Purchase History', labelUr: 'خریداری ہسٹری' },
            { id: 'deliveries', label: 'Bowser Deliveries', labelUr: 'باؤزر ڈیلیوریز' },
            { id: 'register', label: 'Purchase Register', labelUr: 'پرچیز رجسٹر' },
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

      {/* ── LIVE PURCHASES KPIS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-purple-900">{isEn ? 'Total Purchases' : 'کل خریداری رقم'}</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">{formatCurrency(totalPurchaseAmount)}</div>
          <div className="text-[10px] font-extrabold text-purple-700 mt-2">{isEn ? 'Sum of purchase invoices' : 'کل پرچیز بلز'}</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-blue-900">{isEn ? 'Liters Delivered' : 'کل باؤزر ڈیلیوری'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{formatLiters(totalLitersDelivered)}</div>
          <div className="text-[10px] font-extrabold text-blue-700 mt-2">{isEn ? 'Fuel stock received' : 'وصول شدہ ڈیلوریز'}</div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-emerald-900">{isEn ? 'Avg Cost / Liter' : 'اوسط لاگت پر لیٹر'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">AVG</span>
          </div>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">{formatCurrency(avgCostPerLiter)}</div>
          <div className="text-[10px] font-extrabold text-emerald-700 mt-2">{isEn ? 'Weighted average cost' : 'اوسط لاگت'}</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-amber-900">{isEn ? 'Active Suppliers' : 'سپلائرز گنتی'}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">{supplierRows.length} Suppliers</span>
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">{supplierRows.length} Registered</div>
          <div className="text-[10px] font-extrabold text-amber-700 mt-2">{isEn ? 'OMC Fuel Vendors' : 'سپلائرز ڈائریکٹری'}</div>
        </div>
      </div>

      {/* ── REGISTER TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? '📋 Bowser Delivery & Purchase Register' : '📋 خریداری و ڈیلیوری رجسٹر'}
          </h2>

          <input
            type="text"
            placeholder={isEn ? '🔍 Search supplier, invoice, bowser...' : '🔍 سپلائر یا انوائس تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[220px]"
          />
        </div>

        {filteredPurchaseRows.length > 0 ? (
          <EnterpriseRegisterTable
            columns={[
              { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
              { id: 'supplierName', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplierName', sortable: true },
              { id: 'invoiceNo', header: 'Invoice #', headerUr: 'انوائس #', accessor: 'invoiceNo', sortable: true },
              { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
              { id: 'liters', header: 'Liters', headerUr: 'لیٹر', accessor: 'liters', isNumeric: true },
              { id: 'rate', header: 'Rate (₨/L)', headerUr: 'ریٹ', accessor: 'rate', isCurrency: true },
              { id: 'totalAmount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true },
            ]}
            data={filteredPurchaseRows}
            language={lang}
            onRowClick={(row) => setSelectedRecord(row)}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
            <div className="text-4xl mb-3 opacity-60">🚛</div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              {isEn ? 'No Purchase Invoices Recorded' : 'کوئی خریداری انوائس نہیں ملی'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6 max-w-md mx-auto">
              {isEn ? 'Start recording fuel bowser deliveries and OMC invoices to view live purchase analytics.' : 'لائیو پرچیز تجزیات دیکھنے کے لیے خریداری کا اندراج شروع کریں۔'}
            </p>
            <button
              onClick={() => onSelectReport?.('PUR_REGISTER')}
              className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
            >
              🧾 {isEn ? 'Record First Purchase' : 'خریداری کا اندراج کریں'}
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
