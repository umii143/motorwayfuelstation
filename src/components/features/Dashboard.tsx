/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
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
  Wrench
} from 'lucide-react';
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
  RateHistoryEntry
} from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { DashboardAIInsights } from './DashboardAIInsights';
import { DashboardAIAssistant } from './DashboardAIAssistant';
import { DashboardRealtimeGauges } from './DashboardRealtimeGauges';
import { DashboardWeeklyGraph } from './DashboardWeeklyGraph';
import { DashboardLiquidAssetsGraph } from './DashboardLiquidAssetsGraph';

const getFuelCategory = (productId: string, products: Product[]): 'petrol' | 'diesel' | 'cng' | null => {
  const p = products.find((prod) => prod.id === productId);
  if (!p) return null;
  if (p.type !== 'fuel') return null;

  const idLower = p.id.toLowerCase();
  const nameLower = p.name.toLowerCase();

  if (
    idLower === 'petrol' ||
    idLower === 'prod_f1' ||
    idLower === 'prod_f3' ||
    nameLower.includes('petrol') ||
    nameLower.includes('pmg') ||
    nameLower.includes('hobc') ||
    nameLower.includes('octane') ||
    nameLower.includes('super')
  ) {
    return 'petrol';
  }
  if (
    idLower === 'diesel' ||
    idLower === 'prod_f2' ||
    nameLower.includes('diesel') ||
    nameLower.includes('hsd')
  ) {
    return 'diesel';
  }
  if (
    idLower === 'cng' ||
    nameLower.includes('cng') ||
    nameLower.includes('gas')
  ) {
    return 'cng';
  }
  return null;
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

export default function Dashboard({
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
  // Translation helpers
  const t = (en: string, ur: string) => translate(en, ur, settings);

  // Single source of truth: use activeStationId, not product-type heuristic
  const isLube = activeStationId === 'st_lube';
  const salesEntryView = isLube ? 'lube_pos' : 'shift_wizard';


  // ==========================================
  // METRICS & AGGREGATIONS
  // ==========================================
  
  // Date-based filter (defaulting to the latest shift date or current calendar date)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const datedEntries = isLube ? lubePosSales.map((sale) => sale.date) : shifts.map((shift) => shift.date);
    if (datedEntries.length > 0) {
      return [...datedEntries].sort((a, b) => b.localeCompare(a))[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const pricingStats = useMemo(() => {
    let totalGain = 0;
    let totalLoss = 0;
    
    // Filter rate history by selected date for "Today's Price Impact" KPI
    const dailyHistory = rateHistory.filter(entry => entry.date.startsWith(selectedDate));
    
    dailyHistory.forEach((entry) => {
      const val = entry.gainLoss !== undefined ? entry.gainLoss : (entry.impactAmount || 0);
      if (val > 0) {
        totalGain += val;
      } else {
        totalLoss += Math.abs(val);
      }
    });
    return {
      gain: totalGain,
      loss: totalLoss,
      net: totalGain - totalLoss
    };
  }, [rateHistory, selectedDate]);

  // Unique shift dates for filtering
  const availableDates = useMemo(() => {
    const dates = new Set([
      ...(isLube ? lubePosSales.map((sale) => sale.date) : shifts.map((shift) => shift.date))
    ]);
    dates.add(new Date().toISOString().split('T')[0]);
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [isLube, lubePosSales, shifts]);

  // Aggregate stats dynamically for selectedDate
  const stats = useMemo(() => {
    let totalSalesVal = 0;
    let estimatedMargin = 0;
    let expectedCashOnHand = 0;

    if (isLube) {
      const salesOnDate = lubePosSales.filter((sale) => sale.date === selectedDate);

      salesOnDate.forEach((sale) => {
        totalSalesVal += sale.total;
        estimatedMargin += sale.items.reduce((sum, item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          const marginRate = product?.type === 'lube' ? 0.22 : 0.18;
          return sum + item.lineTotal * marginRate;
        }, 0);

        if (sale.paymentMode === 'cash') {
          expectedCashOnHand += sale.total;
        }
      });
    } else {
      const shiftsOnDate = shifts.filter(s => s.date === selectedDate);

      const petrolProduct = products.find(p => getFuelCategory(p.id, products) === 'petrol');
      const dieselProduct = products.find(p => getFuelCategory(p.id, products) === 'diesel');
      const cngProduct = products.find(p => getFuelCategory(p.id, products) === 'cng');

      const petrolRate = petrolProduct?.rate || 272.50;
      const dieselRate = dieselProduct?.rate || 281.20;
      const cngRate = cngProduct?.rate || 210.00;

      shiftsOnDate.forEach(s => {
        let petrolSales = 0;
        let dieselSales = 0;
        let cngSales = 0;

        let petrolLiters = 0;
        let dieselLiters = 0;
        let cngKgs = 0;

        nozzles.forEach(nz => {
          const open = s.openingReadings?.[nz.id] || 0;
          const close = s.closingReadings?.[nz.id] || 0;
          const diff = Math.max(0, close - open);
          const fuelCat = getFuelCategory(nz.productId, products);
          if (fuelCat === 'petrol') petrolLiters += diff;
          else if (fuelCat === 'diesel') dieselLiters += diff;
          else if (fuelCat === 'cng') cngKgs += diff;
        });

        petrolLiters = Math.max(0, petrolLiters - (s.testLiters?.petrol || 0));
        dieselLiters = Math.max(0, dieselLiters - (s.testLiters?.diesel || 0));
        cngKgs = Math.max(0, cngKgs - (s.testLiters?.cng || 0));

        petrolSales = petrolLiters * petrolRate;
        dieselSales = dieselLiters * dieselRate;
        cngSales = cngKgs * cngRate;

        const lubeSalesVal = s.lubeSales?.reduce((acc, l) => acc + l.amount, 0) || 0;

        const grossShiftSales = petrolSales + dieselSales + cngSales + lubeSalesVal;
        totalSalesVal += grossShiftSales;
        estimatedMargin += (petrolSales + dieselSales + cngSales) * 0.045 + lubeSalesVal * 0.22;

        if (s.status === 'closed') {
          expectedCashOnHand += s.submittedCash;
        } else {
          expectedCashOnHand += (grossShiftSales
            + (s.recoveryEntries?.reduce((acc, r) => acc + r.amount, 0) || 0)
            - (s.debitEntries?.reduce((acc, d) => acc + d.amount, 0) || 0)
            - (s.expenseEntries?.reduce((acc, e) => acc + e.amount, 0) || 0)
            - (s.supplierPayments?.reduce((acc, p) => acc + p.amount, 0) || 0)
            - (s.bankCashEntries?.reduce((acc, b) => acc + b.amount, 0) || 0)
            - (s.digitalCashEntries?.reduce((acc, d) => acc + d.amount, 0) || 0));
        }
      });
    }

    // Customers outstanding total (all time)
    const totalDueRecovery = customers.reduce((acc, c) => acc + c.balance, 0);

    return {
      totalSales: totalSalesVal,
      margin: estimatedMargin,
      cashOnHand: expectedCashOnHand,
      dueRecovery: totalDueRecovery
    };
  }, [selectedDate, shifts, products, customers, nozzles, isLube, lubePosSales]);

  // Compile daily Sales and Profit margin trend data for AreaChart
  const salesMarginTrendData = useMemo(() => {
    const dataByDate: Record<string, { date: string; Sales: number; Margin: number }> = {};

    if (isLube) {
      lubePosSales.forEach((sale) => {
        if (!dataByDate[sale.date]) {
          dataByDate[sale.date] = { date: sale.date, Sales: 0, Margin: 0 };
        }

        dataByDate[sale.date].Sales += sale.total;
        dataByDate[sale.date].Margin += sale.items.reduce((sum, item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          const marginRate = product?.type === 'lube' ? 0.22 : 0.18;
          return sum + item.lineTotal * marginRate;
        }, 0);
      });
    } else {
      const petrolProduct = products.find(p => getFuelCategory(p.id, products) === 'petrol');
      const dieselProduct = products.find(p => getFuelCategory(p.id, products) === 'diesel');
      const cngProduct = products.find(p => getFuelCategory(p.id, products) === 'cng');

      const petrolRate = petrolProduct?.rate || 272.50;
      const dieselRate = dieselProduct?.rate || 281.20;
      const cngRate = cngProduct?.rate || 210.00;

      shifts.forEach(s => {
        if (!dataByDate[s.date]) {
          dataByDate[s.date] = { date: s.date, Sales: 0, Margin: 0 };
        }

        let petrolLiters = 0;
        let dieselLiters = 0;
        let cngKgs = 0;

        nozzles.forEach(nz => {
          const open = s.openingReadings?.[nz.id] || 0;
          const close = s.closingReadings?.[nz.id] || 0;
          const diff = Math.max(0, close - open);
          const fuelCat = getFuelCategory(nz.productId, products);
          if (fuelCat === 'petrol') petrolLiters += diff;
          else if (fuelCat === 'diesel') dieselLiters += diff;
          else if (fuelCat === 'cng') cngKgs += diff;
        });

        petrolLiters = Math.max(0, petrolLiters - (s.testLiters?.petrol || 0));
        dieselLiters = Math.max(0, dieselLiters - (s.testLiters?.diesel || 0));
        cngKgs = Math.max(0, cngKgs - (s.testLiters?.cng || 0));

        const petrolSales = petrolLiters * petrolRate;
        const dieselSales = dieselLiters * dieselRate;
        const cngSales = cngKgs * cngRate;
        const lubeSalesVal = s.lubeSales?.reduce((acc, l) => acc + l.amount, 0) || 0;
        const grossShiftSales = petrolSales + dieselSales + cngSales + lubeSalesVal;
        const shiftMargin = (petrolSales + dieselSales + cngSales) * 0.045 + lubeSalesVal * 0.22;

        dataByDate[s.date].Sales += grossShiftSales;
        dataByDate[s.date].Margin += shiftMargin;
      });
    }

    if (Object.keys(dataByDate).length === 0) {
      const today = new Date().toISOString().split('T')[0];
      dataByDate[today] = { date: today, Sales: 0, Margin: 0 };
    }

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, products, nozzles, isLube, lubePosSales]);

  // Fuel/lube stock levels for indicators
  const fuelStocks = useMemo(() => {
    if (isLube) {
      return products;
    }
    return products.filter(p => p.type === 'fuel');
  }, [products, isLube]);

  const todayLubeReceipts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return lubePosSales.filter((sale) => sale.date === today);
  }, [lubePosSales]);

  // Recent feeds across logs
  const activityFeed = useMemo(() => {
    const list: Array<{ id: string; type: string; title: string; subtitle: string; amount?: number; tag: 'sale' | 'expense' | 'recovery' | 'alert'; time: string }> = [];

    // Check low stock alerts
    products.forEach(p => {
      if (p.currentStock <= p.minStock) {
        list.push({
          id: `alert_${p.id}`,
          type: 'alert',
          title: t(`Low Stock Alert: ${p.name}`, `اسٹاک الرٹ: ${p.urduName} کم ہے`),
          subtitle: `${p.currentStock} ${p.unit} remaining (Min: ${p.minStock})`,
          tag: 'alert',
          time: t('Just now', 'ابھی ابھی')
        });
      }
    });

    if (isLube) {
      const sortedSales = [...lubePosSales].sort((a, b) =>
        `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
      );

      sortedSales.slice(0, 6).forEach((sale) => {
        list.push({
          id: `lps_feed_${sale.id}`,
          type: 'sale',
          title: t(`POS Receipt: ${sale.invoiceNo}`, `پی او ایس رسید: ${sale.invoiceNo}`),
          subtitle: `${sale.customerName || t('Walk-in Customer', 'واک اِن کسٹمر')} • ${sale.paymentMode.toUpperCase()} • ${sale.items.length} ${t('items', 'آئٹمز')}`,
          amount: sale.total,
          tag: sale.paymentMode === 'credit' ? 'sale' : 'recovery',
          time: `${sale.date} ${sale.time}`
        });
      });

      return list.slice(0, 5);
    }

    // Recent shift entries (recovery, credit sales, expense)
    const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    for (const sh of sortedShifts) {
      if (count > 8) break;
      
      sh.debitEntries.forEach(d => {
        const custName = customers.find(c => c.id === d.customerId)?.name || 'Credit Account';
        const prodName = products.find(p => p.id === d.productId)?.name || 'Fuel';
        list.push({
          id: `deb_${d.id}`,
          type: 'sale',
          title: t(`Credit Sale: ${custName}`, `قرض فروخت: ${custName}`),
          subtitle: `${d.quantity}L of ${prodName} @ ${getCurrencySymbol(settings)} ${d.rate}`,
          amount: d.amount,
          tag: 'sale',
          time: sh.date
        });
        count++;
      });

      sh.recoveryEntries.forEach(r => {
        const custName = customers.find(c => c.id === r.customerId)?.name || 'Customer';
        list.push({
          id: `rec_${r.id}`,
          type: 'recovery',
          title: t(`Payment Recovery: ${custName}`, `رقم کی وصولی: ${custName}`),
          subtitle: t(`Paid via ${r.mode} ${r.reference ? `(Ref: ${r.reference})` : ''}`, `${r.mode} کے ذریعے موصول`),
          amount: r.amount,
          tag: 'recovery',
          time: sh.date
        });
        count++;
      });

      sh.expenseEntries.forEach(e => {
        list.push({
          id: `exp_${e.id}`,
          type: 'expense',
          title: t(`Expense: ${e.category.toUpperCase().replace('_', ' ')}`, `اخراجات: ${e.description || e.category}`),
          subtitle: e.description || t('Shift operation expense', 'شفٹ کا آپریشنل خرچہ'),
          amount: e.amount,
          tag: 'expense',
          time: sh.date
        });
        count++;
      });
    }

    return list.slice(0, 5);
  }, [shifts, products, customers, isLube, lubePosSales, settings]);

  // Active shift checker
  const activeShift = useMemo(() => {
    if (isLube) {
      return undefined;
    }
    return shifts.find(s => s.status === 'active');
  }, [isLube, shifts]);

  const activeStaffName = useMemo(() => {
    if (!activeShift) return '';
    return staff.find(st => st.id === activeShift.staffId)?.name || 'Operator';
  }, [activeShift, staff]);

  return (
    <div id="fuelpro_dashboard_view" className="space-y-6 pb-16 lg:pb-0">
      
      {/* HEADER SECTION WITH DATE SELECTOR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Gauge className="h-6 w-6 text-orange-600" />
            <span>
              {isLube
                ? t('Lube POS Live Dashboard', 'لیوب پی او ایس لائیو ڈیش بورڈ')
                : t('Station Live Dashboard', 'اسٹیشن لائیو ڈیش بورڈ')}
            </span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {isLube
              ? t('Track lube receipts, customer credit, fast-moving stock, and cash performance from one POS-focused screen.', 'لیوب رسیدیں، کسٹمر کریڈٹ، تیز فروخت ہونے والا اسٹاک اور کیش پرفارمنس ایک ہی پی او ایس اسکرین سے دیکھیں۔')
              : t('Monitor daily sales fuel summaries, inventory dips, and financial health counters.', 'روزانہ فیول فروخت، انوینٹری اور اسٹیشن کے مالیاتی کھاتوں کی نگرانی کریں۔')}
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="font-sans text-xs font-semibold text-slate-500 shrink-0">
            {isLube
              ? t('Select POS Date:', 'پی او ایس تاریخ منتخب کریں:')
              : t('Select Session Date:', 'تاریخ منتخب کریں:')}
          </span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 font-sans text-sm font-semibold text-slate-800 shadow-xs focus:border-orange-500 focus:outline-hidden"
          >
            {availableDates.map(date => (
              <option key={date} value={date}>
                {date === new Date().toISOString().split('T')[0] ? t('Today (Live)', 'آج کی تاریخ') : date}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ACTIVE BUSINESS STATUS TICKER */}
      {isLube ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-500 p-6 text-white shadow-md shadow-blue-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-white/10 pointer-events-none"></div>
          <div className="absolute right-1/4 -top-12 h-28 w-28 rounded-full bg-white/5 pointer-events-none"></div>

          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-sky-50/90">
              <Wrench className="h-3 w-3" />
              <span>{t('POS MODE ACTIVE', 'پی او ایس موڈ فعال')}</span>
            </span>
            <h2 className="mt-1 font-sans text-2xl font-black leading-none tracking-tight text-white sm:text-3xl">
              {t('Direct Retail Billing', 'ڈائریکٹ ریٹیل بلنگ')}
            </h2>
            <p className="block font-sans text-xs font-semibold text-sky-100/90">
              {t('Lube sales run independently from shift setup, with instant checkout and stock posting.', 'لیوب فروخت شفٹ کے بغیر چلتی ہے اور فوراً چیک آؤٹ کے ساتھ اسٹاک پوسٹ ہو جاتی ہے۔')}
            </p>
          </div>

          <div className="relative z-10 flex flex-row items-center gap-3 self-start sm:self-center">
            <span className="inline-block whitespace-nowrap rounded-full bg-white/20 px-4 py-2 text-xs font-black text-white backdrop-blur-md">
              {t(`${todayLubeReceipts.length} receipts today`, `${todayLubeReceipts.length} آج کی رسیدیں`)}
            </span>
            <button
              onClick={() => onNavigate(salesEntryView)}
              className="flex items-center gap-1 rounded-lg bg-white px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 shadow-xs transition-all hover:bg-sky-50 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <span>{t('Open POS', 'پی او ایس کھولیں')}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : activeShift ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-6 text-white shadow-md shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Visual decorative circles */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none"></div>
          <div className="absolute right-1/4 -top-12 w-28 h-28 rounded-full bg-white/5 pointer-events-none"></div>
          
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-50/90 bg-white/15 rounded-full px-3 py-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{t('ACTIVE SHIFT', 'فعال شفٹ')}</span>
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1">
              {activeStaffName}
            </h2>
            <p className="font-sans text-xs font-semibold text-orange-100/90 block">
              {t(`${activeShift.type.toUpperCase()} Shift`, `${activeShift.type === 'day' ? 'دن' : 'رات'} شفٹ`)} · {t(`Since ${activeShift.startTime}`, `آغاز بوقت ${activeShift.startTime}`)}
            </p>
          </div>

          <div className="relative z-10 flex flex-row items-center gap-3 self-start sm:self-center">
            <span className="inline-block rounded-full bg-white/20 text-white font-black text-xs px-4 py-2 backdrop-blur-md whitespace-nowrap">
              {t('In Progress', 'جاری ہے')}
            </span>
            <button
              onClick={() => onNavigate(salesEntryView)}
              className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider bg-white text-orange-600 hover:bg-orange-50 active:scale-95 transition-all rounded-lg px-4 py-2.5 shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span>{t('Manage Shift', 'رپورٹ درج کریں')}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-sans text-sm font-bold text-slate-700 leading-none">
                {t('No Active Shift Currently', 'اس وقت کوئی شفٹ شروع نہیں ہے')}
              </p>
              <p className="font-sans text-xs text-slate-500 mt-1">
                {t('Every transaction must be registered inside a running shift setup.', 'تمام تجارتی ریکارڈ درج کرنے کے لیے نئی شفٹ قائم کریں۔')}
              </p>
            </div>
          </div>
          <button
            onClick={onStartShiftQuick}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-700 transition-all cursor-pointer animate-pulse"
          >
            <Play className="h-3.5 w-3.5" />
            <span>{t('Start New Shift', 'نئی شفٹ شروع کریں')}</span>
          </button>
        </div>
      )}

      {/* REAL-TIME GAUGES */}
      <DashboardRealtimeGauges settings={settings} products={products} tanks={tanks} activeStationId={activeStationId} />

      {/* TOP SUMMARY BAR STATS CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-6">
        {/* Card 1: Sessions Sales */}
        <div 
          id="kpi_sessions_sales" 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate(salesEntryView)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(salesEntryView); }}
          className="relative overflow-hidden rounded-2xl glass p-4 pb-5 shadow-lg border border-border/50 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-orange-500/50 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          {/* Accent curve/pill border on the left */}
          <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-gradient-to-b from-orange-500 to-amber-500"></div>
          
          <div className="pl-2">
            {/* Illustrative Icon/Emoji */}
            <div className="mb-4">
              <span className="text-3xl filter drop-shadow-xs inline-block transform group-hover:rotate-6 transition-transform duration-200" role="img" aria-label={isLube ? 'pos' : 'fuel'}>
                {isLube ? '🧾' : '⛽'}
              </span>
            </div>
            
            {/* Big prominent value */}
            <div className="space-y-1 overflow-hidden">
              <h3 className="font-sans text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-none truncate group-hover:text-orange-600 transition-colors">
                {formatCurrency(Math.round(stats.totalSales), settings)}
              </h3>
              {/* Secondary label descriptor */}
              <p className="font-sans text-[11px] font-bold text-slate-405 mt-1 tracking-normal truncate">
                {isLube
                  ? t("Today's POS Sales", "آج کی پی او ایس فروخت")
                  : t("Today's Sale", "آج کی فروخت")}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Estimated Gross Profit */}
        <div 
          id="kpi_gross_profit" 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('reports')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate('reports'); }}
          className="relative overflow-hidden rounded-2xl glass p-4 pb-5 shadow-lg border border-border/50 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          {/* Accent curve/pill border on the left */}
          <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-gradient-to-b from-emerald-500 to-teal-500"></div>
          
          <div className="pl-2">
            {/* Illustrative Icon/Emoji */}
            <div className="mb-4">
              <span className="text-3xl filter drop-shadow-xs inline-block transform group-hover:rotate-6 transition-transform duration-200" role="img" aria-label="profit">💰</span>
            </div>
            
            {/* Big prominent value */}
            <div className="space-y-1 overflow-hidden">
              <h3 className="font-sans text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-none truncate group-hover:text-emerald-600 transition-colors">
                {formatCurrency(Math.round(stats.margin), settings)}
              </h3>
              {/* Secondary label descriptor */}
              <p className="font-sans text-[11px] font-bold text-slate-405 mt-1 tracking-normal truncate">
                {t("Estimated Gross Profit", "تخمینہ شدہ منافع")}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Udhar due recovery */}
        <div 
          id="kpi_udhar_recovery" 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('customers')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate('customers'); }}
          className="relative overflow-hidden rounded-2xl glass p-4 pb-5 shadow-lg border border-border/50 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {/* Accent curve/pill border on the left */}
          <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-gradient-to-b from-blue-500 to-indigo-500"></div>
          
          <div className="pl-2">
            {/* Illustrative Icon/Emoji */}
            <div className="mb-4">
              <span className="text-3xl filter drop-shadow-xs inline-block transform group-hover:rotate-6 transition-transform duration-200" role="img" aria-label="receivables">📋</span>
            </div>
            
            {/* Big prominent value */}
            <div className="space-y-1 overflow-hidden">
              <h3 className="font-sans text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-none truncate group-hover:text-blue-600 transition-colors">
                {formatCurrency(Math.round(stats.dueRecovery), settings)}
              </h3>
              {/* Secondary label descriptor */}
              <p className="font-sans text-[11px] font-bold text-slate-405 mt-1 tracking-normal truncate">
                {t("Udhar Due Recovery", "کل ادھار وصولی")}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Estimated cash on hand */}
        <div 
          id="kpi_cash_on_hand" 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('bank_cash')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate('bank_cash'); }}
          className="relative overflow-hidden rounded-2xl glass p-4 pb-5 shadow-lg border border-border/50 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-purple-500/50 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {/* Accent curve/pill border on the left */}
          <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-gradient-to-b from-purple-600 to-pink-500"></div>
          
          <div className="pl-2">
            {/* Illustrative Icon/Emoji */}
            <div className="mb-4">
              <span className="text-3xl filter drop-shadow-xs inline-block transform group-hover:rotate-6 transition-transform duration-200" role="img" aria-label="cash">🏭</span>
            </div>
            
            {/* Big prominent value */}
            <div className="space-y-1 overflow-hidden">
              <h3 className="font-sans text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-none truncate group-hover:text-purple-600 transition-colors">
                {formatCurrency(Math.round(stats.cashOnHand), settings)}
              </h3>
              {/* Secondary label descriptor */}
              <p className="font-sans text-[11px] font-bold text-slate-405 mt-1 tracking-normal truncate">
                {t("Estimated Cash On Hand", "پاس موجود کیش رقم")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRAPHS: Weekly Sales/Profit & Liquid Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <DashboardWeeklyGraph data={salesMarginTrendData} />
        <DashboardLiquidAssetsGraph cashOnHand={stats.cashOnHand} banks={banks} dueRecovery={stats.dueRecovery} />
      </div>

      <DashboardAIInsights settings={settings} shifts={shifts} />

      {/* DASHBOARD AI ASSISTANT WIDGET */}
      <DashboardAIAssistant 
        settings={settings}
        shifts={shifts}
        customers={customers}
        products={products}
        banks={banks}
      />

      {/* FUEL PRICE IMPACT/REVALUATION CARDS */}
      {!isLube && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Valuation Gain */}
          <div className="relative overflow-hidden rounded-2xl glass p-4 pb-5 shadow-lg border border-border/50 flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-emerald-500"></div>
            <div className="pl-2">
              <div className="mb-4">
                <span className="text-3xl filter drop-shadow-xs inline-block transform group-hover:rotate-6 transition-transform duration-200" role="img" aria-label="gain">📈</span>
              </div>
              <div className="space-y-1 overflow-hidden">
                <h3 className="font-sans text-base sm:text-lg lg:text-xl font-extrabold text-emerald-600 tracking-tight leading-none truncate">
                  + {formatCurrency(pricingStats.gain, settings)}
                </h3>
                <p className="font-sans text-[11px] font-bold text-slate-400 mt-1 tracking-normal truncate">
                  {t("Inventory Valuation Gain", "انوینٹری قیمت میں اضافہ منافع")}
                </p>
              </div>
            </div>
          </div>

          {/* Valuation Loss */}
          <div className="relative overflow-hidden rounded-2xl glass p-4 pb-5 shadow-lg border border-border/50 flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl hover:border-rose-500/50 transition-all duration-300 group">
            <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-rose-500"></div>
            <div className="pl-2">
              <div className="mb-4">
                <span className="text-3xl filter drop-shadow-xs inline-block transform group-hover:rotate-6 transition-transform duration-200" role="img" aria-label="loss">📉</span>
              </div>
              <div className="space-y-1 overflow-hidden">
                <h3 className="font-sans text-base sm:text-lg lg:text-xl font-extrabold text-rose-600 tracking-tight leading-none truncate">
                  - {formatCurrency(pricingStats.loss, settings)}
                </h3>
                <p className="font-sans text-[11px] font-bold text-slate-400 mt-1 tracking-normal truncate">
                  {t("Inventory Valuation Loss", "انوینٹری قیمت میں کمی نقصان")}
                </p>
              </div>
            </div>
          </div>

          {/* Net Valuation Change */}
          <div className="relative overflow-hidden rounded-2xl glass p-4 pb-5 shadow-lg border border-border/50 flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl hover:border-orange-500/50 transition-all duration-300 group">
            <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-orange-500"></div>
            <div className="pl-2">
              <div className="mb-4">
                <span className="text-3xl filter drop-shadow-xs inline-block transform group-hover:rotate-6 transition-transform duration-200" role="img" aria-label="net">📊</span>
              </div>
              <div className="space-y-1 overflow-hidden">
                <h3 className={`font-sans text-base sm:text-lg lg:text-xl font-extrabold tracking-tight leading-none truncate ${pricingStats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {pricingStats.net >= 0 ? '+' : ''}{formatCurrency(pricingStats.net, settings)}
                </h3>
                <p className="font-sans text-[11px] font-bold text-slate-400 mt-1 tracking-normal truncate">
                  {t("Net Valuation Change", "نیٹ قیمت تبدیلی اثر")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS ROW */}
      <div className="rounded-xl border border-border/50 glass p-5 shadow-md hover:shadow-lg transition-shadow">
        <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5 mb-4 uppercase tracking-wider">
          {t('Quick Entry Shortcuts', 'فوری کام کا شارٹ کٹ')}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => onNavigate(salesEntryView)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-55/40 p-4 hover:border-orange-500 hover:bg-orange-50/20 transition-all cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform">
              <RefreshCw className="h-5 w-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-700 leading-tight">
              {isLube
                ? t('Open POS', 'پی او ایس کھولیں')
                : t('Launch Shift', 'شفٹ پینل کھولیں')}
            </span>
          </button>

          <button
            onClick={() => onNavigate('expenses')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-55/40 p-4 hover:border-red-500 hover:bg-red-50/20 transition-all cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-700 leading-tight">
              {t('+ Record Expense', 'نیا خرچہ درج کریں')}
            </span>
          </button>

          <button
            onClick={() => onNavigate('customers')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-55/40 p-4 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-700 leading-tight">
              {t('+ Add Customer', 'نیا کھاتہ گاہک')}
            </span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-55/40 p-4 hover:border-teal-500 hover:bg-teal-50/20 transition-all cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 group-hover:scale-110 transition-transform">
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-700 leading-tight">
              {t('Profit & Loss Summary', 'منافع اور نقصان رپورٹ')}
            </span>
          </button>
        </div>
      </div>



      {/* FUEL STORAGE TANKS GRID (2x2 GRID + GRAPHICAL FILL RATING) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Left: Inventory Dips / Tanks */}
        <div className="rounded-xl border border-border/50 glass p-5 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              {isLube ? (
                <Wrench className="h-5 w-5 text-blue-600 animate-pulse" />
              ) : (
                <Fuel className="h-5 w-5 text-orange-600 animate-pulse" />
              )}
              <span>
                {isLube
                  ? t('Lube & Parts Stock Active Inventory Status', 'لیوب اور اسپیئر پارٹس اسٹاک کی حالت')
                  : t('Storage Tanks Active Inventory Dips', 'پٹرولیم سٹوریج ٹینکس کی حالت')}
              </span>
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className={`font-sans text-xs font-bold hover:underline flex items-center gap-1 ${
                isLube ? 'text-blue-600' : 'text-orange-600'
              }`}
            >
              <span>{t('Manage Stock', 'اسٹاک کا انتظام')}</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {fuelStocks.map(prod => {
              const capacity = prod.capacity || (isLube ? 500 : 15000);
              const fillPercentage = Math.round((prod.currentStock / capacity) * 100);
              const isLow = prod.currentStock <= prod.minStock;

              // Setup high contrast visual color
              let barColor = isLube ? 'bg-blue-500' : 'bg-orange-500';
              let textColor = isLube ? 'text-blue-600' : 'text-orange-500';
              if (!isLube) {
                if (prod.id === 'diesel') {
                  barColor = 'bg-sky-500';
                  textColor = 'text-sky-600';
                } else if (prod.id === 'cng') {
                  barColor = 'bg-teal-500';
                  textColor = 'text-teal-600';
                }
              } else {
                if (prod.id.includes('lube_1l')) {
                  barColor = 'bg-indigo-500';
                  textColor = 'text-indigo-600';
                } else if (prod.id.includes('parts_')) {
                  barColor = 'bg-emerald-500';
                  textColor = 'text-emerald-600';
                }
              }

              return (
                <div key={prod.id} className="rounded-lg border border-slate-100 p-3.5 hover:shadow-xs transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-sans text-sm font-bold text-slate-800">
                        {t(prod.name, prod.urduName)}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-400">
                        <span>{t('Capacity:', 'صلاحیت:')} {capacity.toLocaleString()} {prod.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-slate-800 block">
                        {prod.currentStock.toLocaleString()} {prod.unit}
                      </span>
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 mt-1 rounded-sm bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{t('Low Alert', 'انتباہی حد')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          <span>{t('Normal', 'نارمل')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progressive Bar Indicators */}
                  <div className="mt-3.5">
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, fillPercentage)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-sans text-[10px] font-semibold text-slate-400">
                      <span>{fillPercentage}% {t('Full', 'بھر پور')}</span>
                      <span>{getCurrencySymbol(settings)} {prod.rate}/ {prod.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Activity Log & Alerts */}
        <div className="rounded-xl border border-border/50 glass p-5 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <span>
                {isLube
                  ? t('Recent POS Activity & Alerts', 'حالیہ پی او ایس سرگرمیاں اور الرٹس')
                  : t('Recent Activity Tickers & Logs', 'حالیہ کاروباری سرگرمیاں')}
              </span>
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-sans text-[10px] font-bold text-slate-500 uppercase">
              {t('Live Feed', 'لائیو فیڈ')}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {activityFeed.length === 0 ? (
              <div className="py-6 text-center text-slate-400 font-sans text-xs">
                {isLube
                  ? t('No POS receipts or stock alerts yet. Start billing from the lube POS.', 'ابھی تک کوئی پی او ایس رسید یا اسٹاک الرٹ موجود نہیں۔ لیوب پی او ایس سے بلنگ شروع کریں۔')
                  : t('No recorded history in recent shifts. Start a shift or record transactions.', 'حالیہ شفٹوں میں کوئی تجارتی ریکارڈ نہیں پایا گیا۔')}
              </div>
            ) : (
              activityFeed.map((act) => {
                let badgeStyle = 'bg-stone-100 text-stone-600';
                if (act.tag === 'sale') badgeStyle = 'bg-emerald-50 text-emerald-600';
                else if (act.tag === 'expense') badgeStyle = 'bg-red-50 text-red-600';
                else if (act.tag === 'recovery') badgeStyle = 'bg-teal-50 text-teal-600';
                else if (act.tag === 'alert') badgeStyle = 'bg-amber-50 text-amber-600 font-bold animate-pulse';

                return (
                  <div key={act.id} className="flex gap-4 py-3.5 items-start">
                    <div className="hidden sm:block">
                      <span className={`inline-block rounded-md px-2 py-1 font-mono text-[10px] uppercase font-bold tracking-wider ${badgeStyle}`}>
                        {act.tag}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans text-sm font-bold text-slate-800 truncate">
                        {act.title}
                      </h4>
                      <p className="font-sans text-xs text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {act.subtitle}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400 mt-1 block">
                        {act.time}
                      </span>
                    </div>
                    {act.amount !== undefined && (
                      <div className="text-right flex flex-col justify-center">
                        <span className={`font-mono text-sm font-bold ${act.tag === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {act.tag === 'expense' ? '–' : '+'} {formatCurrency(act.amount, settings)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
