/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryWorkspaceView — Dedicated Fuel Stock & Tank Dip Product Workspace
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137 & #138
 */

import React, { useState, useMemo } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { EnterpriseRegisterTable } from '../EnterpriseRegisterTable';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';

function formatLiters(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `${n.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L`;
}

interface InventoryWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const InventoryWorkspaceView: React.FC<InventoryWorkspaceViewProps> = ({
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

  const tanksQuery = useReportExecution('INV_TANK_REG', queryContext);
  const dipsQuery = useReportExecution('INV_DIP', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tanks' | 'dips' | 'movement'>('overview');
  const [search, setSearch] = useState('');

  const tankRows: Record<string, any>[] = tanksQuery.result?.register?.rows || [];
  const dipRows: Record<string, any>[] = dipsQuery.result?.register?.rows || [];

  const totalStockOnHand = useMemo(() => {
    return tankRows.reduce((sum, r) => sum + (Number(r.currentStock) || 0), 0);
  }, [tankRows]);

  const totalCapacity = useMemo(() => {
    return tankRows.reduce((sum, r) => sum + (Number(r.capacity) || 25000), 0);
  }, [tankRows]);

  const fillPercentage = useMemo(() => {
    if (totalCapacity === 0) return 0;
    return Math.min(100, (totalStockOnHand / totalCapacity) * 100);
  }, [totalStockOnHand, totalCapacity]);

  const filteredTankRows = useMemo(() => {
    if (!search.trim()) return tankRows;
    const q = search.toLowerCase();
    return tankRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [tankRows, search]);

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── WORKSPACE HEADER & SUB-NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center text-xl font-bold">
              🛢️
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? 'Inventory & Tank Stock Workspace' : 'انوینٹری و ٹینک اسٹاک ورک اسپیس'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  {isEn ? 'Live Sensor Stream' : 'لائیو سینسر ڈیپ اسٹریم'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn ? `${tankRows.length} Physical Fuel Tanks` : `${tankRows.length} رجسٹرڈ ٹینکس`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectReport?.('INV_DIP')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>📏</span>
              <span>{isEn ? '+ Record Dip Reading' : '+ ڈیپ اندراج'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'overview', label: 'Overview', labelUr: 'جائزہ' },
            { id: 'tanks', label: 'Tank Register', labelUr: 'ٹینک رجسٹر' },
            { id: 'dips', label: 'Dip Readings', labelUr: 'ڈیپ ریڈنگز' },
            { id: 'movement', label: 'Stock Movement', labelUr: 'اسٹاک منتقلی' },
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

      {/* ── LIVE INVENTORY KPIS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-amber-900">{isEn ? 'Stock On Hand' : 'موجودہ کل اسٹاک'}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">LIVE</span>
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">{formatLiters(totalStockOnHand)}</div>
          <div className="text-[10px] font-extrabold text-amber-700 mt-2">{isEn ? 'Sum of tank volumes' : 'تمام ٹینکس کا مجموعہ'}</div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-emerald-900">{isEn ? 'Avg Tank Fill %' : 'اوسط بھرائی گنجائش'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">{fillPercentage.toFixed(1)}%</span>
          </div>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">{fillPercentage.toFixed(1)}% Fill</div>
          <div className="text-[10px] font-extrabold text-emerald-700 mt-2">{isEn ? 'Total capacity ratio' : 'گنجائش کا تناسب'}</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-blue-900">{isEn ? 'Dip Readings Logged' : 'ڈیپ ریڈنگ لاگ'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">{dipRows.length} Dips</span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{dipRows.length} Readings</div>
          <div className="text-[10px] font-extrabold text-blue-700 mt-2">{isEn ? 'Manual & ATG sensor dips' : 'سینسر ڈیپ ریڈنگز'}</div>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black text-purple-900">{isEn ? 'Total Capacity' : 'کل اسٹوریج گنجائش'}</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">ATG</span>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">{formatLiters(totalCapacity)}</div>
          <div className="text-[10px] font-extrabold text-purple-700 mt-2">{isEn ? 'Station storage limit' : 'اسٹیشن گنجائش'}</div>
        </div>
      </div>

      {/* ── VISUAL TANK GAUGES ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? '🛢️ Fuel Tank Visual Levels & Dip Sensors' : '🛢️ فیول ٹینک لائیو گنجائش گیجز'}
          </h2>
          <span className="text-xs font-extrabold text-amber-700">● Realtime Dip Log</span>
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
            {isEn ? 'No fuel tanks registered in Firestore.' : 'کوئی فیول ٹینک رجسٹرڈ نہیں ہے۔'}
          </div>
        )}
      </div>

      {/* ── REGISTER TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? '📋 Tank Stock Register' : '📋 ٹینک اسٹاک رجسٹر'}
          </h2>

          <input
            type="text"
            placeholder={isEn ? '🔍 Search tank, product...' : '🔍 ٹینک یا پروڈکٹ تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[200px]"
          />
        </div>

        {filteredTankRows.length > 0 ? (
          <EnterpriseRegisterTable
            columns={[
              { id: 'name', header: 'Tank Name', headerUr: 'ٹینک کا نام', accessor: 'name', sortable: true },
              { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
              { id: 'capacity', header: 'Capacity (L)', headerUr: 'گنجائش', accessor: 'capacity', isNumeric: true },
              { id: 'currentStock', header: 'Current Stock (L)', headerUr: 'موجودہ اسٹاک', accessor: 'currentStock', isNumeric: true },
            ]}
            data={filteredTankRows}
            language={lang}
            onRowClick={(row) => setSelectedRecord(row)}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center shadow-xs my-4">
            <div className="text-4xl mb-3 opacity-60">🛢️</div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              {isEn ? 'No Tank Dip Records Found' : 'کوئی ڈیپ ریڈنگز نہیں ملیں'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6 max-w-md mx-auto">
              {isEn ? 'Record daily tank dips to track stock movements and variance.' : 'ڈیپ ریڈنگ کا اندراج شروع کریں۔'}
            </p>
            <button
              onClick={() => onSelectReport?.('INV_DIP')}
              className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
            >
              📏 {isEn ? 'Record Dip Reading' : 'ڈیپ ریڈنگ کا اندراج کریں'}
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
