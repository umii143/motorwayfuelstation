import React, { useMemo } from 'react';
import { useShiftStore } from '../../../stores/useShiftStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useCustomerStore } from '../../../stores/useCustomerStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useStationStore } from '../../../stores/useStationStore';
import { generateKPIs } from '../../../services/analytics/kpiEngine';
import { generateHealthScore } from '../../../services/analytics/executiveInsights';
import { Briefcase, ChevronRight, PieChart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import RoleGuard from '../../ui/RoleGuard';
import { KPIDrillDownModal } from './KPIDrillDownModal';
import CustomerCreditDrillDownModal from './CustomerCreditDrillDownModal';
import SupplierLiabilityDrillDownModal from './SupplierLiabilityDrillDownModal';
import TreasuryDrillDownModal from './TreasuryDrillDownModal';
import InventoryDrillDownModal from './InventoryDrillDownModal';
import ProfitDrillDownModal from './ProfitDrillDownModal';
import { useSupplierStore } from '../../../stores/useSupplierStore';
import { Calendar } from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
 const shifts = useShiftStore((state) => state.shifts);
 const products = useInventoryStore((state) => state.products);
 const customers = useCustomerStore((state) => state.customers);
 const tanks = useInventoryStore((state) => state.tanks);
 const standaloneExpenses = useFinancialStore((state) => state.standaloneExpenses);
 const lubePosSales = useFinancialStore((state) => state.lubePosSales);
 const nozzles = useInventoryStore((state) => state.nozzles);
 const rateHistory = useInventoryStore((state) => state.rateHistory);
 const activeStationId = useStationStore((state) => state.activeStationId);
 const settings = useStationStore((state) => state.settings);

 const suppliers = useSupplierStore(state => state.suppliers);

 const [activeDrillDown, setActiveDrillDown] = React.useState<'revenue' | 'profit' | 'expenses' | null>(null);
 const [isCreditDrillDownOpen, setIsCreditDrillDownOpen] = React.useState(false);
 const [isSupplierDrillDownOpen, setIsSupplierDrillDownOpen] = React.useState(false);
 const [isTreasuryDrillDownOpen, setIsTreasuryDrillDownOpen] = React.useState(false);
 const [isInventoryDrillDownOpen, setIsInventoryDrillDownOpen] = React.useState(false);
 const [dateRange, setDateRange] = React.useState<{from: string, to: string}>({from: '', to: ''});

 const isUrdu = settings.language === 'ur';
 const t = (en: string, ur: string) => (isUrdu ? ur : en);

 const kpis = useMemo(() => 
 generateKPIs(shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles, rateHistory, dateRange), 
 [shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles, rateHistory, dateRange]
 );
 
 const health = useMemo(() => generateHealthScore(kpis), [kpis]);

 const totalPayables = useMemo(() => suppliers.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0), [suppliers]);
 const overdueCount = useMemo(() => suppliers.filter(s => s.balance > 1000000).length, [suppliers]);

 const translateFactorName = (name: string) => {
 switch (name) {
 case 'Revenue Growth': return t('Revenue Growth', 'آمدنی میں اضافہ');
 case 'Profit Margin': return t('Profit Margin', 'منافع کا مارجن');
 case 'Expenses to Revenue': return t('Expenses to Revenue', 'آمدنی کے مقابلے اخراجات');
 case 'Inventory Coverage': return t('Inventory Coverage', 'اسٹاک کا احاطہ');
 case 'Data Quality': return t('Data Quality', 'ڈیٹا کی کوالٹی');
 default: return name;
 }
 };

 const getHealthLabelUrdu = (label: string) => {
 switch (label) {
 case 'Excellent': return 'بہترین';
 case 'Good': return 'اچھا';
 case 'Fair': return 'مناسب';
 case 'Critical': return 'انتہائی نازک';
 default: return label;
 }
 };

 return (
 <RoleGuard allowedRoles={['Owner', 'Manager']} fallbackMessage={t('Executive Dashboard is strictly restricted.', 'ایگزیکٹو ڈیش بورڈ تک رسائی ممنوع ہے۔')}>
 <div className="space-y-6 animate-fade-in pb-12">
 <div className="flex items-center justify-between gap-3 mb-8">
 <div className="flex items-center gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-foreground shadow-lg">
 <Briefcase className="h-6 w-6" />
 </div>
 <div>
 <h1 className="text-2xl font-black text-foreground tracking-tight">
 {t('Executive Dashboard', 'ایگزیکٹو ڈیش بورڈ')}
 </h1>
 <p className="text-sm font-semibold text-muted-foreground">
 {t('Real-time Enterprise Intelligence Platform', 'ریئل ٹائم انٹرپرائز انٹیلی جنس پلیٹ فارم')}
 </p>
 </div>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
 {t('Data Integrity Score', 'ڈیٹا کی سالمیت کا اسکور')}
 </span>
 <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full mb-3">
 {kpis.dataQuality.score >= 90 ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
 <span className={`text-sm font-bold${kpis.dataQuality.score >= 90 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
 {kpis.dataQuality.score}/100
 </span>
 </div>
 </div>
 </div>

 {/* Global Date Filters */}
 <div className="premium-card p-4 border border-border flex flex-wrap items-center gap-3 mb-6 bg-card rounded-2xl">
 <div className="flex items-center gap-2">
 <Calendar className="h-5 w-5 text-indigo-500" />
 <span className="text-sm font-bold text-foreground">{t('Analysis Period:', 'تجزیہ کی مدت:')}</span>
 </div>
 <input 
 type="date" 
 value={dateRange.from}
 onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))}
 className="px-3 py-1.5 bg-subtle border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
 />
 <span className="text-muted-foreground font-medium">{t('to', 'تا')}</span>
 <input 
 type="date" 
 value={dateRange.to}
 onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))}
 className="px-3 py-1.5 bg-subtle border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
 />
 {(dateRange.from || dateRange.to) && (
 <button 
 onClick={() => setDateRange({from: '', to: ''})}
 className="ml-auto px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-slate-700 dark:hover:text-white bg-muted hover:bg-slate-200 rounded-lg transition-colors"
 >
 {t('Clear Filters', 'فلٹرز صاف کریں')}
 </button>
 )}
 </div>

 {/* Business Health Score */}
 <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
 <PieChart className="h-64 w-64" />
 </div>
 <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
 <div className="min-w-full max-w-[250px]">
 <h2 className="text-lg font-bold text-muted-foreground mb-2">{t('Business Health Score', 'کاروباری صحت کا اسکور')}</h2>
 <div className="flex items-baseline gap-4">
 <span className="text-6xl md:text-8xl font-black tracking-tighter">{health.score}</span>
 <span className="text-2xl font-bold text-muted-foreground">/ 100</span>
 </div>
 <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-card/10 px-4 py-1.5 backdrop-blur-md">
 <div className={`h-2.5 w-2.5 rounded-full${
 health.label === 'Excellent' || health.label === 'Good' ? 'bg-emerald-400' :
 health.label === 'Fair' ? 'bg-amber-400' : 'bg-red-400'
 }`} />
 <span className="text-sm font-bold">{t(health.label, getHealthLabelUrdu(health.label))} {t('Status', 'حالت')}</span>
 </div>
 </div>

 <div className="flex-1 w-full bg-card/5 p-6 rounded-2xl backdrop-blur-sm border border-border">
 <h3 className="text-sm font-bold text-muted-foreground mb-4">{t('Health Factors', 'صحت کے عوامل')}</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
 {health.factors.map(f => (
 <div key={f.name} className="flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold text-muted-foreground">{translateFactorName(f.name)}</span>
 <span className="text-xs font-bold text-muted-foreground">{f.score}/100</span>
 </div>
 <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
 <div 
 className={`h-full rounded-full${f.status === 'Positive' ? 'bg-emerald-400' : f.status === 'Negative' ? 'bg-red-400' : 'bg-amber-400'}`} 
 style={{ width: `${f.score}%` }} 
 />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Owner Command Center: Executive Recommendations */}
 {health.recommendations && health.recommendations.length > 0 && (
 <div className="bg-card rounded-3xl p-6 shadow-xl border border-border">
 <div className="flex items-center gap-3 mb-6 px-2">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
 <AlertTriangle className="h-5 w-5" />
 </div>
 <div>
 <h2 className="text-lg font-black text-white tracking-tight">{t('Owner Command Center', 'مالک کا کمانڈ سینٹر')}</h2>
 <p className="text-xs font-semibold text-muted-foreground">{t('AI-Driven Executive Recommendations', 'مصنوعی ذہانت پر مبنی ایگزیکٹو سفارشات')}</p>
 </div>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {health.recommendations.map((rec, idx) => {
 const isCritical = rec.type === 'critical';
 const isWarning = rec.type === 'warning';
 const isPositive = rec.type === 'positive';
 
 return (
 <div 
 key={idx} 
 className={`rounded-2xl p-5 border${
 isCritical ? 'bg-red-500/10 border-red-500/20' :
 isWarning ? 'bg-amber-500/10 border-amber-500/20' :
 isPositive ? 'bg-emerald-500/10 border-emerald-500/20' :
 'bg-blue-500/10 border-blue-500/20'
 }`}
 >
 <div className="flex items-start gap-3">
 <div className={`mt-0.5 shrink-0 h-2 w-2 rounded-full${
 isCritical ? 'bg-red-500' :
 isWarning ? 'bg-amber-500' :
 isPositive ? 'bg-emerald-500' :
 'bg-blue-500'
 }`} />
 <div className="space-y-2">
 <p className="text-sm font-semibold text-foreground leading-snug">
 {rec.message}
 </p>
 <p className={`text-xs font-bold${
 isCritical ? 'text-red-400' :
 isWarning ? 'text-amber-400' :
 isPositive ? 'text-emerald-400' :
 'text-blue-400'
 }`}>
 {t('Action Required:', 'کارروائی درکار ہے:')} {rec.action}
 </p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Core KPI Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
 
 {/* Revenue */}
 <div 
 className="premium-card p-6 border hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group bg-card border-border rounded-2xl"
 onClick={() => setActiveDrillDown('revenue')}
 >
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
 {t('Revenue Engine', 'آمدنی کا انجن')}
 <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
 </h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground font-semibold mb-1">
 {dateRange.from || dateRange.to ? t('Selected Period', 'منتخب مدت') : t('Lifetime', 'لائف ٹائم')} {t('Revenue', 'آمدنی')}
 </p>
 <p className="text-2xl font-black text-foreground">Rs {kpis.revenue.ytd.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 <div className="flex justify-between border-t border-border pt-3">
 <div>
 <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('MTD', 'اس مہینے')}</p>
 <p className="text-sm font-bold text-foreground">{kpis.revenue.mtd.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('Today', 'آج')}</p>
 <p className="text-sm font-bold text-foreground">{kpis.revenue.today.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Operational Profit */}
 <div 
 className="premium-card p-6 border hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group bg-card border-border rounded-2xl"
 onClick={() => setActiveDrillDown('profit')}
 >
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
 {t('Operational Profit', 'آپریشنل منافع')}
 <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
 </h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground font-semibold mb-1">
 {dateRange.from || dateRange.to ? t('Selected Period', 'منتخب مدت') : t('Lifetime', 'لائف ٹائم')} {t('Net Profit', 'خالص منافع')}
 </p>
 <p className="text-2xl font-black text-emerald-600">Rs {kpis.profit.net.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 <div className="flex justify-between border-t border-border pt-3">
 <div>
 <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('Gross Margin', 'مجموعی مارجن')}</p>
 <p className="text-sm font-bold text-foreground">{kpis.profit.marginPercent.toFixed(1)}%</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('Gross (PKR)', 'مجموعی (روپے)')}</p>
 <p className="text-sm font-bold text-foreground">{kpis.profit.gross.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Inventory Revaluation */}
 <div 
 className="premium-card p-6 border hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group bg-card border-border rounded-2xl"
 onClick={() => setIsInventoryDrillDownOpen(true)}
 >
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
 {t('Inventory Revaluation', 'اسٹاک کی قدر نو')}
 <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
 </h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground font-semibold mb-1">{t('Net Impact', 'خالص اثر')}</p>
 <p className={`text-2xl font-black${kpis.profit.inventoryRevaluation >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
 {kpis.profit.inventoryRevaluation >= 0 ? '+' : ''}Rs {kpis.profit.inventoryRevaluation.toLocaleString(undefined, {maximumFractionDigits:0})}
 </p>
 </div>
 <div className="flex justify-between border-t border-border pt-3">
 <div>
 <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('Profit Source', 'منافع کا ذریعہ')}</p>
 <p className="text-sm font-bold text-foreground">{t('Stock Holding', 'اسٹاک ہولڈنگ')}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Expenses */}
 <div 
 className="premium-card p-6 border hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group bg-card border-border rounded-2xl"
 onClick={() => setActiveDrillDown('expenses')}
 >
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
 {t('Expense Engine', 'اخراجات کا انجن')}
 <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
 </h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground font-semibold mb-1">{t('Total Expenses', 'کل اخراجات')} ({dateRange.from || dateRange.to ? t('Selected', 'منتخب') : t('Lifetime', 'لائف ٹائم')})</p>
 <p className="text-2xl font-black text-amber-600">Rs {kpis.expenses.total.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 <div className="flex justify-between border-t border-border pt-3">
 <div>
 <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('Salary Cost', 'تنخواہ')}</p>
 <p className="text-sm font-bold text-foreground">{kpis.expenses.salary.total.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('Other Cost', 'دیگر اخراجات')}</p>
 <p className="text-sm font-bold text-foreground">{(kpis.expenses.total - kpis.expenses.salary.total).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Cash Position */}
 <div className="premium-card p-6 border bg-card border-border rounded-2xl">
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t('Cash Position', 'نقدی کی صورتحال')}</h3>
 <div className="space-y-4">
 <div 
 onClick={() => setIsTreasuryDrillDownOpen(true)}
 className="cursor-pointer hover:bg-emerald-500/10 p-2 -mx-2 rounded-lg transition-colors group"
 title="Open Treasury Intelligence Center"
 >
 <p className="text-xs text-muted-foreground font-semibold mb-1 group-hover:text-emerald-600 transition-colors">{t('Net Flow', 'خالص بہاؤ')}</p>
 <p className={`text-2xl font-black${kpis.cash.position >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
 Rs {kpis.cash.position.toLocaleString(undefined, {maximumFractionDigits:0})}
 </p>
 </div>
 <div 
 onClick={() => setIsCreditDrillDownOpen(true)}
 className="flex justify-between border-t border-border pt-3 mt-3 cursor-pointer hover:bg-blue-500/10 p-2 -mx-2 rounded-lg transition-colors group"
 title="Open Credit Intelligence Center"
 >
 <div>
 <p className="text-[10px] text-muted-foreground font-bold uppercase group-hover:text-blue-500 transition-colors">{t('Credit Outstanding', 'بقایا ادھار')}</p>
 <p className="text-sm font-bold text-foreground">{kpis.credit.outstanding.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] text-muted-foreground font-bold uppercase group-hover:text-blue-500 transition-colors">{t('Collection Eff.', 'وصولی کی کارکردگی')}</p>
 <p className="text-sm font-bold text-foreground">{kpis.credit.collectionEfficiency.toFixed(1)}%</p>
 </div>
 </div>

 <div 
 onClick={() => setIsSupplierDrillDownOpen(true)}
 className="flex justify-between border-t border-border pt-3 mt-3 cursor-pointer hover:bg-amber-500/10 p-2 -mx-2 rounded-lg transition-colors group"
 title="Open Supplier Intelligence Center"
 >
 <div>
 <p className="text-[10px] text-muted-foreground font-bold uppercase group-hover:text-amber-600 transition-colors">{t('Total Payables', 'کل واجب الادا')}</p>
 <p className="text-sm font-bold text-foreground">{totalPayables.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] text-muted-foreground font-bold uppercase group-hover:text-amber-600 transition-colors">{t('Overdue', 'تاخیر شدہ')}</p>
 <p className="text-sm font-bold text-foreground">{overdueCount}</p>
 </div>
 </div>

 </div>
 </div>

 </div>

 {/* Secondary Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
 
 {/* Inventory Insights */}
 <div className="premium-card p-6 border flex items-center justify-between bg-card border-border rounded-2xl shadow-xs">
 <div>
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('Inventory Value', 'اسٹاک کی مالیت')}</h3>
 <p className="text-3xl font-black text-foreground">Rs {kpis.inventory.value.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 <div className="flex gap-2 mt-2 flex-wrap">
 <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
 {t('Potential:', 'ممکنہ:')} {kpis.inventory.potentialRevenue.toLocaleString(undefined, {maximumFractionDigits:0})}
 </p>
 <p className="text-[10px] font-bold text-muted-foreground bg-subtle px-2 py-1 rounded">
 {t('Coverage:', 'احاطہ:')} {kpis.inventory.stockCoverageDays} {t('Days', 'دن')}
 </p>
 </div>
 </div>
 <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
 <TrendingUp className="h-8 w-8" />
 </div>
 </div>

 {/* Credit Risk */}
 <div className="premium-card p-6 border flex items-center justify-between bg-card border-border rounded-2xl shadow-xs">
 <div>
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('Credit Risk Engine', 'ادھار رسک انجن')}</h3>
 <p className={`text-3xl font-black${
 kpis.credit.riskLabel === 'Low' ? 'text-emerald-500' :
 kpis.credit.riskLabel === 'Medium' ? 'text-amber-500' :
 'text-red-500'
 }`}>{t(kpis.credit.riskLabel, kpis.credit.riskLabel === 'Low' ? 'کم' : kpis.credit.riskLabel === 'Medium' ? 'متوسط' : 'زیادہ')} {t('Risk', 'رسک')}</p>
 <p className="text-xs font-bold text-muted-foreground mt-2">{kpis.credit.overdueCustomers} {t('Accounts Near Limit', 'حد کے قریب اکاؤنٹس')}</p>
 </div>
 <div className={`h-16 w-16 rounded-full flex items-center justify-center${
 kpis.credit.riskLabel === 'Low' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
 kpis.credit.riskLabel === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
 'bg-red-50 dark:bg-red-500/10 text-red-500'
 }`}>
 {kpis.credit.riskLabel === 'Low' ? <CheckCircle className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
 </div>
 </div>

 {/* Salary Analytics */}
 <div 
 className="premium-card p-6 border hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group bg-card border-border rounded-2xl shadow-xs"
 onClick={() => setActiveDrillDown('expenses')}
 >
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
 {t('Salary Analytics', 'تنخواہوں کا تجزیہ')}
 <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
 </h3>
 <div className="space-y-2">
 <p className="text-3xl font-black text-purple-600">Rs {kpis.expenses.salary.total.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
 <div className="flex justify-between items-center text-xs mt-2">
 <span className="text-muted-foreground font-bold">{t('Monthly Avg:', 'ماہانہ اوسط:')}</span>
 <span className="text-foreground font-black">Rs {kpis.expenses.salary.monthlyAvg.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
 </div>
 <div className="flex justify-between items-center text-xs">
 <span className="text-muted-foreground font-bold">{t('% of Total Exp:', 'کل اخراجات کا فیصد:')}</span>
 <span className="text-foreground font-black">{kpis.expenses.salary.percentageOfExpenses.toFixed(1)}%</span>
 </div>
 </div>
 </div>

 </div>

 </div>

 {activeDrillDown && activeDrillDown !== 'profit' && (
 <KPIDrillDownModal
 isOpen={activeDrillDown !== null}
 onClose={() => setActiveDrillDown(null)}
 kpis={kpis}
 metric={activeDrillDown}
 />
 )}

 <ProfitDrillDownModal 
 isOpen={activeDrillDown === 'profit'}
 onClose={() => setActiveDrillDown(null)}
 kpis={kpis}
 settings={settings}
 />

 <CustomerCreditDrillDownModal 
 isOpen={isCreditDrillDownOpen}
 onClose={() => setIsCreditDrillDownOpen(false)}
 customers={customers}
 shifts={shifts}
 settings={settings}
 />

 <SupplierLiabilityDrillDownModal 
 isOpen={isSupplierDrillDownOpen}
 onClose={() => setIsSupplierDrillDownOpen(false)}
 suppliers={suppliers}
 settings={settings}
 />

 <TreasuryDrillDownModal 
 isOpen={isTreasuryDrillDownOpen}
 onClose={() => setIsTreasuryDrillDownOpen(false)}
 settings={settings}
 />

 <InventoryDrillDownModal 
 isOpen={isInventoryDrillDownOpen}
 onClose={() => setIsInventoryDrillDownOpen(false)}
 settings={settings}
 />

 </RoleGuard>
 );
};

export default ExecutiveDashboard;
