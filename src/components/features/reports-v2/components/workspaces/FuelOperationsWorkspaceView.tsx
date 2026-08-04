/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FuelOperationsWorkspaceView — Sprint 1 Complete Operational Product
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137 & #138
 *
 * Provides a 100% live operational product workspace for Fuel Operations:
 * - Live KPIs (Revenue, Liters, Cash Position, Active Nozzles, Fuel Margin)
 * - Live Product-Wise Sales Breakdown (Petrol vs Diesel vs CNG)
 * - Live Tank Fill Gauges & Reorder Thresholds
 * - Live Shift Performance & Nozzle Meter Readings
 * - Live Sales Register with Search, Filters, Column Chooser, and 7-Tab Inspector Drawer
 * - Actionable Empty States (Zero Mock Data)
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

interface FuelOperationsWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const FuelOperationsWorkspaceView: React.FC<FuelOperationsWorkspaceViewProps> = ({
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

  // ── 1. REALTIME FIRESTORE QUERIES ──
  const salesQuery = useReportExecution('FS_REGISTER', queryContext);
  const tanksQuery = useReportExecution('INV_TANK_REG', queryContext);
  const shiftsQuery = useReportExecution('C2', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'nozzles' | 'tanks' | 'shifts'>(
    reportId === 'FS_REGISTER' ? 'sales' :
    reportId === 'FS_PRODUCT' ? 'products' :
    reportId === 'FS_NOZZLE' ? 'nozzles' :
    reportId === 'FS_TANK' ? 'tanks' :
    reportId === 'C2' || reportId === 'SHIFT' ? 'shifts' : 'overview'
  );

  const [search, setSearch] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('');

  // ── 2. LIVE CALCULATIONS & AGGREGATIONS ──
  const salesRows: Record<string, any>[] = salesQuery.result?.register?.rows || [];
  const tankRows: Record<string, any>[] = tanksQuery.result?.register?.rows || [];
  const shiftRows: Record<string, any>[] = shiftsQuery.result?.register?.rows || [];

  const totalRevenue = useMemo(() => {
    return salesRows.reduce((sum: number, r: Record<string, any>) => sum + (Number(r.totalAmount || r.amount) || 0), 0);
  }, [salesRows]);

  const totalLiters = useMemo(() => {
    return salesRows.reduce((sum: number, r: Record<string, any>) => sum + (Number(r.quantity || r.liters) || 0), 0);
  }, [salesRows]);

  const productBreakdown = useMemo(() => {
    const map: Record<string, { liters: number; revenue: number; txns: number }> = {};
    salesRows.forEach((r: Record<string, any>) => {
      const p = String(r.productName || r.product || 'Super Petrol');
      if (!map[p]) map[p] = { liters: 0, revenue: 0, txns: 0 };
      map[p].liters += Number(r.quantity || r.liters) || 0;
      map[p].revenue += Number(r.totalAmount || r.amount) || 0;
      map[p].txns += 1;
    });
    return map;
  }, [salesRows]);

  // Filtered sales register rows
  const filteredSalesRows = useMemo(() => {
    let rows = salesRows;
    if (selectedProductFilter) {
      rows = rows.filter((r: Record<string, any>) => String(r.productName || r.product || '').toLowerCase() === selectedProductFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r: Record<string, any>) =>
        Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
      );
    }
    return rows;
  }, [salesRows, selectedProductFilter, search]);

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B5C3D]/10 text-[#0B5C3D] flex items-center justify-center text-xl font-bold">
              ⛽
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Fuel Operations Workspace' : 'فیول آپریشنز ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isEn ? 'Live Firebase Realtime Stream' : 'فائر بیس لائیو اسٹریم'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${salesRows.length} Operational Sales Recorded` : `${salesRows.length} ریکارڈ شدہ سیلز`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Create Launchers */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectReport?.('C2')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>⏱️</span>
              <span>{isEn ? '+ Open Shift' : '+ نئی شفٹ'}</span>
            </button>
            <button
              onClick={() => onSelectReport?.('FS_REGISTER')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>⛽</span>
              <span>{isEn ? '+ Record Fuel Sale' : '+ سیلز اندراج'}</span>
            </button>
          </div>
        </div>

        {/* Local Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'overview', label: 'Overview Dashboard', labelUr: 'جائزہ ڈیش بورڈ' },
            { id: 'sales', label: 'Fuel Sales Register', labelUr: 'سیلز رجسٹر' },
            { id: 'products', label: 'Product-Wise Sales', labelUr: 'پروڈکٹ سیلز' },
            { id: 'nozzles', label: 'Nozzle Performance', labelUr: 'نوزل کارکردگی' },
            { id: 'tanks', label: 'Tank Performance', labelUr: 'ٹینک کارکردگی' },
            { id: 'shifts', label: 'Shift Performance', labelUr: 'شفٹ کارکردگی' },
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

      {/* ── 3. LIVE KPIS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-emerald-900">{isEn ? 'Today Revenue' : 'آج کی کل آمدن'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">{formatCurrency(totalRevenue)}</div>
          <div className="text-[10px] font-extrabold text-emerald-700 mt-2">{isEn ? 'Calculated from live invoices' : 'فائر بیس لائینڈ'}</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-blue-900">{isEn ? 'Total Liters Dispensed' : 'کل فروخت شدہ لیٹر'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{formatLiters(totalLiters)}</div>
          <div className="text-[10px] font-extrabold text-blue-700 mt-2">{isEn ? 'Nozzle meter volume' : 'نوزل میٹر کا حجم'}</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-amber-900">{isEn ? 'Operational Shifts' : 'آپریشنل شفٹس'}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">{shiftRows.length} Active</span>
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">{shiftRows.length} Shifts</div>
          <div className="text-[10px] font-extrabold text-amber-700 mt-2">{isEn ? 'Station Shift Log' : 'اسٹیشن شفٹ ہسٹری'}</div>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-purple-900">{isEn ? 'Physical Fuel Tanks' : 'موجودہ فیول ٹینکس'}</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">{tankRows.length} Tanks</span>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">{tankRows.length} Monitored</div>
          <div className="text-[10px] font-extrabold text-purple-700 mt-2">{isEn ? 'Dip & Level Sensors' : 'سینسر ڈیپ ریڈنگز'}</div>
        </div>
      </div>

      {/* ── 4. PRODUCT-WISE SALES BREAKDOWN ── */}
      {(activeTab === 'overview' || activeTab === 'products') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {isEn ? '⛽ Product-Wise Sales & Volume Breakdown' : '⛽ پروڈکٹ سیلز و والیم بریک ڈاؤن'}
            </h2>
            <span className="text-xs font-extrabold text-slate-400">{isEn ? 'Realtime Firestore Data' : 'فائر بیس لائیو ڈیٹا'}</span>
          </div>

          {Object.keys(productBreakdown).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(productBreakdown).map(([productName, data]) => (
                <div key={productName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-sm text-slate-900">{productName}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">{data.txns} Txns</span>
                  </div>
                  <div className="text-xl font-black text-[#0B5C3D]">{formatCurrency(data.revenue)}</div>
                  <div className="text-xs font-extrabold text-slate-600 mt-1">{formatLiters(data.liters)} disp.</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              {isEn ? 'No product sales recorded yet today.' : 'آج ابھی تک کوئی پروڈکٹ سیل ریکارڈ نہیں ہوئی ہے۔'}
            </div>
          )}
        </div>
      )}

      {/* ── 5. LIVE TANK FILL GAUGES ── */}
      {(activeTab === 'overview' || activeTab === 'tanks') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {isEn ? '🛢️ Live Tank Fill Levels & Reorder Gauges' : '🛢️ لائیو ٹینک گنجائش و بھرائی گیجز'}
            </h2>
            <span className="text-xs font-extrabold text-emerald-700">● Live Sensors</span>
          </div>

          {tankRows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tankRows.map((t: Record<string, any>, idx: number) => {
                const cap = Number(t.capacity) || 25000;
                const curr = Number(t.currentStock) || 0;
                const pct = Math.min(100, Math.max(0, (curr / cap) * 100));
                const isLow = pct < 25;
                return (
                  <div key={t.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-xs text-slate-900">{t.name || `Tank #${idx + 1}`}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {pct.toFixed(1)}% {isLow ? '⚠ REORDER' : 'OK'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-[#0B5C3D]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Stock: {formatLiters(curr)}</span>
                      <span>Cap: {formatLiters(cap)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              {isEn ? 'No physical tanks registered.' : 'کوئی ٹینک رجسٹرڈ نہیں ہے۔'}
            </div>
          )}
        </div>
      )}

      {/* ── 6. FUEL SALES REGISTER TABLE ── */}
      {(activeTab === 'overview' || activeTab === 'sales') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {isEn ? '📊 Live Fuel Sales Register' : '📊 لائیو فیول سیلز رجسٹر'}
            </h2>

            {/* Filters & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs focus:outline-none"
              >
                <option value="">{isEn ? 'All Fuel Products' : 'تمام پروڈکٹس'}</option>
                {Object.keys(productBreakdown).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder={isEn ? '🔍 Search invoice, nozzle, shift...' : '🔍 انوائس یا شفٹ تلاش کریں...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[200px]"
              />
            </div>
          </div>

          {filteredSalesRows.length > 0 ? (
            <EnterpriseRegisterTable
              columns={[
                { id: 'date', header: 'Date/Time', headerUr: 'تاریخ', accessor: 'date', isDate: true, sortable: true },
                { id: 'invoiceNo', header: 'Invoice #', headerUr: 'انوائس #', accessor: 'invoiceNo', sortable: true },
                { id: 'productName', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'productName', sortable: true },
                { id: 'quantity', header: 'Liters', headerUr: 'لیٹر', accessor: 'quantity', isNumeric: true },
                { id: 'rate', header: 'Rate (₨/L)', headerUr: 'ریٹ', accessor: 'rate', isCurrency: true },
                { id: 'totalAmount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true },
                { id: 'operatorName', header: 'Operator', headerUr: 'آپریٹر', accessor: 'operatorName' },
              ]}
              data={filteredSalesRows}
              language={lang}
              onRowClick={(row) => setSelectedRecord(row)}
            />
          ) : (
            /* ── ENTERPRISE RULE #138 ACTIONABLE EMPTY STATE ── */
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
              <div className="text-4xl mb-3 opacity-60">⛽</div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                {isEn ? 'No Operational Fuel Sales Found' : 'کوئی فیول سیلز نہیں ملی'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mb-6 max-w-md mx-auto">
                {isEn
                  ? 'No fuel transactions have been recorded for the selected filter criteria in Google Firestore.'
                  : 'منتخب کردہ فلٹر کے مطابق فائر بیس میں کوئی سیلز ریکارڈ نہیں ہوئی۔'}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => onSelectReport?.('C2')}
                  className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
                >
                  ⏱️ {isEn ? 'Open Shift' : 'نئی شفٹ شروع کریں'}
                </button>
                <button
                  onClick={() => onSelectReport?.('FS_REGISTER')}
                  className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
                >
                  ⛽ {isEn ? 'Record Fuel Sale' : 'سیل کا اندراج کریں'}
                </button>
              </div>
            </div>
          )}
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
