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
  DollarSign
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
    // Always prefer real tanks array if present
    if (tanks && tanks.length > 0) return tanks;
    
    // Fallback to legacy behavior if tanks not set up
    return products.filter(p => {
      const type = (p.type || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return type === 'fuel' || type === 'petrol' || type === 'diesel' || cat === 'fuel' || name.includes('diesel') || name.includes('petrol') || name.includes('fuel') || (p.capacity !== undefined && p.capacity > 0);
    });

  }, [products, isLube, tanks]);

  // Fallback to dummy data if completely empty, just so the user can see the new UI
  const displayTanks = useMemo(() => {
    if (fuelStocks.length > 0) return fuelStocks;
    if (isLube) return [];
    return [
      { id: 'dummy_diesel', name: 'High Speed Diesel (HSD)', capacity: 50000, currentStock: 32500 },
      { id: 'dummy_petrol', name: 'Super Petrol (PMG)', capacity: 30000, currentStock: 3500 }
    ];
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
      if (sale.date === selectedDate && sale.timestamp) {
         const saleHour = new Date(sale.timestamp).getHours();
         const index = saleHour - 6;
         if (index >= 0 && index < trend.length) {
           trend[index].sales += sale.total;
         }
      }
    });

    return trend;
  }, [lubePosSales, selectedDate]);

  return (
    <div className="w-full flex-1 flex flex-col bg-transparent pb-16">

      {/* SHIFT STATUS PILL */}
      <div className="status-row">
        <div className="time-pill">
          <Clock className="w-4 h-4" />
          <span>{timeStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`status-pill ${activeShift ? 'active' : 'inactive'}`}>
            <span className="dot"></span>
            <span className="text">{activeShift ? 'Shift Active' : 'No Active Shift'}</span>
          </div>
        </div>
        <div className="flex items-center bg-theme-card border border-theme-main rounded-full px-3 py-1.5 shadow-sm ml-auto min-w-[110px]">
          <select 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-[11px] font-extrabold outline-none focus:ring-0 cursor-pointer text-theme-main w-full py-0 appearance-none text-center uppercase tracking-wide"
          >
            {availableDates.map(date => (
              <option key={date} value={date} className="bg-[var(--bg-app)] text-theme-main font-sans">
                {date === new Date().toISOString().split('T')[0] ? 'Today' : date}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1">

        {/* SHIFT CTA (Moved to top) */}
        {!isLube && (
          <div className="grid grid-cols-2 gap-3 mb-4 px-1">
            {activeShift ? (
              <>
                <motion.button
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white py-3.5 font-bold shadow-md shadow-orange-500/20"
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    await haptic.heavy();
                    onNavigate(salesEntryView);
                  }}
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span className="text-sm">Resume Sale</span>
                </motion.button>
                <motion.button
                  className="flex items-center justify-center gap-2 rounded-xl bg-theme-card text-theme-main py-3.5 font-bold border border-theme-main shadow-sm"
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    await haptic.heavy();
                    onNavigate('shift_wizard');
                  }}
                >
                  <StopCircle className="h-5 w-5" />
                  <span className="text-sm">Close Shift</span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white py-3.5 font-bold shadow-md shadow-orange-500/20"
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    await haptic.heavy();
                    if (onStartShiftQuick) onStartShiftQuick();
                    else onNavigate('shift_wizard');
                  }}
                  animate={{ boxShadow: ['0 0 0 0 rgba(249,115,22,0)', '0 0 0 8px rgba(249,115,22,0)'] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span className="text-sm">Start Shift</span>
                </motion.button>
                <motion.button
                  className="flex items-center justify-center gap-2 rounded-xl bg-theme-card text-theme-main py-3.5 font-bold border border-theme-main shadow-sm"
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    await haptic.heavy();
                    onNavigate('shift_logs');
                  }}
                >
                  <FileText className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Shift Logs</span>
                </motion.button>
              </>
            )}
          </div>
        )}
        
        {/* KPI GRID */}
        <div className="kpi-grid">
          <motion.div className="kpi-card kpi-card--blue" {...fadeUp} transition={{ ...spring, delay: 0 }} whileTap={{ scale: 0.97 }} onClick={() => haptic.light()}>
            <span className="kpi-icon">💵</span>
            <p className="kpi-value">{formatCurrency(stats.totalSales, settings)}</p>
            <p className="kpi-label">Today's Revenue</p>
          </motion.div>
          
          <motion.div className="kpi-card kpi-card--green" {...fadeUp} transition={{ ...spring, delay: 0.05 }} whileTap={{ scale: 0.97 }} onClick={() => haptic.light()}>
            <span className="kpi-icon">📈</span>
            <p className="kpi-value">{formatCurrency(stats.margin, settings)}</p>
            <p className="kpi-label">Gross Profit</p>
          </motion.div>

          <motion.div className="kpi-card kpi-card--orange" {...fadeUp} transition={{ ...spring, delay: 0.1 }} whileTap={{ scale: 0.97 }} onClick={() => haptic.light()}>
            <span className="kpi-icon">⛽</span>
            <p className="kpi-value">{formatCurrency(stats.dueRecovery, settings)}</p>
            <p className="kpi-label">Udhar Due</p>
          </motion.div>

          <motion.div className="kpi-card kpi-card--purple" {...fadeUp} transition={{ ...spring, delay: 0.15 }} whileTap={{ scale: 0.97 }} onClick={() => haptic.light()}>
            <span className="kpi-icon">💰</span>
            <p className="kpi-value">{formatCurrency(stats.cashOnHand, settings)}</p>
            <p className="kpi-label">Cash on Hand</p>
          </motion.div>
        </div>

        {/* HOURLY SALES TREND */}
        <div className="mt-4 px-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Hourly Trend</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatCurrency(stats.totalSales, settings)} Total</span>
          </div>
          <div className="h-32 w-full bg-theme-card rounded-xl border border-theme-main overflow-hidden pt-4 pb-1 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '8px', border: '1px solid var(--border-main)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                  formatter={(value: number) => [`${getCurrencySymbol(settings)} ${value.toLocaleString('en-PK')}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TANK LEVELS BARS */}
        <div className="mt-4 px-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tank Levels</h3>
            <button className="text-xs text-orange-600 font-bold" onClick={() => { haptic.light(); onNavigate('inventory'); }}>View All</button>
          </div>
          
          <div className="flex flex-col gap-3">
            {displayTanks.length > 0 ? (
              displayTanks.map((tank: any) => {
                const capacity = tank.capacity || 25000;
                const current = tank.currentStock !== undefined ? tank.currentStock : (tank.volume || 0);
                const pct = (current / capacity) * 100;
                const isLow = pct < 20;
                const isCritical = pct < 5;
                const color = (tank.id === 'diesel' || tank.id === 'dummy_diesel' || tank.name?.toLowerCase().includes('diesel')) ? '#3B82F6' : '#22C55E';

                return (
                  <motion.div key={tank.id} className="bg-theme-card rounded-xl p-3 border border-theme-main" whileTap={{ scale: 0.98 }} onClick={() => haptic.light()}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-theme-main">{tank.name}</span>
                        {isCritical && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">CRITICAL</span>}
                        {isLow && !isCritical && <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded">LOW</span>}
                      </div>
                      <span className="text-xs font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: isCritical ? '#EF4444' : isLow ? '#F97316' : color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 2)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="mt-1.5 text-right">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {current.toLocaleString('en-PK')} / {(capacity/1000).toFixed(0)}K L
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-4 border border-dashed border-theme-main rounded-xl flex items-center justify-center">
                <span className="text-xs text-[var(--text-muted)] font-medium">No Tanks Configured</span>
              </div>
            )}
          </div>
        </div>

        {/* SHIFT CTA WAS HERE */}

        <div className="mt-4 pb-8 px-1">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Launch Shift', icon: <Play className="h-5 w-5" />, color: '#F97316', view: salesEntryView },
              { label: 'Stock IN',     icon: <Box className="h-5 w-5" />, color: '#22C55E', view: 'inventory' },
              { label: 'Expense',      icon: <Receipt className="h-5 w-5" />, color: '#EF4444', view: 'expenses' },
              { label: 'Customer',     icon: <UserPlus className="h-5 w-5" />, color: '#3B82F6', view: 'customers' },
              { label: 'Reports',      icon: <FileText className="h-5 w-5" />, color: '#8B5CF6', view: 'reports' },
              { label: 'Pricing',      icon: <DollarSign className="h-5 w-5" />, color: '#F59E0B', view: 'settings' },
            ].map((action, i) => (
              <motion.button
                key={action.label}
                className="kpi-card flex flex-col items-center justify-start pt-4 pb-3 px-2 h-[100px]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: i * 0.04 }}
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                  await haptic.light();
                  onNavigate(action.view);
                }}
              >
                <div
                  className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border mb-2"
                  style={{ backgroundColor: action.color + '20', borderColor: action.color + '40', color: action.color }}
                >
                  {action.icon}
                </div>
                <div className="h-8 flex items-center justify-center w-full">
                  <span className="text-[11px] font-bold text-theme-main text-center leading-tight line-clamp-2">{action.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
});
