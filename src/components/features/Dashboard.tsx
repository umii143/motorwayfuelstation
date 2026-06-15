/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  PlusCircle,
  Play,
  UserPlus,
  RefreshCw,
  Gauge,
  Activity,
  ArrowRight,
  Fuel,
  Wrench,
  Menu,
  Bell,
  Clock,
  StopCircle,
  ChevronRight,
  Box,
  Receipt,
  FileText,
  DollarSign,
  ChevronDown
} from 'lucide-react';
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
  Tank
} from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { haptic } from '../../utils/haptics';
import { PoweredByUmarAli } from '../shared/PoweredByUmarAli';
import { TankCircularGauge } from '../ui/TankCircularGauge';

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
  rateHistory = []
}: DashboardProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isLube = activeStationId === 'st_lube';
  const salesEntryView = isLube ? 'lube_pos' : 'shift_wizard';

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

  // Data aggregations (copied from original)
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

  const fuelStocks = useMemo(() => {
    if (isLube) return products;
    return tanks || [];
  }, [products, isLube, tanks]);

  const displayTanks = useMemo(() => {
    return fuelStocks;
  }, [fuelStocks, isLube]);

  const activeShift = useMemo(() => {
    if (isLube) return undefined;
    return shifts.find(s => s.status === 'active');
  }, [isLube, shifts]);

  const activeStaffName = useMemo(() => {
    if (!activeShift) return '';
    return staff.find(st => st.id === activeShift.staffId)?.name || 'Operator';
  }, [activeShift, staff]);

  const activityFeed = useMemo(() => {
    const list: any[] = [];
    products.forEach(p => {
      if (p.currentStock <= p.minStock) {
        list.push({
          id: `alert_${p.id}`,
          title: `Low Stock: ${p.name}`,
          subtitle: `${p.currentStock} ${p.unit} remaining`,
          type: 'alert'
        });
      }
    });
    const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));
    sortedShifts.slice(0, 4).forEach(sh => {
      list.push({
        id: `shift_${sh.id}`,
        title: `Shift: ${sh.date}`,
        subtitle: `${sh.status.toUpperCase()}`,
        type: 'shift'
      });
    });
    return list.slice(0, 5);
  }, [products, shifts]);

  const timeStr = time.toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });



  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 18 }, (_, i) => i + 6);
    const trend = hours.map(hour => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      return {
        time: `${displayHour} ${ampm}`,
        sales: 0
      };
    });

    // Only map actual real-time timestamped transactions (POS sales)
    // Avoid creating dummy flat-lines for metered fuel.
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

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50 dark:bg-[#151521] px-4 lg:px-8 pb-10 pt-4">

      {/* GREETING & SHIFT CTA SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            Good Evening, Umar Ali 👋
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
              <div className={`w-1.5 h-1.5 rounded-full ${activeShift ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="text-xs font-bold">{activeShift ? 'Shift Active' : 'No Active Shift'}</span>
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
            className="flex items-center ga bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:premium-card/5 text-slate-700 dark:text-white px-6 py-3 font-bold transition-all"
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
            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>2.4%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.totalSales, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Today's Sales</p>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-50">
             <svg viewBox="0 0 100 30" className="w-full h-full preserve-3d" preserveAspectRatio="none">
               <path d="M0,30 L10,25 L30,28 L50,15 L70,20 L90,5 L100,10" fill="none" stroke="#10B981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
             </svg>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PROFIT</span>
            <div className="flex items-center gap-1 text-blue-500 text-[10px] font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>2.1%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.margin, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Gross Margin</p>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-50">
             <svg viewBox="0 0 100 30" className="w-full h-full preserve-3d" preserveAspectRatio="none">
               <path d="M0,20 L20,25 L40,10 L60,15 L80,5 L100,10" fill="none" stroke="#3B82F6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
             </svg>
          </div>
        </div>

        {/* Udhar Due */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">UDHAR DUE</span>
            <div className="flex items-center gap-1 text-orange-500 text-[10px] font-bold bg-orange-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3" />
              <span>0.0%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
            <UserPlus className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.dueRecovery, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Pending</p>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-50">
             <svg viewBox="0 0 100 30" className="w-full h-full preserve-3d" preserveAspectRatio="none">
               <path d="M0,15 L30,20 L50,15 L70,25 L100,15" fill="none" stroke="#F97316" strokeWidth="2" vectorEffect="non-scaling-stroke" />
             </svg>
          </div>
        </div>

        {/* Cash On Hand */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CASH ON HAND</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
            <Coins className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{formatCurrency(stats.cashOnHand, settings)}</h3>
          <p className="text-xs font-semibold text-slate-400">Available</p>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-50">
             <svg viewBox="0 0 100 30" className="w-full h-full preserve-3d" preserveAspectRatio="none">
               <path d="M0,25 L20,15 L40,20 L60,5 L80,10 L100,20" fill="none" stroke="#A855F7" strokeWidth="2" vectorEffect="non-scaling-stroke" />
             </svg>
          </div>
        </div>
      </div>

      {/* SALES OVERVIEW CHART */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sales Overview</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 hidden sm:block">Today:</span>
            <button className="flex items-center gap-1 text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
              {formatCurrency(stats.totalSales, settings)}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors ml-1 hidden sm:block">
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="h-[250px] w-full">
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
                formatter={(value: number) => [`${getCurrencySymbol(settings)} ${value.toLocaleString('en-PK')}`, 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="#FF7A00" strokeWidth={4} fillOpacity={1} fill="url(#colorSalesPremium)" activeDot={{ r: 6, fill: '#FF7A00', stroke: '#fff', strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TANK LEVELS SECTION */}
      {!isLube && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tank Levels</h3>
            <button 
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
              onClick={() => { haptic.light(); onNavigate('inventory'); }}
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
                
                // Color mapping logic for premium colors
                const nameLower = tank.name?.toLowerCase() || '';
                let color = '#22C55E'; // Green (Diesel)
                if (nameLower.includes('petrol')) color = '#3B82F6'; // Blue
                else if (nameLower.includes('hi-octane')) color = '#F97316'; // Orange
                else if (nameLower.includes('super')) color = '#A855F7'; // Purple

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

      {/* THREE COLUMNS: TRANSACTIONS, TOP ITEMS, SHIFT SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Recent Transactions</h3>
          <div className="flex-1 flex flex-col gap-4">
            {/* Dummy Data matching mockup since lubePosSales/shifts might not have all exact types */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Cash Sale</h4>
                  <span className="text-[10px] text-slate-500">06:25 PM</span>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">Rs. 2,500</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Credit Sale</h4>
                  <span className="text-[10px] text-slate-500">06:10 PM</span>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">Rs. 1,800</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Fuel Refill</h4>
                  <span className="text-[10px] text-slate-500">05:45 PM</span>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">Rs. 5,000</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Cash Sale</h4>
                  <span className="text-[10px] text-slate-500">05:30 PM</span>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">Rs. 1,200</span>
            </div>
          </div>
          <button className="w-full mt-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-orange-500 hover:bg-orange-500/5 transition-colors">
            View All Transactions
          </button>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top Selling Items</h3>
            <button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md border border-slate-200 dark:border-white/5">
              Today <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-5">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Diesel</span>
                <span className="text-sm font-bold text-slate-500">120.5 L</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Petrol</span>
                <span className="text-sm font-bold text-slate-500">80.3 L</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Hi-Octane</span>
                <span className="text-sm font-bold text-slate-500">45.6 L</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Super Diesel</span>
                <span className="text-sm font-bold text-slate-500">30.2 L</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-orange-500 hover:bg-orange-500/5 transition-colors">
            View Full Report
          </button>
        </div>

        {/* Shift Summary */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Shift Summary</h3>
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-500">Shift</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">Morning Shift</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-500">Shift In Time</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">06:00 AM</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-500">Shift By</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{activeStaffName || 'Umar Ali'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-500">Total Sales</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(stats.totalSales, settings)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-500">Total Profit</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(stats.margin, settings)}</span>
            </div>
          </div>
          <button 
            className="w-full mt-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-orange-500 hover:bg-orange-500/5 transition-colors"
            onClick={() => onNavigate('shift_logs')}
          >
            View Shift Logs
          </button>
        </div>

      </div>

      {/* Dashboard Footer */}
      <div className="mt-auto pt-4 px-2 w-full flex justify-center">
        <PoweredByUmarAli variant="dashboard" />
      </div>

    </div>
  );
});
