/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ShiftOverviewTab — Executive Shift Control Room Dashboard
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React, { useMemo } from 'react';
import {
  TrendingUp, ChevronRight
} from 'lucide-react';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function formatLiters(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `${n.toLocaleString('en-PK', { maximumFractionDigits: 2 })} L`;
}

// Static Tailwind class map for product color chips/bars (module scope — dynamic
// `bg-${color}-500` strings never compile under Tailwind JIT, leaving dots/bars invisible).
const PRODUCT_COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  rose: 'bg-rose-500',
};
const colorClassFor = (color: string) => PRODUCT_COLOR_CLASSES[color] || 'bg-slate-400';

interface ShiftOverviewTabProps {
  salesRows: Record<string, any>[];
  totalRevenue: number;
  totalLiters: number;
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectReport?: (reportId: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const ShiftOverviewTab: React.FC<ShiftOverviewTabProps> = ({
  salesRows,
  totalRevenue,
  totalLiters,
  lang,
  orgId,
  stationId,
  onSelectReport,
  onNavigateTab,
}) => {
  const isEn = lang === 'en';

  // Fetch live nozzle readings and shift data from Firebase
  const { data: nozzleReadings } = useWorkspaceFirebaseData('NOZZLE_READINGS', { orgId, stationId });
  const { data: shiftData } = useWorkspaceFirebaseData('SHIFTS', { orgId, stationId });
  const { data: pumpReadings } = useWorkspaceFirebaseData('PUMP_READINGS', { orgId, stationId });

  // Build nozzle status from live data
  const nozzleStatusList = useMemo(() => {
    if (nozzleReadings.length > 0) {
      return nozzleReadings.map(n => ({
        id: n._id || n.nozzleId || n.id,
        name: n.name || n.nozzleName || `Nozzle ${n.nozzleId || n._id}`,
        status: n.status || 'IDLE',
        product: n.product || n.productName || n.fuelType || '—',
        currentSale: n.currentSale ? `${n.currentSale} L` : '0.00 L',
        lastTxn: n.lastTxn || n.lastTransaction || '—',
      }));
    }
    // If no nozzle readings, try pump readings
    return pumpReadings.map(p => ({
      id: p._id || p.pumpId || p.id,
      name: p.name || p.pumpName || `Pump ${p.pumpId || p._id}`,
      status: p.status || 'IDLE',
      product: p.product || p.productName || '—',
      currentSale: p.currentSale ? `${p.currentSale} L` : '0.00 L',
      lastTxn: p.lastTxn || p.lastTransaction || '—',
    }));
  }, [nozzleReadings, pumpReadings]);

  // Build top operators from live sales data
  const topOperators = useMemo(() => {
    if (salesRows.length === 0) return [];

    const grouped: Record<string, { txns: number; liters: number; totalSale: number }> = {};
    salesRows.forEach(row => {
      const name = row.operatorName || row.staffName || row.createdBy || 'Unknown';
      if (!grouped[name]) grouped[name] = { txns: 0, liters: 0, totalSale: 0 };
      grouped[name].txns += 1;
      grouped[name].liters += Number(row.quantity || row.liters) || 0;
      grouped[name].totalSale += Number(row.totalAmount || row.amount) || 0;
    });

    return Object.entries(grouped)
      .map(([name, g]) => ({
        name,
        txns: g.txns,
        liters: formatLiters(g.liters),
        avgSale: g.txns > 0 ? formatCurrency(Math.round(g.totalSale / g.txns)) : '—',
      }))
      .sort((a, b) => b.txns - a.txns)
      .slice(0, 5);
  }, [salesRows]);

  // Active shift from live data
  const activeShift = useMemo(() => {
    return shiftData.find(s => s.status === 'OPEN' || s.status === 'ACTIVE' || s.shiftStatus === 'OPEN');
  }, [shiftData]);

  // Product-wise breakdown from live sales
  const productBreakdown = useMemo(() => {
    if (salesRows.length === 0) return [];
    const grouped: Record<string, number> = {};
    salesRows.forEach(row => {
      const product = row.productName || row.product || row.fuelType || 'Unknown';
      grouped[product] = (grouped[product] || 0) + (Number(row.quantity || row.liters) || 0);
    });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    const colors = ['blue', 'emerald', 'amber', 'purple', 'rose'];
    return Object.entries(grouped)
      .map(([name, liters], idx) => ({
        name,
        liters,
        percentage: total > 0 ? ((liters / total) * 100).toFixed(1) : '0',
        // Static key → the resolved class is looked up below (dynamic `bg-${color}-500`
        // never compiles under Tailwind JIT, leaving dots/bars invisible).
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.liters - a.liters);
  }, [salesRows]);

  // Active nozzle count
  const activeNozzleCount = nozzleStatusList.filter(n => n.status === 'IN_USE' || n.status === 'ACTIVE').length;
  const totalNozzleCount = nozzleStatusList.length;

  // Transaction count
  const txnCount = salesRows.length;

  // Shift progress
  const shiftProgress = useMemo(() => {
    if (!activeShift) return 0;
    const start = new Date(activeShift.startTime || activeShift.openedAt || activeShift.createdAt).getTime();
    const end = new Date(activeShift.endTime || activeShift.expectedClose || start + 8 * 60 * 60 * 1000).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [activeShift]);

  return (
    <div className="space-y-4">
      {/* Top 5 KPI Cards — computed from live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Today's Shift Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">💰</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalRevenue)}</div>
            <div className="text-[11px] font-extrabold text-slate-400 mt-1 flex items-center gap-1">
              <span>From live database</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Today's Liters Dispensed</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">⛽</div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-900 tracking-tight">{formatLiters(totalLiters)}</div>
            <div className="text-[11px] font-extrabold text-slate-400 mt-1 flex items-center gap-1">
              <span>From live database</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-900">Active Shift</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">👥</div>
          </div>
          <div>
            <div className="text-xl font-black text-amber-900 tracking-tight">{activeShift?.name || activeShift?.shiftName || 'No Active Shift'}</div>
            <span className="text-[11px] font-extrabold text-amber-700 mt-1 block">{activeShift?.startTime || '—'} – {activeShift?.endTime || '—'}</span>
          </div>
        </div>

        <div className="bg-purple-50/60 rounded-2xl border border-purple-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-purple-900">Active Nozzles</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">⛽</div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-900 tracking-tight">{activeNozzleCount} / {totalNozzleCount || '—'}</div>
            <span className="text-[11px] font-extrabold text-purple-700 mt-1 block">{totalNozzleCount > 0 ? 'Nozzles in use' : 'No nozzle data'}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">📄</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{txnCount}</div>
            <div className="text-[11px] font-extrabold text-slate-400 mt-1 flex items-center gap-1">
              <span>From live database</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Live Nozzles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">LIVE NOZZLE STATUS</h3>
              <button onClick={() => onNavigateTab?.('nozzles')} className="text-[11px] font-extrabold text-primary hover:underline cursor-pointer">View All</button>
            </div>

            {nozzleStatusList.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">No nozzle data available. Nozzle readings will appear once recorded.</p>
            ) : (
              <div className="overflow-x-auto text-xs font-bold">
                <table className="w-full text-left">
                  <thead className="text-[10px] text-slate-400 uppercase font-black border-b border-slate-100">
                    <tr>
                      <th className="py-1">Nozzle</th>
                      <th className="py-1">Status</th>
                      <th className="py-1">Product</th>
                      <th className="py-1">Liters</th>
                      <th className="py-1">Last Txn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {nozzleStatusList.slice(0, 5).map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50">
                        <td className="py-2 font-extrabold">{n.name}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            n.status === 'IN_USE' || n.status === 'ACTIVE'
                              ? 'bg-primary/10 text-primary'
                              : n.status === 'IDLE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {n.status === 'IN_USE' || n.status === 'ACTIVE' ? '● IN USE' : n.status === 'IDLE' ? '◆ IDLE' : 'OFFLINE'}
                          </span>
                        </td>
                        <td className="py-2">{n.product}</td>
                        <td className="py-2 font-black">{n.currentSale}</td>
                        <td className="py-2 text-[10px] text-slate-500">{n.lastTxn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigateTab?.('nozzles')}
              className="text-xs font-black text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Nozzle Performance</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Column 2: Shift Progress Gauge — computed from live shift data */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">SHIFT PROGRESS</h3>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100 stroke-current" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-primary stroke-current" strokeDasharray={`${shiftProgress}, 100`} strokeWidth="3.5" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">{activeShift ? `${shiftProgress}%` : '—'}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-900">{activeShift?.name || activeShift?.shiftName || 'No Active Shift'}</h4>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block mt-1 ${
              activeShift ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
            }`}>
              {activeShift ? 'In Progress' : 'No Active Shift'}
            </span>
          </div>

          {activeShift && (
            <div className="w-full grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600 pt-2 border-t border-slate-100 text-left">
              <div>Started At: <span className="font-extrabold text-slate-900">{activeShift.startTime || activeShift.openedAt || '—'}</span></div>
              <div>Expected Close: <span className="font-extrabold text-slate-900">{activeShift.endTime || activeShift.expectedClose || '—'}</span></div>
            </div>
          )}
        </div>

        {/* Column 3: Product Summary — computed from live sales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">FUEL SALES SUMMARY (THIS SHIFT)</h3>
            <button onClick={() => onNavigateTab?.('products')} className="text-[11px] font-extrabold text-primary hover:underline cursor-pointer">View Details</button>
          </div>

          {productBreakdown.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 py-4 text-center">No sales data available. Product breakdown will populate from live transactions.</p>
          ) : (
            <div className="space-y-3.5">
              {productBreakdown.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorClassFor(p.color)}`} />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="font-black text-slate-900 shrink-0">
                      {formatLiters(p.liters)} <span className="text-slate-400 text-[11px] font-semibold">({p.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`${colorClassFor(p.color)} h-full rounded-full`} style={{ width: `${p.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
