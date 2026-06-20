/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  Coins,
  ArrowUpRight,
  PlusCircle,
  Play,
  UserPlus,
  Gauge,
  ArrowRight,
  Fuel,
  Menu,
  Bell,
  Clock,
  StopCircle,
  ChevronRight,
  Receipt,
  FileText,
  DollarSign,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Truck,
  Tag,
  Activity,
  RefreshCw
} from 'lucide-react';
import { DataConfidenceBadge } from '../ui/DataConfidenceBadge';
import { generateDashboardStats, getFuelCategory } from '../../services/analytics/dashboardEngine';
import {
  Staff,
  Product,
  Nozzle,
  Customer,
  Supplier,
  Shift,
  BankAccount,
  GlobalSettings,
  LubePosSale,
  RateHistoryEntry,
  Tank,
  StockTransaction
} from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { PoweredByUmarAli } from '../shared/PoweredByUmarAli';
import { TankCircularGauge } from '../ui/TankCircularGauge';
import { DashboardAIInsights } from './DashboardAIInsights';
import { useAuth } from '../../contexts/AuthContext';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: spring,
};

interface DashboardProps {
  settings: GlobalSettings;
  activeStationId: string;
  shifts: Shift[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  staff: Staff[];
  nozzles: Nozzle[];
  tanks: Tank[];
  lubePosSales: LubePosSale[];
  onNavigate: (view: string) => void;
  onStartShiftQuick?: () => void;
  rateHistory?: RateHistoryEntry[];
  stockTxns?: StockTransaction[];
}

// Dynamic greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

// Relative time helper
function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export default React.memo(function Dashboard({
  settings,
  activeStationId,
  shifts,
  products,
  customers,
  suppliers,
  banks,
  staff,
  nozzles,
  tanks,
  lubePosSales,
  onNavigate,
  onStartShiftQuick,
  rateHistory = [],
  stockTxns = []
}: DashboardProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isLube = activeStationId === 'st_lube';
  const { user } = useAuth();

  // Logged-in user name
  const userName = user?.email?.split('@')[0]
    ?.replace(/[._]/g, ' ')
    ?.replace(/\b\w/g, c => c.toUpperCase()) || 'User';

  // State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const datedEntries = isLube ? lubePosSales.map((sale) => sale.date) : shifts.map((shift) => shift.date);
    if (datedEntries.length > 0) {
      return [...datedEntries].sort((a, b) => b.localeCompare(a))[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0];
  })();

  // Data aggregations
  const availableDates = useMemo(() => {
    const dates = new Set([
      ...(isLube ? lubePosSales.map((sale) => sale.date) : shifts.map((shift) => shift.date))
    ]);
    dates.add(new Date().toISOString().split('T')[0]);
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [isLube, lubePosSales, shifts]);

  const stats = useMemo(() => {
    return generateDashboardStats(
      selectedDate,
      shifts,
      products,
      customers,
      nozzles,
      isLube,
      lubePosSales
    );
  }, [selectedDate, shifts, products, customers, nozzles, isLube, lubePosSales]);

  // Yesterday's stats for % change
  const yesterdayStats = useMemo(() => {
    return generateDashboardStats(
      yesterdayStr,
      shifts,
      products,
      customers,
      nozzles,
      isLube,
      lubePosSales
    );
  }, [yesterdayStr, shifts, products, customers, nozzles, isLube, lubePosSales]);

  // % change vs yesterday — only shown if we have yesterday data
  const revenueChange = useMemo(() => {
    if (!yesterdayStats.totalSales || yesterdayStats.totalSales === 0) return null;
    const pct = ((stats.totalSales - yesterdayStats.totalSales) / yesterdayStats.totalSales) * 100;
    return pct;
  }, [stats.totalSales, yesterdayStats.totalSales]);

  const marginChange = useMemo(() => {
    if (!yesterdayStats.margin || yesterdayStats.margin === 0) return null;
    const pct = ((stats.margin - yesterdayStats.margin) / yesterdayStats.margin) * 100;
    return pct;
  }, [stats.margin, yesterdayStats.margin]);

  const fuelStocks = useMemo(() => {
    if (isLube) return products;
    return tanks || [];
  }, [products, isLube, tanks]);

  const displayTanks = useMemo(() => fuelStocks, [fuelStocks, isLube]);

  const activeShift = useMemo(() => {
    if (isLube) return undefined;
    return shifts.find(s => s.status === 'active');
  }, [isLube, shifts]);

  const activeStaffName = useMemo(() => {
    if (!activeShift) return '';
    return staff.find(st => st.id === activeShift.staffId)?.name || 'Operator';
  }, [activeShift, staff]);

  const timeStr = time.toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  // ─── REAL: Sales Overview Chart (hourly POS data, no fake outflow line) ───
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 18 }, (_, i) => i + 6);
    const trend = hours.map(hour => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      return { time: `${displayHour} ${ampm}`, sales: 0 };
    });

    lubePosSales.forEach(sale => {
      if (sale.date === selectedDate && sale.createdAt) {
        const saleHour = new Date(sale.createdAt).getHours();
        const index = saleHour - 6;
        if (index >= 0 && index < trend.length) {
          trend[index].sales += sale.total;
        }
      }
    });

    return trend;
  }, [lubePosSales, selectedDate]);

  // ─── REAL: Recent Shift Settlements (last 5 closed + active shifts) ───
  const recentShiftSettlements = useMemo(() => {
    return [...shifts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(sh => {
        const operator = staff.find(s => s.id === sh.staffId);
        // Calculate sales for this shift
        const shiftStats = generateDashboardStats(
          sh.date,
          [sh],
          products,
          customers,
          nozzles,
          isLube,
          lubePosSales
        );
        return {
          id: sh.id,
          date: sh.date,
          shiftType: sh.type || 'day',
          operatorName: operator?.name || 'Unknown',
          operatorInitials: (operator?.name || 'UK').substring(0, 2).toUpperCase(),
          status: sh.status,
          sales: shiftStats.totalSales,
          submittedCash: sh.submittedCash || 0,
          closedAt: sh.endTime || sh.startTime
        };
      });
  }, [shifts, staff, products, customers, nozzles, isLube, lubePosSales]);

  // ─── REAL: Top Selling Items (from today's shift data or lube POS data) ───
  const topSellingItems = useMemo(() => {
    const litersByProduct: Record<string, { name: string; liters: number; color: string }> = {};

    if (!isLube) {
      const todayShifts = shifts.filter(s => s.date === selectedDate);
      todayShifts.forEach(sh => {
      nozzles.forEach(nz => {
        const open = sh.openingReadings?.[nz.id] || 0;
        const close = sh.closingReadings?.[nz.id] || 0;
        const diff = Math.max(0, close - open);
        if (diff > 0) {
          const prod = products.find(p => p.id === nz.productId);
          if (prod) {
            if (!litersByProduct[prod.id]) {
              let color = '#22C55E';
              const n = prod.name.toLowerCase();
              if (n.includes('petrol') || n.includes('pmg')) color = '#3B82F6';
              else if (n.includes('octane') || n.includes('hobc')) color = '#F97316';
              else if (n.includes('cng')) color = '#8B5CF6';
              litersByProduct[prod.id] = { name: prod.name, liters: 0, color };
            }
            litersByProduct[prod.id].liters += diff;
          }
        }
      });
      });
    }

    // Also include lube POS sales
    if (isLube) {
      const todaySales = lubePosSales.filter(s => s.date === selectedDate);
      todaySales.forEach(sale => {
        sale.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            if (!litersByProduct[prod.id]) {
              litersByProduct[prod.id] = { name: prod.name, liters: 0, color: '#3B82F6' };
            }
            litersByProduct[prod.id].liters += item.quantity;
          }
        });
      });
    }

    const items = Object.values(litersByProduct).sort((a, b) => b.liters - a.liters);
    const max = items[0]?.liters || 1;
    return items.slice(0, 4).map(item => ({
      ...item,
      widthPct: Math.round((item.liters / max) * 100)
    }));
  }, [shifts, nozzles, products, selectedDate, isLube, lubePosSales]);

  // ─── REAL: Activity Feed ───
  const activityFeed = useMemo(() => {
    const list: Array<{
      id: string; icon: React.ElementType; color: string; bg: string;
      title: string; subtitle: string; time: string;
    }> = [];

    // Shifts
    [...shifts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .forEach(sh => {
        const op = staff.find(s => s.id === sh.staffId)?.name || 'Unknown';
        if (sh.status === 'active') {
          list.push({ id: `sh_${sh.id}_open`, icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: `Shift Opened`, subtitle: `${op} · ${sh.date}`, time: sh.date });
        } else {
          list.push({ id: `sh_${sh.id}_close`, icon: StopCircle, color: 'text-slate-400', bg: 'bg-slate-500/10', title: `Shift Settled`, subtitle: `${op} · ${sh.date}`, time: sh.endTime || sh.date });
        }
      });

    // Price changes
    rateHistory.slice(-3).reverse().forEach((rh, i) => {
      const prod = products.find(p => p.id === rh.productId);
      list.push({ id: `rh_${i}`, icon: Tag, color: 'text-orange-400', bg: 'bg-orange-500/10', title: `Price Changed`, subtitle: `${prod?.name || 'Product'} → Rs ${rh.newRate}`, time: rh.date });
    });

    // Stock imports
    stockTxns.filter(tx => tx.type === 'receipt').slice(-2).reverse().forEach((tx, i) => {
      const prod = products.find(p => p.id === tx.itemId);
      list.push({ id: `stk_${i}`, icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', title: `Fuel Imported`, subtitle: `${prod?.name || 'Fuel'} · ${tx.quantity.toLocaleString()} L`, time: tx.date });
    });

    // Low stock alerts
    products.forEach(p => {
      if (p.currentStock <= p.minStock) {
        list.push({ id: `alert_${p.id}`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', title: `Low Stock Alert`, subtitle: `${p.name}: ${p.currentStock} ${p.unit} left`, time: todayStr });
      }
    });

    // Sort by time desc and limit
    return list
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 6);
  }, [shifts, staff, rateHistory, stockTxns, products, todayStr]);

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50 dark:bg-[#151521] px-4 lg:px-8 pb-10 pt-4">

      {/* GREETING & SHIFT CTA SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {getGreeting()}, {userName} 👋
          </h2>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{timeStr}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${activeShift ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-xs font-bold">{activeShift ? `Shift Active · ${activeStaffName}` : 'No Active Shift'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onStartShiftQuick) onStartShiftQuick();
              else onNavigate('shift_wizard');
            }}
            className="flex items-center gap-2 bg-[#FF7A00] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(255,122,0,0.3)]"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Shift
          </button>
          <button
            onClick={() => onNavigate('shift_logs')}
            className="flex items-center gap-2 bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            <FileText className="w-5 h-5" />
            Shift Logs
          </button>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Revenue */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">REVENUE</span>
            {revenueChange !== null && (
              <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${revenueChange >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                <TrendingUp className="w-3 h-3" />
                <span>{revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 shadow-inner">
            <DollarSign className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.totalSales, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Today's Sales</p>
        </div>

        {/* Profit */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PROFIT</span>
            {marginChange !== null && (
              <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${marginChange >= 0 ? 'text-blue-500 bg-blue-500/10' : 'text-red-500 bg-red-500/10'}`}>
                <TrendingUp className="w-3 h-3" />
                <span>{marginChange >= 0 ? '+' : ''}{marginChange.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500 ring-1 ring-inset ring-blue-500/20 shadow-inner">
            <TrendingUp className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.margin, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Gross Margin</p>
        </div>

        {/* Udhar Due */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">UDHAR DUE</span>
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 ring-1 ring-inset ring-orange-500/20 shadow-inner">
            <UserPlus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.dueRecovery, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Pending Recovery</p>
        </div>

        {/* Cash On Hand */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CASH ON HAND</span>
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-500 ring-1 ring-inset ring-purple-500/20 shadow-inner">
            <Coins className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.cashOnHand, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Available</p>
        </div>
      </div>

      {/* SALES OVERVIEW CHART */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sales Overview</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 hidden sm:block">Today:</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
              {formatCurrency(stats.totalSales, settings)}
            </span>
          </div>
        </div>
        <div className="h-[200px] w-full">
          {hourlyData.some(d => d.sales > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalesPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#FF7A00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', dy: 10 }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', dx: -10 }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : val} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '12px', border: '1px solid var(--border-main)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px', padding: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#FF7A00' }}
                  formatter={(value: number) => [`${getCurrencySymbol(settings)} ${value.toLocaleString('en-PK')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="sales" stroke="#FF7A00" strokeWidth={4} fillOpacity={1} fill="url(#colorSalesPremium)" activeDot={{ r: 6, fill: '#FF7A00', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Activity className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-semibold">{isLube ? 'No POS sales recorded today' : 'Fuel chart updates when POS sales are recorded'}</p>
              <p className="text-xs mt-1 opacity-70">Fuel shift data is aggregated at shift close</p>
            </div>
          )}
        </div>
      </div>

      {/* TANK LEVELS SECTION */}
      {!isLube && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tank Levels</h3>
            <button
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
              onClick={() => onNavigate('inventory')}
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {displayTanks.length > 0 ? (
              displayTanks.map((tank: any, i: number) => {
                const capacity = tank.capacity || 50000;
                let current = tank.currentStock !== undefined ? tank.currentStock : (tank.volume || 0);
                if (current === 0 && tank.productId) {
                  const linkedProduct = products.find(p => p.id === tank.productId);
                  if (linkedProduct) current = linkedProduct.currentStock || 0;
                }

                const nameLower = tank.name?.toLowerCase() || '';
                let color = '#22C55E';
                if (nameLower.includes('petrol')) color = '#3B82F6';
                else if (nameLower.includes('hi-octane') || nameLower.includes('octane')) color = '#F97316';
                else if (nameLower.includes('super')) color = '#A855F7';

                const subLabel = nameLower.includes('diesel') ? 'Diesel' : nameLower.includes('petrol') ? 'Petrol' : nameLower.includes('octane') ? 'Hi-Octane' : 'Fuel';

                return (
                  <TankCircularGauge
                    key={tank.id}
                    name={`Tank ${i + 1}`}
                    subLabel={subLabel}
                    color={color}
                    current={current}
                    capacity={capacity}
                  />
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-white/5 border-dashed rounded-[24px]">
                <Fuel className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-wider">{t('No Tanks Configured', 'کوئی ٹینک موجود نہیں')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THREE COLUMNS: RECENT SHIFTS, TOP ITEMS, AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

        {/* Recent Shift Settlements or Recent POS Sales — REAL DATA */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
            {isLube ? 'Recent POS Sales' : 'Recent Shifts'}
          </h3>
          <div className="flex-1 flex flex-col gap-3">
            {!isLube ? (
              recentShiftSettlements.length > 0 ? recentShiftSettlements.map(sh => (
                <div key={sh.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-xs font-bold ${sh.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                      {sh.operatorInitials}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{sh.operatorName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{sh.date}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sh.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>
                          {sh.status === 'active' ? '● ACTIVE' : sh.shiftType === 'night' ? '🌙 NIGHT' : '☀ DAY'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      {formatCurrency(sh.sales || sh.submittedCash, settings)}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sales</p>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                  <Receipt className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-semibold">No shifts yet</p>
                  <p className="text-xs mt-1 opacity-70">Start a shift to see it here</p>
                </div>
              )
            ) : (
              // Lube POS Sales
              lubePosSales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xs font-bold bg-blue-500/10 text-blue-500">
                      POS
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{sale.customerName || 'Walk-in'}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{sale.date} {sale.time}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 uppercase">
                          {sale.paymentMode}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      {formatCurrency(sale.total, settings)}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Invoice: {sale.invoiceNo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => isLube ? onNavigate('lube_pos') : onNavigate('shift_logs')}
            className="w-full mt-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-orange-500 hover:bg-orange-500/5 transition-colors cursor-pointer"
          >
            {isLube ? 'Go to POS Terminal' : 'View All Shifts'}
          </button>
        </div>

        {/* Top Selling Items — REAL DATA */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top {isLube ? 'Products' : 'Fuels'} Today</h3>
          </div>
          <div className="flex-1 flex flex-col gap-5">
            {topSellingItems.length > 0 ? topSellingItems.map(item => (
              <div key={item.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</span>
                  <span className="text-sm font-bold text-slate-500">{item.liters.toFixed(1)} {isLube ? 'pcs' : 'L'}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${item.widthPct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                <Gauge className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-semibold">No sales data for today</p>
                <p className="text-xs mt-1 opacity-70">Close a shift to see fuel breakdown</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="w-full mt-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-orange-500 hover:bg-orange-500/5 transition-colors"
          >
            View Full Report
          </button>
        </div>

        {/* AI Insights / Loss Prevention */}
        <DashboardAIInsights settings={settings} shifts={shifts} />

      </div>

      {/* ACTIVITY FEED */}
      {activityFeed.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Station Activity
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Live Events</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activityFeed.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${event.bg}`}>
                  <event.icon className={`w-4 h-4 ${event.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{event.title}</p>
                  <p className="text-xs text-slate-500 truncate">{event.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Footer */}
      <div className="mt-auto pt-4 px-2 w-full flex justify-center">
        <PoweredByUmarAli variant="dashboard" />
      </div>

    </div>
  );
});
