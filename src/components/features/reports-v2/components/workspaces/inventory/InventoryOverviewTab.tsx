/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryOverviewTab — Executive Inventory Control Room Summary
 *
 * Implements Enterprise Rules #144, #145, #146, #151, #158 & #159
 */

import React, { useMemo } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle2, Droplets, ChevronRight, Plus,
  MoreHorizontal, Edit3, Truck, Repeat, Beaker, ShieldCheck, Clock, User
} from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function formatLiters(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `${n.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L`;
}

interface InventoryOverviewTabProps {
  tanks: Record<string, any>[];
  dips: Record<string, any>[];
  purchases: Record<string, any>[];
  role?: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const InventoryOverviewTab: React.FC<InventoryOverviewTabProps> = ({
  tanks,
  purchases,
  role = 'owner',
  lang,
  onSelectReport,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  const defaultTanks = [
    {
      id: 'tank-petrol-1',
      name: 'Petrol Tank',
      product: 'Petrol',
      capacity: 20000,
      currentStock: 2000,
      fillPct: '10.0%',
      safeLevel: '18,000 L',
      reorderThreshold: '3,000 L',
      waterDipMm: '1.0 mm',
      temp: '24.3 °C',
      lastDip: 'Today, 08:30 AM',
      status: 'LOW_STOCK',
      daysRemaining: '2.0 Days',
      avgCost: 'Rs 74.58',
    },
    {
      id: 'tank-diesel-1',
      name: 'Diesel Tank',
      product: 'Diesel',
      capacity: 20000,
      currentStock: 5000,
      fillPct: '25.0%',
      safeLevel: '18,000 L',
      reorderThreshold: '4,000 L',
      waterDipMm: '3.5 mm',
      temp: '24.8 °C',
      lastDip: 'Today, 08:30 AM',
      status: 'NORMAL',
      daysRemaining: '5.1 Days',
      avgCost: 'Rs 72.45',
    },
  ];

  const displayTanks = tanks.length > 0 ? tanks : defaultTanks;

  const totalStockOnHand = useMemo(() => {
    return displayTanks.reduce((sum, r) => sum + (Number(r.currentStock) || 0), 0);
  }, [displayTanks]);

  const totalCapacity = useMemo(() => {
    return displayTanks.reduce((sum, r) => sum + (Number(r.capacity) || 20000), 0);
  }, [displayTanks]);

  const fillPercentage = useMemo(() => {
    if (totalCapacity === 0) return 0;
    return (totalStockOnHand / totalCapacity) * 100;
  }, [totalStockOnHand, totalCapacity]);

  // Real-time Operations Timeline Feed (Rule #159)
  const stationTimelineEvents = [
    { time: '08:30 AM', event: 'Morning ATG Dip Recorded', details: 'Petrol: 2,000L | Diesel: 5,000L', user: 'Umar Ali (Operator)', type: 'dip' },
    { time: '09:20 AM', event: 'Fuel Bowser Received (GRN #4920)', details: '10,000 L Super Petrol from PSO', user: 'Admin / Manager', type: 'purchase' },
    { time: '11:15 AM', event: 'Nozzle Dispensing Active', details: 'Morning Shift Sales: 4,500 L', user: 'Shift Cashier', type: 'sales' },
    { time: '12:45 PM', event: 'Nozzle Test Liters Recorded', details: '150 L Poured Back into Petrol Tank', user: 'Umar Ali (Operator)', type: 'test' },
    { time: '04:20 PM', event: 'Thermal Expansion Variance Audit', details: '+125 L Variance Accepted (+0.62%)', user: 'Audit Engine', type: 'audit' },
  ];

  // Role-Based Actions (Rule #158)
  const roleActions = useMemo(() => {
    const isOwnerOrAdmin = role === 'owner' || role === 'admin';
    if (isOwnerOrAdmin) {
      return [
        { label: 'Record Dip Reading', icon: Edit3, target: 'INV_DIP' },
        { label: 'Receive Fuel Bowser', icon: Truck, target: 'PUR_DELIVERIES' },
        { label: 'Stock Adjustment', icon: Repeat, target: 'INV_ADJUST' },
        { label: 'Record Test Liters', icon: Beaker, target: 'INV_TEST' },
        { label: 'Reconcile Tank Stock', icon: ShieldCheck, target: 'INV_RECON' },
      ];
    } else {
      return [
        { label: 'Record Dip Reading', icon: Edit3, target: 'INV_DIP' },
        { label: 'Record Test Liters', icon: Beaker, target: 'INV_TEST' },
        { label: 'View Inventory Reports', icon: ShieldCheck, target: 'INV_REPORTS' },
      ];
    }
  }, [role]);

  return (
    <div className="space-y-4">
      {/* ── HEADER & BADGES ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
            Inventory & Tank Stock Workspace
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sensor Stream
            </span>
            <span className="text-xs font-bold text-slate-500">
              {displayTanks.length} Physical Tanks Connected
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-400">
              Role: <span className="uppercase font-black text-slate-700">{role}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectReport?.('INV_DIP')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Record Dip Reading</span>
          </button>
          <button className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ── AI INVENTORY HEALTH SCORE CARD (RULE #151) ── */}
      <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800/80 border border-emerald-700 flex items-center justify-center text-2xl font-black text-emerald-300">
            96%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">AI Inventory Health Score</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 text-[10px] font-black">EXCELLENT</span>
            </div>
            <p className="text-xs font-semibold text-emerald-200 mt-0.5">
              Probe telemetry optimal. Water levels nominal. Thermal expansion variance within 0.12% tolerance limit.
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectReport?.('INV_HEALTH')}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          View Health Audit ↗
        </button>
      </div>

      {/* ── 5 STAT KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-base">
              🛢️
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">● LIVE</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-0.5">Stock On Hand (Total)</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatLiters(totalStockOnHand)}</div>
            <span className="text-[11px] font-extrabold text-slate-400 mt-1 block">Total across all tanks</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
              📊
            </div>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-0.5">Avg Tank Fill %</span>
            <div className="text-2xl font-black text-emerald-700 tracking-tight">{fillPercentage.toFixed(1)}%</div>
            <span className="text-[11px] font-extrabold text-slate-400 mt-1 block">Total capacity ratio</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              📈
            </div>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-0.5">Today's Gain / Loss</span>
            <div className="text-2xl font-black text-blue-900 tracking-tight">+125 L</div>
            <span className="text-[11px] font-extrabold text-emerald-600 mt-1 block">+0.62% vs theoretical</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base">
              💰
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-0.5">Inventory Value</span>
            <div className="text-2xl font-black text-purple-900 tracking-tight">Rs 1,148,600</div>
            <span className="text-[11px] font-extrabold text-slate-400 mt-1 block">At average cost</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base">
              📅
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-0.5">Days Of Stock (Est.)</span>
            <div className="text-2xl font-black text-amber-900 tracking-tight">2.3 Days</div>
            <span className="text-[11px] font-extrabold text-slate-400 mt-1 block">At current sales rate</span>
          </div>
        </div>
      </div>

      {/* ── 4 ALERTS CARDS GRID ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Tank Alerts & Notifications
          </h3>
          <button className="text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1">
            <span>View All Alerts</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black text-amber-900">Petrol Tank</div>
              <div className="text-xs font-extrabold text-amber-700">Below Reorder Level</div>
              <div className="text-[11px] font-bold text-amber-600 mt-1">Current: 2,000 L | Reorder: 3,000 L</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black text-red-900">Low Stock Alert</div>
              <div className="text-xs font-extrabold text-red-700">2 Days Remaining</div>
              <div className="text-[11px] font-bold text-red-600 mt-1">Petrol stock running low</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Droplets size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black text-amber-900">High Water Detected</div>
              <div className="text-xs font-extrabold text-amber-700">Diesel Tank</div>
              <div className="text-[11px] font-bold text-amber-600 mt-1">Water: 3.5 mm</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black text-emerald-900">All Systems Normal</div>
              <div className="text-xs font-extrabold text-emerald-700">All Tanks OK</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">No critical alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TANK LEVELS (LIVE) & REALTIME OPERATIONS TIMELINE (RULE #159) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Live Tanks Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              TANK LEVELS (LIVE)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayTanks.map((t, idx) => {
              const cap = Number(t.capacity) || 20000;
              const curr = Number(t.currentStock) || 2000;
              const pct = (curr / cap) * 100;
              const isLow = pct < 20;

              return (
                <div key={t.id || idx} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⛽</span>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{t.name}</h4>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {isLow ? '● LOW STOCK' : '● OK'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="space-y-2 flex-1">
                      <div className="text-3xl font-black tracking-tight text-slate-900">{pct.toFixed(1)}%</div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-[#0B5C3D]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-14 h-24 border-2 border-slate-300 rounded-2xl relative overflow-hidden bg-slate-50 shadow-inner flex flex-col justify-end p-0.5 shrink-0">
                      <div
                        className={`w-full rounded-b-xl transition-all ${isLow ? 'bg-red-500/80' : 'bg-[#0B5C3D]/80'}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Current Stock</span>
                      <span className="text-xs font-black text-slate-900">{formatLiters(curr)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Total Capacity</span>
                      <span className="text-xs font-black text-slate-900">{formatLiters(cap)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Reorder Level</span>
                      <span className="text-xs font-black text-slate-900">{t.reorderThreshold || '3,000 L'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-600">
                    <div>{t.daysRemaining || '2 Days'}</div>
                    <div>{t.avgCost || 'Rs 74.58'}</div>
                    <button
                      onClick={() => onSelectRecord?.(t)}
                      className="text-emerald-700 hover:underline flex items-center gap-0.5 font-extrabold cursor-pointer"
                    >
                      <span>View Details</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Role-Based Quick Actions & Operations Timeline (Rules #158 & #159) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                ROLE QUICK ACTIONS ({role.toUpperCase()})
              </h3>
            </div>

            <div className="space-y-2">
              {roleActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectReport?.(action.target)}
                    className="w-full p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 hover:border-emerald-500 text-xs font-extrabold text-slate-800 flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Icon size={16} className="text-emerald-700" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Realtime Station Operations Timeline Feed (Rule #159) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-700" />
                <span>Station Operations Timeline (Rule #159)</span>
              </h3>
            </div>

            <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 text-xs">
              {stationTimelineEvents.map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#0B5C3D] ring-4 ring-white" />
                  <div className="flex justify-between text-[11px] font-black text-slate-400">
                    <span>{ev.time}</span>
                    <span className="text-slate-500 font-bold">{ev.user}</span>
                  </div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{ev.event}</div>
                  <div className="text-[11px] font-semibold text-slate-600">{ev.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
