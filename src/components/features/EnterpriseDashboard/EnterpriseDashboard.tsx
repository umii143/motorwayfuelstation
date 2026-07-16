/**
 * Enterprise Owner Dashboard
 * Cross-business view — FuelPro + LubeManager combined.
 * Accessible ONLY to Owner / SuperAdmin.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  Fuel, Wrench, TrendingUp, DollarSign, Users, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ArrowRight, Building2,
  Activity, ShieldCheck, BarChart3, Coins, Receipt,
  ChevronRight, Clock, CheckCircle2, XCircle, Sparkles,
  Package, CreditCard
} from 'lucide-react';
import RoleGuard from '../../ui/RoleGuard';
import { useStationStore } from '../../../stores/useStationStore';
import { db } from '../../../data/db';
import { generateKPIs } from '../../../services/analytics/kpiEngine';
import { useSupplierStore } from '../../../stores/useSupplierStore';
import { DEFAULT_FUEL_STATION_ID, LUBE_STATION_ID } from '../../../lib/businessScope';
import { PoweredByUmarAli } from '../../shared/PoweredByUmarAli';
import { DataConfidenceBadge } from '../../ui/DataConfidenceBadge';

// —————————————————————————————————————————————
// Helpers
// —————————————————————————————————————————————
function pct(value: number, total: number): string {
  if (!total) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function changeIcon(change: number) {
  if (change > 0) return <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
  if (change < 0) return <ArrowDownRight className="w-3 h-3 text-red-500" />;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function changeClass(change: number): string {
  if (change > 0) return 'text-emerald-500';
  if (change < 0) return 'text-red-500';
  return 'text-slate-400';
}

function KPICard({
  label, value, sub, icon: Icon, iconBg, iconColor, change
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  change?: number;
}) {
  const bgColorMap: Record<string, string> = {
    'text-emerald-500': 'bg-emerald-500/15 ring-emerald-500/20 text-emerald-500',
    'text-orange-500': 'bg-orange-500/15 ring-orange-500/20 text-orange-500',
    'text-blue-500': 'bg-blue-500/15 ring-blue-500/20 text-blue-500',
    'text-red-500': 'bg-red-500/15 ring-red-500/20 text-red-500',
    'text-purple-500': 'bg-purple-500/15 ring-purple-500/20 text-purple-500',
    'text-amber-500': 'bg-amber-500/15 ring-amber-500/20 text-amber-500',
    'text-teal-500': 'bg-teal-500/15 ring-teal-500/20 text-teal-500',
    'text-indigo-500': 'bg-indigo-500/15 ring-indigo-500/20 text-indigo-500',
  };
  const badgeClasses = bgColorMap[iconColor] || 'bg-slate-50 dark:bg-white/5 shadow-inner ring-slate-500/20 text-slate-500';

  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${change >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
            {changeIcon(change)}
            <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className={`absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset shadow-inner ${badgeClasses}`}>
        <Icon className="w-6 h-6" strokeWidth={2.5} />
      </div>
      <DataConfidenceBadge confidence={100} />
      <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{value}</h3>
      {sub && <p className="text-xs font-semibold text-slate-400">{sub}</p>}
    </div>
  );
}

// Business Card (Fuel / Lube)
function BusinessCard({
  name, color, icon: Icon, todayRevenue, totalRevenue, profit, creditOutstanding,
  activeShift, onNavigate, businessId, t
}: {
  name: string; color: string; icon: React.ElementType;
  todayRevenue: number; totalRevenue: number; profit: number;
  creditOutstanding: number; staffCount: number; activeShift: boolean;
  onNavigate: (view: string, stationId: string) => void;
  businessId: string;
  t: (en: string, ur: string) => string;
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
                {activeShift ? t('Shift Active', 'شفٹ فعال ہے') : t('No Active Shift', 'کوئی فعال شفٹ نہیں')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">{t("Today's Sales", 'آج کی فروخت')}</p>
            <p className="text-lg font-black text-white">
              {todayRevenue > 0 ? `PKR ${(todayRevenue / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">{t('Total Revenue', 'کل آمدنی')}</p>
            <p className="text-lg font-black text-white">
              {totalRevenue > 0 ? `PKR ${(totalRevenue / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">{t('Gross Profit', 'مجموعی منافع')}</p>
            <p className="text-lg font-black text-white">
              {profit > 0 ? `PKR ${(profit / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">{t('Udhar Due', 'بقایا ادھار')}</p>
            <p className={`text-lg font-black ${creditOutstanding > 0 ? 'text-yellow-300' : 'text-white'}`}>
              {creditOutstanding > 0 ? `PKR ${(creditOutstanding / 1000).toFixed(0)}K` : '—'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('dashboard', businessId)}
          className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-bold py-2.5 rounded-xl transition-all"
        >
          {t('Open Dashboard', 'ڈیش بورڈ کھولیں')} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————
// Main Component
// —————————————————————————————————————————————
interface EnterpriseDashboardProps {
  onNavigate?: (view: string, stationId?: string) => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ onNavigate }) => {
  const settings = useStationStore((state) => state.settings);
  const activeStationId = useStationStore((state) => state.activeStationId);

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // ——— Load BOTH businesses' data directly from the DB ———
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
  }, [activeStationId]);

  // Compute Fuel KPIs
  const fuelKPIs = useMemo(() => {
    return generateKPIs(
      fuelData.shifts, fuelData.products, fuelData.customers, fuelData.tanks,
      fuelData.expenses, [], DEFAULT_FUEL_STATION_ID, fuelData.nozzles, fuelData.rateHistory
    );
  }, [fuelData]);

  // Compute Lube KPIs
  const lubeKPIs = useMemo(() => {
    return generateKPIs(
      [], lubeData.products, lubeData.customers, [],
      lubeData.expenses, lubeData.lubePosSales, LUBE_STATION_ID, [], []
    );
  }, [lubeData]);

  // Combined metrics
  const combined = useMemo(() => {
    const todayRevenue = fuelKPIs.revenue.today + lubeKPIs.revenue.today;
    const totalRevenue = fuelKPIs.revenue.ytd + lubeKPIs.revenue.ytd;
    const totalProfit = fuelKPIs.profit.gross + lubeKPIs.profit.gross;
    const totalCreditOut = fuelKPIs.credit.outstanding + lubeKPIs.credit.outstanding;
    const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0);
    const inventoryValue = fuelKPIs.inventory.value + lubeKPIs.inventory.value;
    const totalExpenses = fuelKPIs.expenses.total + lubeKPIs.expenses.total;
    const cashPosition = fuelKPIs.cash.position + lubeKPIs.cash.position;

    return {
      todayRevenue,
      totalRevenue,
      totalProfit,
      totalCreditOut,
      totalPayables,
      inventoryValue,
      totalExpenses,
      cashPosition
    };
  }, [fuelKPIs, lubeKPIs, suppliers]);

  // Pie chart split
  const revenueSplit = useMemo(() => {
    if (combined.totalRevenue === 0) return [];
    return [
      { name: t('Fuel Station', 'فیول اسٹیشن'), value: fuelKPIs.revenue.ytd, color: '#F97316' },
      { name: t('Lube Business', 'لیوب بزنس'), value: lubeKPIs.revenue.ytd, color: '#3B82F6' }
    ];
  }, [fuelKPIs, lubeKPIs, combined.totalRevenue]);

  // Trend data for last 7 days (both businesses combined)
  const trendData = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      list.push(d);
    }

    return list.map(dateObj => {
      const dateStr = dateObj.toISOString().split('T')[0];
      const displayDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      // Fuel revenue for this day
      const fuelRev = fuelData.shifts
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => {
          let r = s.totalSales || 0;
          if (!r && s.closingReadings) {
            // fallback
            Object.keys(s.closingReadings).forEach(nzId => {
              const close = s.closingReadings[nzId] || 0;
              const open = s.openingReadings[nzId] || 0;
              const diff = Math.max(0, close - open);
              const nz = fuelData.nozzles.find((n: any) => n.id === nzId);
              const prod = fuelData.products.find((p: any) => p.id === nz?.productId);
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

  // ——— Alerts ———
  const alerts = useMemo(() => {
    const list: Array<{ id: string; type: 'warn' | 'danger' | 'ok'; message: string }> = [];

    // Fuel: active shift check
    const activeFuelShift = fuelData.shifts.find(s => s.status === 'active');
    if (!activeFuelShift) {
      list.push({ id: 'no_fuel_shift', type: 'warn', message: t('No active shift at Fuel Station', 'فیول اسٹیشن پر کوئی فعال شفٹ نہیں ہے') });
    }

    // Low stock in fuel products
    fuelData.products.filter((p: any) => p.currentStock <= p.minStock && p.currentStock > 0)
      .forEach((p: any) => {
        list.push({ id: `fuel_low_${p.id}`, type: 'warn', message: `${t('Low fuel stock:', 'کم فیول اسٹاک:')} ${p.name} (${p.currentStock}L)` });
      });

    // High udhar customers
    fuelData.customers.filter((c: any) => c.balance > (c.creditLimit || 50000))
      .slice(0, 2)
      .forEach((c: any) => {
        list.push({ id: `credit_${c.id}`, type: 'danger', message: `${t('Credit limit exceeded:', 'ادھار کی حد سے تجاوز:')} ${c.name} (PKR ${c.balance?.toLocaleString()})` });
      });

    lubeData.customers.filter((c: any) => c.balance > (c.creditLimit || 50000))
      .slice(0, 2)
      .forEach((c: any) => {
        list.push({ id: `lube_credit_${c.id}`, type: 'danger', message: `${t('[Lube] Credit limit exceeded:', '[لیوب] ادھار کی حد سے تجاوز:')} ${c.name}` });
      });

    if (list.length === 0) {
      list.push({ id: 'all_ok', type: 'ok', message: t('All systems healthy — no alerts!', 'تمام سسٹمز بالکل ٹھیک ہیں — کوئی الرٹ نہیں!') });
    }

    return list;
  }, [fuelData, lubeData]);

  // Fuel active shift
  const activeFuelShift = useMemo(() => fuelData.shifts.find(s => s.status === 'active'), [fuelData.shifts]);

  const fmt = (n: number) => n >= 1000000
    ? `PKR ${(n / 1000000).toFixed(2)}M`
    : n >= 1000 ? `PKR ${(n / 1000).toFixed(1)}K`
    : `PKR ${n.toFixed(0)}`;

  const handleNav = (view: string, stationId?: string) => {
    if (onNavigate) onNavigate(view, stationId);
  };

  return (
    <RoleGuard allowedRoles={['Owner', 'Manager']} fallbackMessage={t('Enterprise Dashboard is restricted to Owner / Manager only.', 'انٹرپرائز ڈیش بورڈ تک رسائی صرف مالکان اور مینیجرز کے لیے مخصوص ہے۔')}>
      <div className="w-full flex flex-col pb-12 gap-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t('Enterprise Overview', 'انٹرپرائز جائزہ')}</h1>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{t('Consolidated view — FuelPro + LubeManager Pro', 'مشترکہ جائزہ — فیول پرو + لیوب مینیجر پرو')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-2 rounded-xl border border-violet-500/20 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('Owner View — Restricted Access', 'مالک کا ویو — محدود رسائی')}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString(isUrdu ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* COMBINED KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label={t("Today's Revenue", 'آج کی آمدنی')} value={fmt(combined.todayRevenue)}
            sub={t('Both businesses', 'دونوں کاروبار')}
            icon={DollarSign} iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
          />
          <KPICard
            label={t('Total Revenue (YTD)', 'کل آمدنی (سالانہ)')} value={fmt(combined.totalRevenue)}
            sub={t('Lifetime accumulated', 'کل جمع شدہ')}
            icon={TrendingUp} iconBg="bg-orange-500/10" iconColor="text-orange-500"
          />
          <KPICard
            label={t('Gross Profit', 'مجموعی منافع')} value={fmt(combined.totalProfit)}
            sub={t('Revenue minus COGS', 'آمدنی منہا لاگت')}
            icon={BarChart3} iconBg="bg-blue-500/10" iconColor="text-blue-500"
          />
          <KPICard
            label={t('Udhar Outstanding', 'بقایا ادھار')} value={fmt(combined.totalCreditOut)}
            sub={`${t('Payables', 'واجبات')}: ${fmt(combined.totalPayables)}`}
            icon={CreditCard} iconBg="bg-red-500/10" iconColor="text-red-500"
          />
          <KPICard
            label={t('Inventory Value', 'اسٹاک کی مالیت')} value={fmt(combined.inventoryValue)}
            sub={t('Book value at cost', 'لاگت پر بک ویلیو')}
            icon={Package} iconBg="bg-purple-500/10" iconColor="text-purple-500"
          />
          <KPICard
            label={t('Total Expenses', 'کل اخراجات')} value={fmt(combined.totalExpenses)}
            sub={t('Operational expenses', 'آپریشنل اخراجات')}
            icon={Receipt} iconBg="bg-amber-500/10" iconColor="text-amber-500"
          />
          <KPICard
            label={t('Cash Position', 'نقدی کی صورتحال')} value={fmt(combined.cashPosition)}
            sub={t('Cash received minus costs', 'وصول شدہ نقدی منہا لاگت')}
            icon={Coins} iconBg="bg-teal-500/10" iconColor="text-teal-500"
          />
          <KPICard
            label={t('Supplier Payables', 'سپلائر واجبات')} value={fmt(combined.totalPayables)}
            sub={t('Outstanding to suppliers', 'سپلائرز کے بقایا جات')}
            icon={Fuel} iconBg="bg-indigo-500/10" iconColor="text-indigo-500"
          />
        </div>

        {/* TWO BUSINESS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BusinessCard
            name={t('Motorway Petroleum — Fuel Station', 'موٹروے پٹرولیم — فیول اسٹیشن')}
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
            t={t}
          />
          <BusinessCard
            name={t('Motorway Oil Bakhshali — Lube Shop', 'موٹروے آئل بخشالی — لیوب شاپ')}
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
            t={t}
          />
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Revenue Trend (7 days) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              {t('7-Day Revenue Trend — Both Businesses', '7 روز آمدنی کا رجحان — دونوں کاروبار')}
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
                      formatter={(val: any, name: any) => [`PKR ${val.toLocaleString()}`, name === 'fuel' ? t('Fuel Station', 'فیول اسٹیشن') : t('Lube Business', 'لیوب بزنس')]}
                    />
                    <Area type="monotone" dataKey="fuel" stroke="#F97316" strokeWidth={2.5} fill="url(#fuelGrad)" name="fuel" />
                    <Area type="monotone" dataKey="lube" stroke="#3B82F6" strokeWidth={2.5} fill="url(#lubeGrad)" name="lube" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-semibold">{t('No revenue data in last 7 days', 'گزشتہ 7 دنوں میں آمدنی کا کوئی ڈیٹا نہیں ہے')}</p>
                  <p className="text-xs mt-1 opacity-70">{t('Close a shift or make a sale to see trends', 'رجحان دیکھنے کے لیے شفٹ بند کریں یا فروخت درج کریں')}</p>
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold text-slate-500">{t('Fuel Station', 'فیول اسٹیشن')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-slate-500">{t('Lube Business', 'لیوب بزنس')}</span>
              </div>
            </div>
          </div>

          {/* Revenue Split Pie */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              {t('Revenue Contribution', 'آمدنی کا حصہ')}
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
                        formatter={(val: any) => [`PKR ${val.toLocaleString()}`, '']}
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
                <p className="text-sm font-semibold">{t('No revenue recorded yet', 'ابھی تک کوئی آمدنی ریکارڈ نہیں ہوئی')}</p>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* System Alerts */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {t('Enterprise Alerts', 'انٹرپرائز الرٹس')}
              {alerts.filter(a => a.type !== 'ok').length > 0 && (
                <span className="ml-auto bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {alerts.filter(a => a.type !== 'ok').length} {t('Issues', 'مسائل')}
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
                  {alert.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : alert.type === 'danger' ? (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
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
              {t('Owner Quick Access', 'مالک کی فوری رسائی')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t('Fuel Reports', 'فیول رپورٹس'), view: 'reports', stationId: DEFAULT_FUEL_STATION_ID, icon: BarChart3, color: 'text-orange-500 bg-orange-500/10' },
                { label: t('Lube POS Sales', 'لیوب سیلز رپورٹس'), view: 'reports', stationId: LUBE_STATION_ID, icon: Receipt, color: 'text-blue-500 bg-blue-500/10' },
                { label: t('Executive KPIs', 'ایگزیکٹو اشارے'), view: 'executive_dashboard', stationId: undefined, icon: TrendingUp, color: 'text-violet-500 bg-violet-500/10' },
                { label: t('Risk Center', 'رسک سینٹر'), view: 'risk_center', stationId: undefined, icon: ShieldCheck, color: 'text-red-500 bg-red-500/10' },
                { label: t('Fuel Customers', 'فیول کسٹمرز'), view: 'customers', stationId: DEFAULT_FUEL_STATION_ID, icon: Users, color: 'text-emerald-500 bg-emerald-500/10' },
                { label: t('Audit Center', 'آڈٹ سینٹر'), view: 'audit_center', stationId: undefined, icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-500/10' },
              ].map(item => (
                <button
                  key={`${item.view}_${item.stationId}`}
                  onClick={() => handleNav(item.view, item.stationId)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white dark:bg-[#151521]/10 transition-all text-left group"
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
