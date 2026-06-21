import React, { useMemo, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Coins, Activity, PackageOpen, AlertTriangle, 
  Users, DollarSign, Wallet, ArrowRight, Search, Bell, Clock, ChevronDown, CheckCircle2,
  PlusCircle, FileText, ShoppingCart, Truck, CreditCard, Sparkles, Building, Briefcase, Info, BadgeAlert, Layers, Receipt, Plus, ShieldCheck, Zap, Cloud, Headphones, Phone
} from 'lucide-react';
import { LiveClock } from '../ui/LiveClock';
import { DeferredWidget } from '../ui/DeferredWidget';
import { 
  GlobalSettings, LubePosSale, Product, Customer, Supplier, BankAccount, StockTransaction 
} from '../../types';
import { formatCurrency } from '../../lib/currency';

const LazyLubeSparklineChart = React.lazy(() => import('./charts/LubeSparklineChart'));
const LazyLubeCashFlowChart = React.lazy(() => import('./charts/LubeCashFlowChart'));

interface LubeDashboardProps {
  settings: GlobalSettings;
  activeStationId: string;
  lubePosSales: LubePosSale[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  stockTxns: StockTransaction[];
  onNavigate: (view: string) => void;
}

// LUXURY ENTERPRISE ANIMATION VARIANTS
const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

export default React.memo(function LubeDashboard({
  settings,
  lubePosSales,
  products,
  customers,
  suppliers,
  banks,
  stockTxns,
  onNavigate
}: LubeDashboardProps) {

  const [timeRange, setTimeRange] = useState('today');

  // --- DATE HELPERS ---
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // --- 1. CORE DATA CALCULATIONS ---
  const stats = useMemo(() => {
    const todaySales = lubePosSales.filter(s => s.date === todayStr);
    const yesterdaySales = lubePosSales.filter(s => s.date === yesterdayStr);

    const calcSalesProfit = (sales: LubePosSale[]) => {
      let revenue = 0;
      let profit = 0;
      let itemsSold = 0;
      
      sales.forEach(sale => {
        revenue += sale.total;
        sale.items.forEach(item => {
          itemsSold += item.quantity;
          const product = products.find(p => p.id === item.productId);
          const cost = product?.purchasePrice || product?.rate || 0;
          profit += (item.unitPrice - cost) * item.quantity;
        });
      });
      return { revenue, profit, itemsSold };
    };

    const todayStats = calcSalesProfit(todaySales);
    const yesterdayStats = calcSalesProfit(yesterdaySales);

    const calcGrowth = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
    const revenueGrowth = calcGrowth(todayStats.revenue, yesterdayStats.revenue);
    const profitGrowth = calcGrowth(todayStats.profit, yesterdayStats.profit);

    const uniqueCustomersToday = new Set(todaySales.map(s => s.customerId || s.customerName || 'Walk-in')).size;
    const avgInvoice = todaySales.length > 0 ? todayStats.revenue / todaySales.length : 0;

    const totalCash = banks.reduce((sum, b) => sum + b.balance, 0);
    const totalReceivables = customers.reduce((sum, c) => c.balance > 0 ? sum + c.balance : sum, 0);
    const totalPayables = suppliers.reduce((sum, s) => s.balance > 0 ? sum + s.balance : sum, 0); 
    const netPosition = totalCash + totalReceivables - totalPayables;

    const topDebtors = [...customers].filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5);
    const topSuppliers = [...suppliers].filter(s => s.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5);

    let totalInvValue = 0;
    const lowStockItems: Product[] = [];
    const outOfStockItems: Product[] = [];
    const deadStockItems: Product[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const recentSalesProductIds = new Set<string>();
    lubePosSales.filter(s => s.date >= thirtyDaysAgoStr).forEach(s => {
      s.items.forEach(item => recentSalesProductIds.add(item.productId));
    });

    products.forEach(p => {
      totalInvValue += p.currentStock * (p.purchasePrice || p.rate);
      if (p.currentStock <= 0) {
        outOfStockItems.push(p);
      } else if (p.currentStock <= p.minStock) {
        lowStockItems.push(p);
      }
      
      if (p.currentStock > 0 && !recentSalesProductIds.has(p.id)) {
        deadStockItems.push(p);
      }
    });

    const healthyCount = products.length - lowStockItems.length - outOfStockItems.length - deadStockItems.length;
    const healthyPct = products.length > 0 ? Math.round((Math.max(0, healthyCount) / products.length) * 100) : 100;

    // Health Scores
    const recoveryRate = customers.length === 0 ? 100 : Math.round((customers.filter(c => c.balance <= 0).length / customers.length) * 100);
    let bizScore = Math.round((Math.min(100, Math.max(0, 50 + revenueGrowth)) + healthyPct + recoveryRate) / 3);
    if (isNaN(bizScore)) bizScore = 100;

    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map(date => {
      const dailySales = lubePosSales.filter(s => s.date === date);
      const { revenue, profit } = calcSalesProfit(dailySales);
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        sales: revenue,
        profit: Math.max(0, profit)
      };
    });

    const productAgg: Record<string, { name: string, revenue: number, qty: number, profit: number }> = {};
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = product?.purchasePrice || product?.rate || 0;
        const profit = (item.unitPrice - cost) * item.quantity;
        
        if (!productAgg[item.productId]) {
          productAgg[item.productId] = { name: item.productName, revenue: 0, qty: 0, profit: 0 };
        }
        productAgg[item.productId].revenue += item.lineTotal;
        productAgg[item.productId].qty += item.quantity;
        productAgg[item.productId].profit += profit;
      });
    });

    const topProductsToday = Object.values(productAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const customerAgg: Record<string, number> = {};
    todaySales.forEach(sale => {
      const name = sale.customerName || 'Walk-in';
      customerAgg[name] = (customerAgg[name] || 0) + sale.total;
    });
    const topCustomer = Object.entries(customerAgg).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    const feed = [
      ...lubePosSales.slice(0, 10).map(s => ({
        id: s.id,
        type: 'sale',
        title: `Sale Completed`,
        desc: s.customerName ? `To ${s.customerName}` : 'Walk-in Customer',
        amount: formatCurrency(s.total, settings),
        date: s.date,
        time: s.time || '12:00 PM',
        timestamp: new Date(`${s.date} ${s.time || '12:00 PM'}`).getTime(),
        icon: ShoppingCart,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20'
      })),
      ...(stockTxns || []).slice(0, 10).map(tx => {
        const prod = products.find(p => p.id === tx.itemId);
        return {
          id: tx.id,
          type: 'stock',
          title: tx.type === 'receipt' ? 'Stock Added' : 'Stock Adjusted',
          desc: `${prod?.name || 'Item'} (${tx.quantity})`,
          amount: '',
          date: tx.date,
          time: '10:00 AM',
          timestamp: new Date(`${tx.date} 10:00 AM`).getTime(),
          icon: tx.type === 'receipt' ? Truck : Layers,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20'
        };
      })
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

    // AI Assistant Recommendations
    const aiActions = [];
    if (topDebtors.length > 0) {
      aiActions.push(`Collect ${formatCurrency(topDebtors[0].balance, settings)} from ${topDebtors[0].name.split(' ')[0]}`);
    }
    if (lowStockItems.length > 0) {
      aiActions.push(`Restock ${lowStockItems[0].name.substring(0, 15)}...`);
    } else if (outOfStockItems.length > 0) {
      aiActions.push(`Critical: Restock ${outOfStockItems[0].name.substring(0, 15)}`);
    }
    if (topSuppliers.length > 0) {
      aiActions.push(`Pay ${topSuppliers[0].name.split(' ')[0]} in 2 days`);
    }

    const alerts = [];
    if (outOfStockItems.length > 0) alerts.push({ type: 'danger', msg: `🔴 ${outOfStockItems[0]?.name} is completely Out of Stock.` });
    if (lowStockItems.length > 0) alerts.push({ type: 'warning', msg: `🟠 ${lowStockItems[0]?.name} stock is below minimum.` });
    if (topDebtors.length > 0 && topDebtors[0].balance > 10000) alerts.push({ type: 'danger', msg: `🔴 Customer ${topDebtors[0].name} owes ${formatCurrency(topDebtors[0].balance, settings)}.` });
    if (topSuppliers.length > 0 && topSuppliers[0].balance > 50000) alerts.push({ type: 'warning', msg: `🟠 Supplier ${topSuppliers[0].name} payment due.` });

    return {
      todayStats,
      revenueGrowth,
      profitGrowth,
      todayOrders: todaySales.length,
      uniqueCustomersToday,
      avgInvoice,
      totalCash,
      totalReceivables,
      totalPayables,
      netPosition,
      topDebtors,
      topSuppliers,
      totalInvValue,
      healthyPct,
      bizScore,
      recoveryRate,
      outOfStockCount: outOfStockItems.length,
      lowStockCount: lowStockItems.length,
      deadStockCount: deadStockItems.length,
      chartData,
      topProductsToday,
      topCustomer,
      alerts,
      feed,
      aiActions
    };

  }, [lubePosSales, products, customers, suppliers, banks, stockTxns, todayStr, yesterdayStr, settings]);


  // --- DYNAMIC CSS HIERARCHY (LUXURY ENTERPRISE 10/10) ---
  const themeWrap = "min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-500/30 overflow-x-hidden pb-32 relative transition-colors duration-500";
  
  // Layer 1: Base components (Hero, Command Centers) -> 75% Dark, 25% Contrast
  const glassLayer1 = "backdrop-blur-[40px] bg-white/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_80px_rgba(0,0,0,0.4)] rounded-[32px] relative overflow-hidden transition-all duration-300";
  
  // THE 10/10 LIQUID GLASS KPI CAPSULE
  const liquidGlass = "relative overflow-hidden backdrop-blur-[30px] saturate-[150%] bg-white/65 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] border border-white/80 dark:border-white/[0.08] shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_80px_rgba(0,0,0,0.6)] rounded-[32px] transition-all duration-500 group";
  const liquidGlassHover = "hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(255,255,255,0.3)]";
  
  // Layer 3: Inner recessed areas
  const glassLayer3 = "backdrop-blur-[20px] bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] shadow-[inset_0_2px_4px_rgb(0,0,0,0.02)] dark:shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] rounded-[24px] transition-colors duration-300";

  // Dock Layer
  const dockLayer = "fixed bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-[60px] bg-white/80 dark:bg-[#111827]/80 border border-slate-200/60 dark:border-white/[0.15] shadow-[0_20px_80px_rgb(0,0,0,0.15)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_40px_100px_rgba(0,0,0,0.9)] rounded-[2rem] px-3 py-3 flex items-center gap-1 z-[100] transition-transform duration-300 hover:scale-[1.02] transform-gpu";

  const textSubtle = "text-slate-500 dark:text-slate-400";
  const textPrimary = "text-slate-900 dark:text-white";
  const textValue = "text-slate-800 dark:text-white";

  // Circle Math for Inventory Ring
  const circleRadius = 24;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (stats.healthyPct / 100) * circleCircumference;

  return (
    <div className={themeWrap}>
      
      {/* DYNAMIC AMBIENT BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[8000ms]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-orange-500/20 dark:bg-orange-600/10 rounded-full blur-[160px] mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      {/* 1. HEADER */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 z-50 relative"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[0_10px_20px_rgba(249,115,22,0.4)] border border-orange-400/50 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_30px_rgba(249,115,22,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/0 via-white/50 to-white/0"></div>
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${textPrimary} drop-shadow-sm dark:drop-shadow-md`}>
              {settings.stationName || 'LubeManager Pro'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] relative">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                </span>
                Operational
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <LiveClock className={`text-xs font-semibold ${textSubtle} flex items-center gap-1.5`} iconClassName="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/50 dark:bg-white/[0.05] hover:bg-white/80 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 rounded-full text-sm font-semibold transition-colors backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <span className={textPrimary}>Branch: Main</span>
            <ChevronDown className={`w-4 h-4 ${textSubtle}`} />
          </button>
          <button className="p-2.5 bg-white/50 dark:bg-white/[0.05] hover:bg-white/80 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 rounded-full transition-colors backdrop-blur-xl relative shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <Bell className={`w-4 h-4 text-slate-600 dark:text-slate-300`} />
            {stats.alerts.length > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#030712] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
            )}
          </button>
        </div>
      </motion.header>

      <motion.div 
        variants={containerVariant}
        initial="hidden"
        animate="visible"
        className="px-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10"
      >
        {/* ========================================================= */}
        {/* ROW 1: HERO CARD & SMART INSIGHTS */}
        {/* ========================================================= */}
        <motion.div variants={itemVariant} className={`md:col-span-8 ${glassLayer1} p-8 flex flex-col justify-between overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/[0.02] to-transparent pointer-events-none"></div>
          
          <div className="flex justify-between items-start relative z-10 mb-6">
            <h2 className={`text-[10px] font-black ${textSubtle} uppercase tracking-[0.2em]`}>Today's Performance</h2>
            <div className="px-3 py-1 bg-white/50 dark:bg-white/[0.03] rounded-full border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm dark:shadow-inner flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Business Health: {stats.bizScore}%
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8 relative z-10">
            <div>
              <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${textSubtle}`}>Gross Revenue</div>
              <div className={`text-4xl sm:text-5xl font-black tracking-tight ${textValue} drop-shadow-sm dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                {formatCurrency(stats.todayStats.revenue, settings)}
              </div>
            </div>
            <div>
              <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${textSubtle}`}>Net Profit</div>
              <div className={`text-3xl sm:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 drop-shadow-sm dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                {formatCurrency(stats.todayStats.profit, settings)}
              </div>
            </div>
            <div>
              <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${textSubtle}`}>Sales Volume</div>
              <div className={`text-3xl sm:text-4xl font-black tracking-tight ${textValue} drop-shadow-sm dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                {stats.todayOrders} <span className="text-lg text-slate-400 font-medium">orders</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.05] grid grid-cols-3 gap-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl flex items-center justify-center border shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${stats.revenueGrowth >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'}`}>
                {stats.revenueGrowth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
              </div>
              <div>
                <div className={`text-[10px] uppercase tracking-wider mb-0.5 ${textSubtle}`}>Growth</div>
                <div className={`text-sm font-bold flex items-center gap-1 ${stats.revenueGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% vs yesterday
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-200 dark:border-indigo-500/20 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="24" className="stroke-indigo-200 dark:stroke-indigo-900" strokeWidth="4" fill="none" />
                  <circle cx="26" cy="26" r="24" className="stroke-indigo-500 dark:stroke-indigo-400" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }} />
                </svg>
                <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{stats.healthyPct}%</div>
              </div>
              <div>
                <div className={`text-[10px] uppercase tracking-wider mb-0.5 ${textSubtle}`}>Inventory Health</div>
                <div className={`text-sm font-bold ${stats.healthyPct >= 80 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {stats.healthyPct >= 80 ? 'Healthy Ring' : 'Needs Action'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] uppercase tracking-wider mb-0.5 ${textSubtle}`}>Recovery Rate</div>
                <div className={`text-sm font-bold ${stats.recoveryRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {stats.recoveryRate}% Customers Paid
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI ASSISTANT PANEL */}
        <motion.div variants={itemVariant} className={`md:col-span-4 ${glassLayer1} p-8 relative overflow-hidden flex flex-col`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none"></div>
          <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${textSubtle}`}>
            <div className="relative">
              <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400 relative z-10" />
              <span className="absolute inset-0 bg-indigo-500 blur-sm animate-pulse opacity-50"></span>
            </div>
            AI Assistant
          </h2>
          
          <div className="flex-1 flex flex-col justify-center">
            {stats.aiActions.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div className={`text-sm font-bold mb-1 ${textPrimary}`}>System is optimized</div>
                <div className={`text-xs font-medium ${textSubtle}`}>No critical actions needed right now.</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`text-xs font-bold ${textPrimary}`}>Recommended Actions</div>
                {stats.aiActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 group cursor-pointer">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] group-hover:scale-150 transition-transform"></div>
                    <div className={`text-sm font-medium ${textSubtle} group-hover:text-white transition-colors`}>
                      {action}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* ROW 2: 10/10 LIQUID GLASS KPI CAPSULES */}
        {/* ========================================================= */}
        <motion.div variants={itemVariant} className={`md:col-span-3 ${liquidGlass} ${liquidGlassHover} p-6 flex flex-col justify-between h-[180px]`}>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className={`text-[10px] font-black uppercase tracking-widest ${textSubtle} group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors`}>Cash Position</div>
            <div className="p-2 bg-white/80 dark:bg-white/[0.05] border border-white/50 dark:border-white/10 rounded-[14px] text-slate-500 dark:text-white shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"><Wallet className="w-4 h-4" /></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className={`text-3xl font-black drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${textValue}`}>
              {formatCurrency(stats.totalCash, settings)}
            </div>
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> <span className="relative"><span className="absolute inset-0 bg-emerald-500 blur-md opacity-30 animate-pulse"></span>↗ 12%</span>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-20 opacity-40 dark:opacity-50 pointer-events-none translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
             <Suspense fallback={<div className="w-full h-full animate-pulse bg-white/5"></div>}>
               <LazyLubeSparklineChart data={stats.chartData} dataKey="sales" color="#10b981" />
             </Suspense>
          </div>
        </motion.div>

        <motion.div variants={itemVariant} className={`md:col-span-3 ${liquidGlass} ${liquidGlassHover} p-6 flex flex-col justify-between h-[180px] cursor-pointer`} onClick={() => onNavigate('customers')}>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className={`text-[10px] font-black uppercase tracking-widest ${textSubtle} group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors`}>Receivables</div>
            <div className="p-2 bg-white/80 dark:bg-white/[0.05] border border-white/50 dark:border-white/10 rounded-[14px] text-amber-500 dark:text-white shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"><Briefcase className="w-4 h-4" /></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className={`text-3xl font-black drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${textValue}`}>
              {formatCurrency(stats.totalReceivables, settings)}
            </div>
            <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1">
              {stats.topDebtors.length} Overdue Accounts
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariant} className={`md:col-span-3 ${liquidGlass} ${liquidGlassHover} p-6 flex flex-col justify-between h-[180px] cursor-pointer`} onClick={() => onNavigate('inventory')}>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className={`text-[10px] font-black uppercase tracking-widest ${textSubtle} group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors`}>Inventory Value</div>
            <div className="p-2 bg-white/80 dark:bg-white/[0.05] border border-white/50 dark:border-white/10 rounded-[14px] text-indigo-500 dark:text-white shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"><PackageOpen className="w-4 h-4" /></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className={`text-3xl font-black drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${textValue}`}>
              {formatCurrency(stats.totalInvValue, settings)}
            </div>
            <div className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              {stats.healthyPct}% Stock Health
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariant} className={`md:col-span-3 ${liquidGlass} ${liquidGlassHover} p-6 flex flex-col justify-between h-[180px]`}>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className={`text-[10px] font-black uppercase tracking-widest ${textSubtle} group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors`}>Profit Margin</div>
            <div className="p-2 bg-white/80 dark:bg-white/[0.05] border border-white/50 dark:border-white/10 rounded-[14px] text-emerald-500 dark:text-white shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className={`text-3xl font-black drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${textValue}`}>
              {stats.todayStats.revenue > 0 ? ((stats.todayStats.profit / stats.todayStats.revenue) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 ${stats.profitGrowth >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
              {stats.profitGrowth >= 0 ? '+' : ''}{stats.profitGrowth.toFixed(1)}% vs yesterday
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 opacity-40 dark:opacity-50 pointer-events-none translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
             <Suspense fallback={<div className="w-full h-full animate-pulse bg-white/5"></div>}>
               <LazyLubeSparklineChart data={stats.chartData} dataKey="profit" color={stats.profitGrowth >= 0 ? "#10b981" : "#ef4444"} />
             </Suspense>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* ROW 3: INTELLIGENCE CENTERS & ACTIVITY */}
        {/* ========================================================= */}
        
        {/* Financial Command Center */}
        <DeferredWidget delay={300} className="md:col-span-4" skeleton={<div className={`h-[300px] ${glassLayer1} animate-pulse bg-white/5`}></div>}>
          <motion.div variants={itemVariant} className={`${glassLayer1} p-6 h-full`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-sm font-bold flex items-center gap-2 drop-shadow-sm ${textPrimary}`}>
              <Building className={`w-4 h-4 ${textSubtle}`} />
              Financial Center
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className={`p-4 ${glassLayer3} flex justify-between items-center`}>
              <span className={`text-xs font-medium ${textSubtle}`}>Net Position</span>
              <span className={`font-black ${stats.netPosition >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(stats.netPosition, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm px-2">
              <span className={textSubtle}>Cash Available</span>
              <span className={`font-bold ${textValue}`}>{formatCurrency(stats.totalCash, settings)}</span>
            </div>
            <div className="flex justify-between items-center text-sm px-2">
              <span className={textSubtle}>Total Receivables</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stats.totalReceivables, settings)}</span>
            </div>
            <div className="flex justify-between items-center text-sm px-2">
              <span className={textSubtle}>Total Payables</span>
              <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.totalPayables, settings)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <button onClick={() => onNavigate('customers')} className="py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-transparent text-xs font-bold transition-colors shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                Collect Dues
              </button>
              <button onClick={() => onNavigate('suppliers')} className="py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-transparent text-xs font-bold transition-colors shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                Pay Suppliers
              </button>
            </div>
          </div>
          </motion.div>
        </DeferredWidget>

        {/* Chart (With Smaller Empty State) */}
        <DeferredWidget delay={600} className="md:col-span-8" skeleton={<div className={`h-[300px] ${glassLayer1} animate-pulse bg-white/5`}></div>}>
          <motion.div variants={itemVariant} className={`${glassLayer1} p-6 h-full`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-sm font-bold flex items-center gap-2 drop-shadow-sm ${textPrimary}`}>
              <Activity className={`w-4 h-4 ${textSubtle}`} />
              Cash Flow Analytics (7 Days)
            </h3>
            <div className={`flex gap-3 text-[10px] font-bold ${textSubtle}`}>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div> Sales</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> Profit</span>
            </div>
          </div>
          <div className="w-full">
            {stats.chartData.every(d => d.sales === 0) ? (
              <div className="w-full h-[120px] flex flex-col items-center justify-center text-sm border border-dashed rounded-[24px] font-medium shadow-inner text-slate-400 border-slate-300 bg-slate-100/50 dark:text-slate-500 dark:border-white/10 dark:bg-[#030712]/30">
                <Activity className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-slate-600 dark:text-slate-400 font-bold">No transaction history yet</span>
                <span className="text-xs mt-1">Create sales to unlock cash flow analytics.</span>
              </div>
            ) : (
              <div className="h-[210px] w-full">
                 <Suspense fallback={<div className="w-full h-full flex items-center justify-center animate-pulse bg-slate-100/50 dark:bg-white/5 rounded-2xl"></div>}>
                   <LazyLubeCashFlowChart data={stats.chartData} settings={settings} />
                 </Suspense>
              </div>
            )}
          </div>
        </motion.div>
        </DeferredWidget>

        {/* ========================================================= */}
        {/* ROW 4: ALERTS & LEADERBOARDS */}
        {/* ========================================================= */}

        {/* Real-Time Activity Feed */}
        <DeferredWidget delay={900} className="md:col-span-4 flex flex-col" skeleton={<div className={`h-[300px] ${glassLayer1} animate-pulse bg-white/5`}></div>}>
          <motion.div variants={itemVariant} className={`${glassLayer1} p-6 h-full flex flex-col`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-sm font-bold flex items-center gap-2 drop-shadow-sm ${textPrimary}`}>
              <Activity className={`w-4 h-4 ${textSubtle}`} />
              Real-Time Feed
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[250px] scrollbar-hide">
            {stats.feed.length === 0 ? (
              <div className="w-full h-full min-h-[150px] flex flex-col items-center justify-center text-sm border border-dashed rounded-[24px] font-medium shadow-inner text-slate-400 border-slate-300 bg-slate-100/50 dark:text-slate-500 dark:border-white/10 dark:bg-[#030712]/30">
                <Clock className="w-6 h-6 mb-2 opacity-50" />
                <span>No activity recorded today</span>
              </div>
            ) : (
              stats.feed.map((item, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] p-2 -m-2 rounded-xl transition-colors">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm dark:shadow-inner ${item.bg} ${item.color}`}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    {i !== stats.feed.length - 1 && <div className="w-px h-8 bg-slate-200 dark:bg-white/[0.05] mt-2"></div>}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex justify-between items-start">
                      <div className={`text-sm font-bold group-hover:text-orange-500 transition-colors ${textPrimary}`}>{item.title}</div>
                      <div className={`text-[10px] font-bold ${textSubtle}`}>{item.time}</div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className={`text-xs ${textSubtle}`}>{item.desc}</div>
                      <div className={`text-xs font-bold ${item.color}`}>{item.amount}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        </DeferredWidget>

        {/* AI Business Assistant */}
        <DeferredWidget delay={900} className="md:col-span-8 flex flex-col" skeleton={<div className={`h-[300px] ${glassLayer1} animate-pulse bg-white/5`}></div>}>
          <motion.div variants={itemVariant} className={`${glassLayer1} p-6 h-full flex flex-col justify-between`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-sm font-bold flex items-center gap-2 drop-shadow-sm ${textPrimary}`}>
              <BadgeAlert className={`w-4 h-4 ${textSubtle}`} />
              Top Products Leaderboard
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topProductsToday.length === 0 ? (
              <div className="col-span-2 w-full h-[150px] flex flex-col items-center justify-center text-sm border border-dashed rounded-[24px] font-medium shadow-inner text-slate-400 border-slate-300 bg-slate-100/50 dark:text-slate-500 dark:border-white/10 dark:bg-[#030712]/30">
                <PackageOpen className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-slate-600 dark:text-slate-400 font-bold">No products sold today</span>
              </div>
            ) : (
              stats.topProductsToday.map((prod, idx) => (
                <div key={idx} className={`flex items-center gap-4 group ${glassLayer3} p-3 rounded-2xl transition-colors cursor-pointer hover:bg-white/50 dark:hover:bg-white/[0.05]`}>
                  <div className="text-lg font-black text-slate-400 dark:text-slate-600 w-4 text-center group-hover:text-orange-500 transition-colors">#{idx+1}</div>
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#030712] border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0 shadow-sm dark:shadow-inner">
                    <PackageOpen className={`w-5 h-5 ${textSubtle}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate group-hover:text-orange-500 transition-colors ${textPrimary}`}>{prod.name}</div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{prod.qty} units sold</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-black ${textValue}`}>{formatCurrency(prod.revenue, settings)}</div>
                    <div className={`text-[10px] font-semibold ${textSubtle}`}>Profit: {formatCurrency(prod.profit, settings)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* ROW 5: BRANDING & SUPPORT FOOTER */}
        {/* ========================================================= */}
        <motion.div variants={itemVariant} className={`md:col-span-12 ${glassLayer1} p-6 flex flex-col md:flex-row items-center justify-between gap-8 mt-2 mb-12`}>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* Left: Branding */}
          <div className="flex flex-col items-start gap-2">
            <div className={`text-[10px] font-black tracking-widest ${textSubtle} uppercase`}>Powered By</div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xl font-black tracking-tighter ${textPrimary}`}>UMAR ALI</span>
              <Zap className="w-5 h-5 text-orange-500 fill-orange-500 drop-shadow-[0_2px_10px_rgba(249,115,22,0.8)]" />
            </div>
            <div className="mt-1 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Phone className="w-4 h-4" /> 0316-8432329
            </div>
          </div>

          {/* Middle: Features */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center text-center gap-1">
              <ShieldCheck className="w-6 h-6 text-orange-500 mb-1 drop-shadow-[0_2px_8px_rgba(249,115,22,0.5)]" />
              <div className="text-[10px] font-black text-orange-500 tracking-wider uppercase">Fast & Secure</div>
              <div className={`text-[10px] font-medium leading-tight ${textSubtle}`}>Your data is always<br/>protected</div>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <Cloud className="w-6 h-6 text-orange-500 mb-1 drop-shadow-[0_2px_8px_rgba(249,115,22,0.5)]" />
              <div className="text-[10px] font-black text-orange-500 tracking-wider uppercase">Cloud Sync</div>
              <div className={`text-[10px] font-medium leading-tight ${textSubtle}`}>Real-time backup and<br/>sync</div>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <Headphones className="w-6 h-6 text-orange-500 mb-1 drop-shadow-[0_2px_8px_rgba(249,115,22,0.5)]" />
              <div className="text-[10px] font-black text-orange-500 tracking-wider uppercase">24/7 Support</div>
              <div className={`text-[10px] font-medium leading-tight ${textSubtle}`}>We are always here to<br/>help</div>
            </div>
          </div>

          {/* Right: Version */}
          <div className="flex items-center">
            <div className="px-4 py-2 rounded-[14px] bg-white/50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs font-black text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              V2.5
            </div>
          </div>
        </motion.div>
        </DeferredWidget>

      </motion.div>

      {/* ========================================================= */}
      {/* MAC-OS STYLE QUICK ACTION DOCK (ALWAYS VISIBLE) */}
      {/* ========================================================= */}
      <div className={dockLayer}>
        <button onClick={() => onNavigate('lube_pos')} className="group flex flex-col items-center justify-center w-14 h-14 rounded-[1.25rem] bg-gradient-to-b from-orange-500 to-orange-600 border border-orange-400/50 shadow-[0_10px_20px_rgba(249,115,22,0.3)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_20px_rgba(249,115,22,0.4)] hover:scale-110 hover:-translate-y-2 transition-all duration-300 mx-1">
          <Plus className="w-6 h-6 text-white drop-shadow-md" />
        </button>
        <div className="w-px h-10 bg-slate-300 dark:bg-white/10 mx-1 shadow-none dark:shadow-[1px_0_0_rgba(0,0,0,0.5)]"></div>
        <button onClick={() => onNavigate('customers')} className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-[1.25rem] bg-white/70 dark:bg-white/[0.05] border border-white/80 dark:border-white/10 shadow-[0_4px_12px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white dark:hover:bg-white/[0.1] hover:scale-110 hover:-translate-y-2 transition-all duration-300 mx-1" title="Customers">
          <Users className="w-6 h-6 text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white drop-shadow-sm" />
        </button>
        <button onClick={() => onNavigate('inventory')} className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-[1.25rem] bg-white/70 dark:bg-white/[0.05] border border-white/80 dark:border-white/10 shadow-[0_4px_12px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white dark:hover:bg-white/[0.1] hover:scale-110 hover:-translate-y-2 transition-all duration-300 mx-1" title="Inventory">
          <PackageOpen className="w-6 h-6 text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white drop-shadow-sm" />
        </button>
        <button onClick={() => onNavigate('expenses')} className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-[1.25rem] bg-white/70 dark:bg-white/[0.05] border border-white/80 dark:border-white/10 shadow-[0_4px_12px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white dark:hover:bg-white/[0.1] hover:scale-110 hover:-translate-y-2 transition-all duration-300 mx-1" title="Expenses">
          <Receipt className="w-6 h-6 text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white drop-shadow-sm" />
        </button>
        <button onClick={() => onNavigate('stock_purchases')} className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-[1.25rem] bg-white/70 dark:bg-white/[0.05] border border-white/80 dark:border-white/10 shadow-[0_4px_12px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white dark:hover:bg-white/[0.1] hover:scale-110 hover:-translate-y-2 transition-all duration-300 mx-1" title="Purchases">
          <Truck className="w-6 h-6 text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white drop-shadow-sm" />
        </button>
      </div>

    </div>
  );
});
