/**
 * Enterprise Owner Dashboard
 * Cross-business view — FuelPro + LubeManager combined.
 * Accessible ONLY to Owner / SuperAdmin.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  Fuel, Wrench, TrendingUp, DollarSign, Users, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ArrowRight, Building2,
  Activity, ShieldCheck, BarChart3, Coins, Receipt,
  ChevronRight, Clock, CheckCircle2, XCircle, Sparkles,
  Package, CreditCard
} from 'lucide-react';
import RoleGuard from '../../ui/RoleGuard';
import { useStation } from '../../../contexts/StationContext';
import { db } from '../../../data/db';
import { generateKPIs } from '../../../services/analytics/kpiEngine';
import { useSupplierStore } from '../../../stores/useSupplierStore';
import { DEFAULT_FUEL_STATION_ID, LUBE_STATION_ID } from '../../../lib/businessScope';
import { formatCurrency } from '../../../lib/currency';
import { PoweredByUmarAli } from '../../shared/PoweredByUmarAli';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function pct(value: number, total: number): string {
  if (!total) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function changeIcon(change: number) {
  if (change > 0) return <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
  if (change < 0) return <ArrowDownRight className="w-3 h-3 text-red-500" />;
  return null;
}

function changeClass(change: number): string {
  if (change > 0) return 'text-emerald-500';
  if (change < 0) return 'text-red-500';
  return 'text-slate-400';
}

// KPI Card
function KPICard({
  label, value, sub, icon: Icon, iconBg, iconColor, change
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  change?: number;
}) {
  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${change >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
            {changeIcon(change)}
            <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-0.5">{value}</h3>
      {sub && <p className="text-xs font-semibold text-slate-400">{sub}</p>}
    </div>
  );
}

// Business Card (Fuel / Lube)
function BusinessCard({
  name, color, icon: Icon, todayRevenue, totalRevenue, profit, creditOutstanding,
  staffCount, activeShift, onNavigate, businessId
}: {
  name: string; color: string; icon: React.ElementType;
  todayRevenue: number; totalRevenue: number; profit: number;
  creditOutstanding: number; staffCount: number; activeShift: boolean;
  onNavigate: (view: string, stationId: string) => void;
  businessId: string;
}) {
  const isFuel = businessId === DEFAULT_FUEL_STATION_ID;
  return (
    <div className={`rounded-[24px] p-6 shadow-lg border overflow-hidden relative ${
      isFuel
        ? 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400/30'
        : 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/30'
    }`}>
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">{name}</h3>
            <div className={`flex items-center gap-1.5 mt-0.5`}>
              <div className={`w-1.5 h-1.5 rounded-full ${activeShift ? 'bg-emerald-300 animate-pulse' : 'bg-white/30'}`} />
              <span className="text-[10px] font-bold text-white/70">
                {activeShift ? 'Shift Active' : 'No Active Shift'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Today's Sales</p>
            <p className="text-lg font-black text-white">
              {todayRevenue > 0 ? `PKR ${(todayRevenue / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-lg font-black text-white">
              {totalRevenue > 0 ? `PKR ${(totalRevenue / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Gross Profit</p>
            <p className="text-lg font-black text-white">
              {profit > 0 ? `PKR ${(profit / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Udhar Due</p>
            <p className={`text-lg font-black ${creditOutstanding > 0 ? 'text-yellow-300' : 'text-white'}`}>
              {creditOutstanding > 0 ? `PKR ${(creditOutstanding / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('dashboard', businessId)}
          className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-bold py-2.5 rounded-xl transition-all"
        >
          Open Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
interface EnterpriseDashboardProps {
  onNavigate?: (view: string, stationId?: string) => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ onNavigate }) => {
  const { settings, activeStationId } = useStation();

  // ─── Load BOTH businesses' data directly from the DB ───
  const [fuelData, setFuelData] = useState<{
    shifts: any[]; products: any[]; customers: any[]; tanks: any[];
    expenses: any[]; nozzles: any[]; rateHistory: any[];
  }>({ shifts: [], products: [], customers: [], tanks: [], expenses: [], nozzles: [], rateHistory: [] });

  const [lubeData, setLubeData] = useState<{
    products: any[]; customers: any[]; lubePosSales: any[];
    expenses: any[];
  }>({ products: [], customers: [], lubePosSales: [], expenses: [] });

  const suppliers = useSupplierStore(state => state.suppliers);

  useEffect(() => {
    // Fuel Station (st_default) — full cross-business read
    const fuelShifts = db.getShifts(DEFAULT_FUEL_STATION_ID);
    const fuelProducts = db.getProducts(DEFAULT_FUEL_STATION_ID);
    const fuelCustomers = db.getCustomers(DEFAULT_FUEL_STATION_ID);
    const fuelTanks = db.getTanks(DEFAULT_FUEL_STATION_ID);
    const fuelExpenses = db.getStandaloneExpenses(DEFAULT_FUEL_STATION_ID);
    const fuelNozzles = db.getNozzles(DEFAULT_FUEL_STATION_ID);
    const fuelRateHistory = db.getRateHistory(DEFAULT_FUEL_STATION_ID);

    setFuelData({
      shifts: fuelShifts,
      products: fuelProducts,
      customers: fuelCustomers,
      tanks: fuelTanks,
      expenses: fuelExpenses,
      nozzles: fuelNozzles,
      rateHistory: fuelRateHistory
    });

    // Lube Shop (st_lube)
    const lubeProducts = db.getProducts(LUBE_STATION_ID);
    const lubeCustomers = db.getCustomers(LUBE_STATION_ID);
    const lubeSales = db.getLubePosSales(LUBE_STATION_ID);
    const lubeExpenses = db.getStandaloneExpenses(LUBE_STATION_ID);

    setLubeData({
      products: lubeProducts,
      customers: lubeCustomers,
      lubePosSales: lubeSales,
      expenses: lubeExpenses
    });
  }, []);

  // ─── KPIs ───
  const fuelKPIs = useMemo(() => generateKPIs(
    fuelData.shifts, fuelData.products, fuelData.customers,
    fuelData.tanks, fuelData.expenses, [],
    DEFAULT_FUEL_STATION_ID, fuelData.nozzles, fuelData.rateHistory
  ), [fuelData]);

  const lubeKPIs = useMemo(() => generateKPIs(
    [], lubeData.products, lubeData.customers,
    [], lubeData.expenses, lubeData.lubePosSales,
    LUBE_STATION_ID, [], []
  ), [lubeData]);

  // ─── Combined KPIs ───
  const combined = useMemo(() => ({
    todayRevenue: fuelKPIs.revenue.today + lubeKPIs.revenue.today,
    totalRevenue: fuelKPIs.revenue.ytd + lubeKPIs.revenue.ytd,
    totalProfit: fuelKPIs.profit.gross + lubeKPIs.profit.gross,
    totalExpenses: fuelKPIs.expenses.total + lubeKPIs.expenses.total,
    totalCreditOut: fuelKPIs.credit.outstanding + lubeKPIs.credit.outstanding,
    totalPayables: suppliers.reduce((s, sup) => s + (sup.balance > 0 ? sup.balance : 0), 0),
    inventoryValue: fuelKPIs.inventory.value + lubeKPIs.inventory.value,
    cashPosition: fuelKPIs.cash.position + lubeKPIs.cash.position,
    totalStaff: [...fuelData.products].length + [...lubeData.products].length, // proxy count
  }), [fuelKPIs, lubeKPIs, suppliers, fuelData, lubeData]);

  // ─── Revenue Split (Pie) ───
  const revenueSplit = useMemo(() => {
    const total = combined.totalRevenue;
    if (!total) return [];
    return [
      { name: 'Fuel Station', value: fuelKPIs.revenue.ytd, color: '#F97316' },
      { name: 'Lube Business', value: lubeKPIs.revenue.ytd, color: '#3B82F6' }
    ];
  }, [fuelKPIs, lubeKPIs, combined.totalRevenue]);

  // ─── Last 7 Days Revenue Trend (Both Businesses) ───
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(dateStr => {
      const displayDate = new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      // Fuel revenue for this day
      const fuelRev = fuelData.shifts
        .filter(s => s.date === dateStr)
        .reduce((sum, sh) => {
          let r = 0;
          sh.segments?.forEach((seg: any) => { r += seg.revenue; });
          if (!sh.segments || sh.segments.length === 0) {
            fuelData.nozzles.forEach((nz: any) => {
              const open = sh.openingReadings?.[nz.id] || 0;
              const close = sh.closingReadings?.[nz.id] || 0;
              const diff = Math.max(0, close - open);
              const prod = fuelData.products.find((p: any) => p.id === nz.productId);
              r += diff * (prod?.rate || 0);
            });
          }
          return sum + r;
        }, 0);

      // Lube revenue for this day
      const lubeRev = lubeData.lubePosSales
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + s.total, 0);

      return { date: displayDate, fuel: fuelRev, lube: lubeRev, total: fuelRev + lubeRev };
    });
  }, [fuelData, lubeData]);

  // ─── Alerts ───
  const alerts = useMemo(() => {
    const list: Array<{ id: string; type: 'warn' | 'danger' | 'ok'; message: string }> = [];

    // Fuel: active shift check
    const activeFuelShift = fuelData.shifts.find(s => s.status === 'active');
    if (!activeFuelShift) list.push({ id: 'no_fuel_shift', type: 'warn', message: 'No active shift at Fuel Station' });

    // Low stock in fuel products
    fuelData.products.filter((p: any) => p.currentStock <= p.minStock && p.currentStock > 0)
      .forEach((p: any) => list.push({ id: `fuel_low_${p.id}`, type: 'warn', message: `Low fuel stock: ${p.name} (${p.currentStock}L)` }));

    // High udhar customers
    fuelData.customers.filter((c: any) => c.balance > (c.creditLimit || 50000))
      .slice(0, 2)
      .forEach((c: any) => list.push({ id: `credit_${c.id}`, type: 'danger', message: `Credit limit exceeded: ${c.name} (PKR ${c.balance?.toLocaleString()})` }));

    lubeData.customers.filter((c: any) => c.balance > (c.creditLimit || 50000))
      .slice(0, 2)
      .forEach((c: any) => list.push({ id: `lube_credit_${c.id}`, type: 'danger', message: `[Lube] Credit limit exceeded: ${c.name}` }));

    if (list.length === 0) list.push({ id: 'all_ok', type: 'ok', message: 'All systems healthy — no alerts!' });

    return list;
  }, [fuelData, lubeData]);

  // ─── Fuel active shift ───
  const activeFuelShift = useMemo(() => fuelData.shifts.find(s => s.status === 'active'), [fuelData.shifts]);

  const fmt = (n: number) => n >= 1000000
    ? `PKR ${(n / 1000000).toFixed(2)}M`
    : n >= 1000 ? `PKR ${(n / 1000).toFixed(1)}K`
    : `PKR ${n.toFixed(0)}`;

  const handleNav = (view: string, stationId?: string) => {
    if (onNavigate) onNavigate(view, stationId);
  };

  return (
    <RoleGuard allowedRoles={['Owner', 'Manager']} fallbackMessage="Enterprise Dashboard is restricted to Owner / Manager only.">
      <div className="w-full flex flex-col pb-12 gap-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Enterprise Overview</h1>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Consolidated view — FuelPro + LubeManager Pro</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-2 rounded-xl border border-violet-500/20 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Owner View — Restricted Access
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ── COMBINED KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Today's Revenue" value={fmt(combined.todayRevenue)}
            sub="Both businesses"
            icon={DollarSign} iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
          />
          <KPICard
            label="Total Revenue (YTD)" value={fmt(combined.totalRevenue)}
            sub="Lifetime accumulated"
            icon={TrendingUp} iconBg="bg-orange-500/10" iconColor="text-orange-500"
          />
          <KPICard
            label="Gross Profit" value={fmt(combined.totalProfit)}
            sub="Revenue minus COGS"
            icon={BarChart3} iconBg="bg-blue-500/10" iconColor="text-blue-500"
          />
          <KPICard
            label="Udhar Outstanding" value={fmt(combined.totalCreditOut)}
            sub={`Payables: ${fmt(combined.totalPayables)}`}
            icon={CreditCard} iconBg="bg-red-500/10" iconColor="text-red-500"
          />
          <KPICard
            label="Inventory Value" value={fmt(combined.inventoryValue)}
            sub="Book value at cost"
            icon={Package} iconBg="bg-purple-500/10" iconColor="text-purple-500"
          />
          <KPICard
            label="Total Expenses" value={fmt(combined.totalExpenses)}
            sub="Operational expenses"
            icon={Receipt} iconBg="bg-amber-500/10" iconColor="text-amber-500"
          />
          <KPICard
            label="Cash Position" value={fmt(combined.cashPosition)}
            sub="Cash received minus costs"
            icon={Coins} iconBg="bg-teal-500/10" iconColor="text-teal-500"
          />
          <KPICard
            label="Supplier Payables" value={fmt(combined.totalPayables)}
            sub="Outstanding to suppliers"
            icon={Fuel} iconBg="bg-indigo-500/10" iconColor="text-indigo-500"
          />
        </div>

        {/* ── TWO BUSINESS CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BusinessCard
            name="Motorway Petroleum — Fuel Station"
            color="orange"
            icon={Fuel}
            todayRevenue={fuelKPIs.revenue.today}
            totalRevenue={fuelKPIs.revenue.ytd}
            profit={fuelKPIs.profit.gross}
            creditOutstanding={fuelKPIs.credit.outstanding}
            staffCount={0}
            activeShift={!!activeFuelShift}
            businessId={DEFAULT_FUEL_STATION_ID}
            onNavigate={(view, sid) => handleNav(view, sid)}
          />
          <BusinessCard
            name="Motorway Oil Bakhshali — Lube Shop"
            color="blue"
            icon={Wrench}
            todayRevenue={lubeKPIs.revenue.today}
            totalRevenue={lubeKPIs.revenue.ytd}
            profit={lubeKPIs.profit.gross}
            creditOutstanding={lubeKPIs.credit.outstanding}
            staffCount={0}
            activeShift={false}
            businessId={LUBE_STATION_ID}
            onNavigate={(view, sid) => handleNav(view, sid)}
          />
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Revenue Trend (7 days) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              7-Day Revenue Trend — Both Businesses
            </h3>
            <div className="h-[220px]">
              {trendData.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="lubeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(val: number, name: string) => [`PKR ${val.toLocaleString()}`, name === 'fuel' ? 'Fuel Station' : 'Lube Business']}
                    />
                    <Area type="monotone" dataKey="fuel" stroke="#F97316" strokeWidth={2.5} fill="url(#fuelGrad)" name="fuel" />
                    <Area type="monotone" dataKey="lube" stroke="#3B82F6" strokeWidth={2.5} fill="url(#lubeGrad)" name="lube" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-semibold">No revenue data in last 7 days</p>
                  <p className="text-xs mt-1 opacity-70">Close a shift or make a sale to see trends</p>
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold text-slate-500">Fuel Station</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-slate-500">Lube Business</span>
              </div>
            </div>
          </div>

          {/* Revenue Split Pie */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Revenue Contribution
            </h3>
            {revenueSplit.length > 0 && combined.totalRevenue > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={revenueSplit} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {revenueSplit.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`PKR ${val.toLocaleString()}`, '']}
                        contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '10px', border: 'none', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {revenueSplit.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {pct(item.value, combined.totalRevenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-semibold">No revenue recorded yet</p>
              </div>
            )}
          </div>

        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* System Alerts */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Enterprise Alerts
              {alerts.filter(a => a.type !== 'ok').length > 0 && (
                <span className="ml-auto bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {alerts.filter(a => a.type !== 'ok').length} Issues
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                  alert.type === 'ok'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : alert.type === 'danger'
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}>
                  {alert.type === 'ok'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    : alert.type === 'danger'
                    ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  }
                  <p className={`text-xs font-semibold ${
                    alert.type === 'ok' ? 'text-emerald-700 dark:text-emerald-400'
                    : alert.type === 'danger' ? 'text-red-700 dark:text-red-400'
                    : 'text-amber-700 dark:text-amber-400'
                  }`}>{alert.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Owner Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Fuel Reports', view: 'reports', stationId: DEFAULT_FUEL_STATION_ID, icon: BarChart3, color: 'text-orange-500 bg-orange-500/10' },
                { label: 'Lube POS Sales', view: 'reports', stationId: LUBE_STATION_ID, icon: Receipt, color: 'text-blue-500 bg-blue-500/10' },
                { label: 'Executive KPIs', view: 'executive_dashboard', stationId: undefined, icon: TrendingUp, color: 'text-violet-500 bg-violet-500/10' },
                { label: 'Risk Center', view: 'risk_center', stationId: undefined, icon: ShieldCheck, color: 'text-red-500 bg-red-500/10' },
                { label: 'Fuel Customers', view: 'customers', stationId: DEFAULT_FUEL_STATION_ID, icon: Users, color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Audit Center', view: 'audit_center', stationId: undefined, icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-500/10' },
              ].map(item => (
                <button
                  key={`${item.view}_${item.stationId}`}
                  onClick={() => handleNav(item.view, item.stationId)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color.split(' ')[1]}`}>
                    <item.icon className={`w-4 h-4 ${item.color.split(' ')[0]}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-center pt-4">
          <PoweredByUmarAli variant="dashboard" />
        </div>
      </div>
    </RoleGuard>
  );
};

export default EnterpriseDashboard;
