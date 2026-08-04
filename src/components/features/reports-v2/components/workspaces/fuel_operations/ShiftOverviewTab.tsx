/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ShiftOverviewTab — Executive Shift Control Room Dashboard
 *
 * Implements Enterprise Rule #137 & Rule #144
 */

import React, { useMemo } from 'react';
import {
  TrendingUp, Clock, ChevronRight, FileText, Fuel, Users, DollarSign, Printer, Download
} from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function formatLiters(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `${n.toLocaleString('en-PK', { maximumFractionDigits: 2 })} L`;
}

interface ShiftOverviewTabProps {
  salesRows: Record<string, any>[];
  totalRevenue: number;
  totalLiters: number;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const ShiftOverviewTab: React.FC<ShiftOverviewTabProps> = ({
  salesRows,
  totalRevenue,
  totalLiters,
  lang,
  onSelectReport,
  onNavigateTab,
}) => {
  const isEn = lang === 'en';

  const nozzleStatusList = [
    { id: '01', name: 'Nozzle 01', status: 'IN_USE', product: 'Petrol', currentSale: '12.45 L', lastTxn: '11:24:31 AM' },
    { id: '02', name: 'Nozzle 02', status: 'IN_USE', product: 'Diesel', currentSale: '18.22 L', lastTxn: '11:24:15 AM' },
    { id: '03', name: 'Nozzle 03', status: 'IDLE', product: '—', currentSale: '0.00 L', lastTxn: '11:20:05 AM' },
    { id: '04', name: 'Nozzle 04', status: 'IN_USE', product: 'Petrol', currentSale: '8.10 L', lastTxn: '11:24:28 AM' },
    { id: '05', name: 'Nozzle 05', status: 'OFFLINE', product: '—', currentSale: '0.00 L', lastTxn: '—' },
  ];

  const topOperators = [
    { name: 'Ali Raza', txns: 156, liters: '2,125.40 L', avgSale: 'Rs 3,654' },
    { name: 'Umer Farooq', txns: 112, liters: '1,450.80 L', avgSale: 'Rs 3,210' },
    { name: 'Bilal Ahmed', txns: 68, liters: '890.10 L', avgSale: 'Rs 2,890' },
    { name: 'Zeeshan Khan', txns: 20, liters: '284.95 L', avgSale: 'Rs 2,125' },
  ];

  return (
    <div className="space-y-4">
      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Today's Shift Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">💰</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalRevenue)}</div>
            <div className="text-[11px] font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
              <span>vs Yesterday: +12.5%</span>
              <TrendingUp size={13} />
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
            <div className="text-[11px] font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
              <span>vs Yesterday: +8.2%</span>
              <TrendingUp size={13} />
            </div>
          </div>
        </div>

        <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-900">Active Shift</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">👥</div>
          </div>
          <div>
            <div className="text-xl font-black text-amber-900 tracking-tight">Morning Shift</div>
            <span className="text-[11px] font-extrabold text-amber-700 mt-1 block">09:00 AM – 05:00 PM</span>
          </div>
        </div>

        <div className="bg-purple-50/60 rounded-2xl border border-purple-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-purple-900">Open Nozzles</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">⛽</div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-900 tracking-tight">6 / 10</div>
            <span className="text-[11px] font-extrabold text-purple-700 mt-1 block">Nozzles in use</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">📄</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">356</div>
            <div className="text-[11px] font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
              <span>vs Yesterday: +9.3%</span>
              <TrendingUp size={13} />
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
              <button onClick={() => onNavigateTab?.('nozzles')} className="text-[11px] font-extrabold text-emerald-700 hover:underline cursor-pointer">View All</button>
            </div>

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
                  {nozzleStatusList.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="py-2 font-extrabold">{n.name}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          n.status === 'IN_USE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : n.status === 'IDLE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {n.status === 'IN_USE' ? '● IN USE' : n.status === 'IDLE' ? '◆ IDLE' : 'OFFLINE'}
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
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigateTab?.('nozzles')}
              className="text-xs font-black text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Nozzle Performance</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Column 2: Shift Progress Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">SHIFT PROGRESS</h3>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100 stroke-current" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#0B5C3D] stroke-current" strokeDasharray="62, 100" strokeWidth="3.5" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">62%</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-900">Morning Shift</h4>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-block mt-1">In Progress</span>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600 pt-2 border-t border-slate-100 text-left">
            <div>Started At: <span className="font-extrabold text-slate-900">09:00 AM</span></div>
            <div>Running Time: <span className="font-extrabold text-slate-900">5h 24m</span></div>
            <div>Expected Close: <span className="font-extrabold text-slate-900">05:00 PM</span></div>
            <div>Remaining: <span className="font-extrabold text-slate-900">5h 35m</span></div>
          </div>
        </div>

        {/* Column 3: Product Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">FUEL SALES SUMMARY (THIS SHIFT)</h3>
            <button onClick={() => onNavigateTab?.('products')} className="text-[11px] font-extrabold text-emerald-700 hover:underline cursor-pointer">View Details</button>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Petrol</span>
                <span className="font-black text-slate-900">2,250.65 L <span className="text-slate-400 text-[11px] font-semibold">(47.4%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '47.4%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Diesel</span>
                <span className="font-black text-slate-900">2,150.30 L <span className="text-slate-400 text-[11px] font-semibold">(45.3%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45.3%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Kerosene</span>
                <span className="font-black text-slate-900">189.30 L <span className="text-slate-400 text-[11px] font-semibold">(4.0%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '4.0%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Lubricants</span>
                <span className="font-black text-slate-900">160.00 L <span className="text-slate-400 text-[11px] font-semibold">(3.3%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '3.3%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
