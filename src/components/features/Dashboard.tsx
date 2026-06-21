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
import { isLubeBusinessStation } from '../../lib/businessScope';
import LubeDashboard from './LubeDashboard';
import FuelDashboard from './FuelDashboard';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: spring,
};

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // Only update every minute
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  return <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{timeStr}</span>;
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
  const isLube = isLubeBusinessStation(activeStationId);
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

  if (isLube) {
    return (
      <LubeDashboard 
        settings={settings}
        activeStationId={activeStationId}
        lubePosSales={lubePosSales}
        products={products}
        customers={customers}
        suppliers={suppliers}
        banks={banks}
        stockTxns={stockTxns || []}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <FuelDashboard
      settings={settings}
      activeStationId={activeStationId}
      shifts={shifts}
      products={products}
      customers={customers}
      suppliers={suppliers}
      banks={banks}
      nozzles={nozzles}
      tanks={tanks}
      stockTxns={stockTxns}
      onNavigate={onNavigate}
      onStartShiftQuick={onStartShiftQuick}
      userName={userName}
    />
  );
});
