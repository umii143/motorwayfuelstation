/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ResponsiveTable, TableColumn } from '../shared/ResponsiveTable';
import {
 FileBarChart2,
 Calendar,
 Layers,
 Coins,
 TrendingUp,
 FileText,
 Printer,
 Share2,
 DollarSign,
 Package,
 Users,
 CheckCircle,
 Eye,
 Percent,
 TrendingDown,
 Activity,
 AlertCircle,
 HelpCircle,
 Clock,
 Search,
 ArrowUpDown,
 ChevronDown,
 ChevronRight,
 Download,
 Filter,
 Shield,
 Sliders,
 Sparkles,
 ArrowLeft
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import {
 ResponsiveContainer,
 AreaChart,
 Area,
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 Legend,
 PieChart,
 Pie,
 Cell
} from 'recharts';
import { Shift, Product, Customer, Supplier, ExpenseEntry, GlobalSettings, Tank, RateHistoryEntry, StaffFinanceEntry, AttendanceRecord, Staff, Nozzle, BankAccount, DigitalAccount } from '../../types';
import { REPORT_TEMPLATES, ReportRow, ReportTemplate } from '../../lib/reportCompilers';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { db } from '../../data/db';
import { fetchWithAuth } from '../../lib/api';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { logger } from '../../lib/logger';
import AdvancedReportsHub from './AdvancedReportsHub';
import RoznamchaVisualizer from './RoznamchaVisualizer';
import UnifiedRoznamcha from './UnifiedRoznamcha';
import DrilldownExplorer from './DrilldownExplorer';
import CommandCenter from './CommandCenter';
import ShiftIntelligenceReport from './ShiftIntelligenceReport';

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

interface ReportsProps {
 activeStationId: string;
 settings: GlobalSettings;
 shifts: Shift[];
 products: Product[];
 customers: Customer[];
 suppliers: Supplier[];
 standaloneExpenses: ExpenseEntry[];
 tanks: Tank[];
 rateHistory: RateHistoryEntry[];
 staffFinance: StaffFinanceEntry[];
 attendance: AttendanceRecord[];
 staff: Staff[];
 nozzles: Nozzle[];
 banks?: BankAccount[];
 digitalAccounts?: DigitalAccount[];
}

export default function Reports({
 activeStationId,
 settings,
 shifts,
 products,
 customers,
 suppliers,
 standaloneExpenses,
 tanks = [],
 rateHistory = [],
 staffFinance = [],
 attendance = [],
 staff = [],
 nozzles = [],
 banks = [],
 digitalAccounts = []
}: ReportsProps) {
 const isUrdu = settings.language === 'ur';
 const t = (en: string, ur: string) => (isUrdu ? ur : en);

 // Fuel Station / CNG Reports (Lube business uses LubeReports component)

 // States
 const [activeReportTab, setActiveReportTab] = useState<'command_center' | 'sales_pnl' | 'corporate_audit' | 'party_outstanding' | 'inventory_audit' | 'shift_sheets' | 'reconciliation' | 'activity_register' | 'shift_intelligence'>('command_center');
 const [activeDrilldown, setActiveDrilldown] = useState<any | null>(null);
 const [selectedHistoricalShiftId, setSelectedHistoricalShiftId] = useState<string | null>(null);

 const cogsRecords = useInventoryStore(useShallow(state => state.cogsRecords));

 // Reconciled Shift IDs state
 const [reconciledShiftIds, setReconciledShiftIds] = useState<string[]>(() =>
 db.getReconciledShiftIds(activeStationId)
 );
 const [prevStationId, setPrevStationId] = useState(activeStationId);

 if (activeStationId !== prevStationId) {
 setPrevStationId(activeStationId);
 setReconciledShiftIds(db.getReconciledShiftIds(activeStationId));
 }

 const handleToggleReconcile = (shiftId: string) => {
 const isReconciled = reconciledShiftIds.includes(shiftId);
 let updated: string[];
 if (isReconciled) {
 updated = reconciledShiftIds.filter(id => id !== shiftId);
 } else {
 updated = [...reconciledShiftIds, shiftId];
 }
 setReconciledShiftIds(updated);
 db.saveReconciledShiftIds(activeStationId, updated);
 };



 // Color palette for charts
 const FUEL_COLORS = ['#FF6B00', '#00C49A', '#1A1A2E'];

 // All Expenses union
 const consolidatedExpenses = useMemo(() => {
 const list: { category: string; amount: number; description: string; date: string; paidFrom: string }[] = [];
 standaloneExpenses.forEach(exp => {
 list.push({
 category: exp.category || 'Uncategorized',
 amount: exp.amount,
 description: exp.description || '',
 date: exp.date || '',
 paidFrom: exp.paidFrom
 });
 });
 shifts.forEach(s => {
 s.expenseEntries.forEach(e => {
 list.push({
 category: e.category || 'Uncategorized',
 amount: e.amount,
 description: e.description || '',
 date: s.date || '',
 paidFrom: 'cash'
 });
 });
 });
 staffFinance.filter(f => f.type === 'issue').forEach(sf => {
 list.push({
 category: 'payroll',
 amount: sf.amount,
 description: `${t('Crew salary payout to', 'تنخواہ کی ادائیگی برائے')}: ${staff.find(s => s.id === sf.staffId)?.name || sf.staffId}`,
 date: sf.date,
 paidFrom: sf.mode || 'cash'
 });
 });
 return list;
 }, [shifts, standaloneExpenses, staffFinance, staff, t]);

 const pricingRevaluationImpact = useMemo(() => {
 return rateHistory.reduce((sum, entry) => sum + (entry.impactAmount || 0), 0);
 }, [rateHistory]);

 // Aggregate stats per date for visual Area Chart
 const statsTimelineData = useMemo(() => {
 const dataByDate: Record<string, { date: string; Sales: number; Profit: number; Expense: number }> = {};
 const petrolProduct = products.find(p => getFuelCategory(p.id, products) === 'petrol');
 const dieselProduct = products.find(p => getFuelCategory(p.id, products) === 'diesel');
 const cngProduct = products.find(p => getFuelCategory(p.id, products) === 'cng');

 const petrolRate = petrolProduct?.rate || 272.50;
 const dieselRate = dieselProduct?.rate || 281.20;
 const cngRate = cngProduct?.rate || 205.00;

 shifts.forEach(s => {
 if (!dataByDate[s.date]) {
 dataByDate[s.date] = { date: s.date, Sales: 0, Profit: 0, Expense: 0 };
 }
 let pLiters = 0;
 let dLiters = 0;
 let cKgs = 0;

 nozzles.forEach(nz => {
 const open = s.openingReadings?.[nz.id] || 0;
 const close = s.closingReadings?.[nz.id] || 0;
 const diff = Math.max(0, close - open);
 const fuelCat = getFuelCategory(nz.productId, products);
 if (fuelCat === 'petrol') pLiters += diff;
 else if (fuelCat === 'diesel') dLiters += diff;
 else if (fuelCat === 'cng') cKgs += diff;
 });

 pLiters = Math.max(0, pLiters - (s.testLiters?.petrol || 0));
 dLiters = Math.max(0, dLiters - (s.testLiters?.diesel || 0));
 cKgs = Math.max(0, cKgs - (s.testLiters?.cng || 0));

 const pSales = pLiters * petrolRate;
 const dSales = dLiters * dieselRate;
 const cSales = cKgs * cngRate;
 const shiftSales = pSales + dSales + cSales;
 const shiftMargin = shiftSales * 0.045;

 dataByDate[s.date].Sales += shiftSales;
 dataByDate[s.date].Profit += shiftMargin;
 });

 consolidatedExpenses.forEach(exp => {
 if (!dataByDate[exp.date]) {
 dataByDate[exp.date] = { date: exp.date, Sales: 0, Profit: 0, Expense: 0 };
 }
 dataByDate[exp.date].Expense += exp.amount;
 });

 return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
 }, [shifts, products, consolidatedExpenses, nozzles]);

 const fuelSalesVolData = useMemo(() => {
 let petrolLiters = 0;
 let dieselLiters = 0;
 let cngKgs = 0;

 shifts.forEach(s => {
 let p = 0;
 let d = 0;
 let c = 0;

 nozzles.forEach(nz => {
 const open = s.openingReadings?.[nz.id] || 0;
 const close = s.closingReadings?.[nz.id] || 0;
 const diff = Math.max(0, close - open);
 const fuelCat = getFuelCategory(nz.productId, products);
 if (fuelCat === 'petrol') p += diff;
 else if (fuelCat === 'diesel') d += diff;
 else if (fuelCat === 'cng') c += diff;
 });

 petrolLiters += Math.max(0, p - (s.testLiters?.petrol || 0));
 dieselLiters += Math.max(0, d - (s.testLiters?.diesel || 0));
 cngKgs += Math.max(0, c - (s.testLiters?.cng || 0));
 });

 return [
 { name: t('Super Petrol', 'پٹرول PMU'), Litres: petrolLiters },
 { name: t('HSD Diesel', 'ڈیزل HSD'), Litres: dieselLiters },
 { name: t('CNG Gas', 'سی این جی'), Litres: cngKgs }
 ];
 }, [shifts, nozzles, products, t]);

 const summaryTotals = useMemo(() => {
 const totalSales = statsTimelineData.reduce((sum, item) => sum + item.Sales, 0);
 const totalProfit = statsTimelineData.reduce((sum, item) => sum + item.Profit, 0) + pricingRevaluationImpact;
 const totalExpense = statsTimelineData.reduce((sum, item) => sum + item.Expense, 0);
 const netEarning = totalProfit - totalExpense;

 return {
 totalSales,
 totalProfit,
 totalExpense,
 netEarning
 };
 }, [statsTimelineData, pricingRevaluationImpact]);

 // Active Selected Historical Shift
 const activeShiftToReceipt = useMemo(() => {
 if (!selectedHistoricalShiftId) return null;
 return shifts.find(s => s.id === selectedHistoricalShiftId) || null;
 }, [selectedHistoricalShiftId, shifts]);





 if (activeDrilldown) {
 return (
 <DrilldownExplorer
 settings={settings}
 initialView={activeDrilldown}
 onClose={() => setActiveDrilldown(null)}
 />
 );
 }

 return (
 <div className="space-y-6 pb-20 lg:pb-5">

 {/* HEADER SECTION */}
 <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-border pb-4">
 <div>
 <h2 className="font-sans text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
 <FileBarChart2 className="h-6 w-6 text-orange-600" />
 <span>{t('Certified Master Audit & Reports Module', 'ماسٹر آڈٹ رپورٹس اور گوشوارے')}</span>
 </h2>
 <p className="font-sans text-xs text-muted-foreground mt-1">
 {t('Traceable accounting ledger of every shift, customer recovery, refinery purchase and staff advances.', 'ہر ٹرانزیکشن، کسٹمر کی ریکوری اور سپلائر کی ادائیگیاں آڈٹ کرنے کا خودکار نظام۔')}
 </p>
 </div>

 {/* Global Print trigger */}
 <button
 onClick={() => window.print()}
 className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 font-sans text-xs font-bold text-foreground shadow-xs hover:bg-slate-50 transition-all cursor-pointer self-start sm:self-center"
 >
 <Printer className="h-4 w-4" />
 <span>{t('Print Dashboard Page', 'صفحہ پرنٹ کریں')}</span>
 </button>
 </div>

 {/* TABS SELECTOR */}
 <div className="flex overflow-x-auto gap-2 border-b border-border pb-2 whitespace-nowrap custom-horizontal-scrollbar" data-horizontal-scroll="true">
 {[
 { id: 'command_center', label: '🛡️ Operations Command Center', urdu: '🛡️ آپریشنز کمانڈ سینٹر' },
 { id: 'corporate_audit', label: '📊 Corporate Audits (50+ Reports)', urdu: '📊 کارپوریٹ آڈٹ لسٹ (50+ رپورٹیں)' },
 { id: 'activity_register', label: '📝 Digital Roznamcha Ledger', urdu: '📝 ڈیجیٹل روزنامچہ رجسٹر آڈٹ' },
 { id: 'sales_pnl', label: '📈 Visual Fuel Dashboard', urdu: '📈 گرافیکل سیلز گراف اور چارٹ' },
 { id: 'party_outstanding', label: '👥 Party Outstanding List', urdu: '👥 گاہک بقایا کھاتہ لسٹ' },
 { id: 'inventory_audit', label: '🛢️ Storage Tanks Status', urdu: '🛢️ ٹینکس اسٹاک موازنہ' },
 { id: 'shift_sheets', label: '📋 Finalized Shift Receipts', urdu: '📋 شفٹ فائنل رسیدیں' },
 { id: 'shift_intelligence', label: '🧾 Enterprise Shift Intelligence', urdu: '🧾 شفٹ انٹیلی جنس رپورٹ' },
 { id: 'reconciliation', label: '🏦 Bank Reconciliation Tool', urdu: '🏦 بینک اور ڈیجیٹل موازنہ' }
 ].map(tb => (
 <button
 key={tb.id}
 onClick={() => setActiveReportTab(tb.id as any)}
 className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0${
 activeReportTab === tb.id
 ? 'border-orange-600 text-orange-600 font-extrabold'
 : 'border-transparent text-slate-500 hover:text-foreground'
 }`}
 >
 {t(tb.label, tb.urdu)}
 </button>
 ))}
 </div>


 {/* ========================================================
 COMMAND CENTER LANDING VIEW
 ======================================================== */}
 {activeReportTab === 'command_center' && (
 <CommandCenter
 settings={settings}
 shifts={shifts}
 products={products}
 staff={staff}
 onSelectTab={(tabId) => setActiveReportTab(tabId as any)}
 onTriggerDrilldown={(params) => setActiveDrilldown(params)}
 />
 )}

 {/* ========================================================
 NEW VIEW: 50+ CORPORATE REPORT GENERATION CONSOLE
 ======================================================== */}
 {activeReportTab === 'corporate_audit' && (
 <AdvancedReportsHub
 settings={settings}
 shifts={shifts}
 products={products}
 staff={staff}
 />
 )}

 {activeReportTab === 'activity_register' && (
 <RoznamchaVisualizer
 settings={settings}
 />
 )}

 {/* ========================================================
 REPORT VIEW 1: SALES & PNL & GRAPHICAL CHARTS
 ======================================================== */}
 {activeReportTab === 'sales_pnl' && (
 <div className="space-y-6">
 
 {/* Bento box summary widgets row with 5 indicators */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-5">
 
 <div 
 onClick={() => setActiveDrilldown({ title: 'BI Explorer > Sales', type: 'sales', level: 1, params: {} })}
 className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-500 hover:shadow-md transition-all"
 >
 <span className="font-sans text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Summed Period Sales', 'کل سیشنز فروخت رقم')}</span>
 <strong className="font-mono text-base font-bold text-foreground tracking-tight mt-1.5 block">
 {formatCurrency(summaryTotals.totalSales, settings)}
 </strong>
 </div>

 <div 
 onClick={() => setActiveDrilldown({ title: 'BI Explorer > Sales', type: 'sales', level: 1, params: {} })}
 className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-500 hover:shadow-md transition-all"
 >
 <span className="font-sans text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Estimated Gross Margin', 'تخمینہ منافع مارجن')}</span>
 <strong className="font-mono text-base font-bold text-emerald-600 tracking-tight mt-1.5 block">
 {formatCurrency(summaryTotals.totalProfit, settings)}
 </strong>
 </div>

 <div 
 onClick={() => setActiveDrilldown({ title: 'BI Explorer > Sales', type: 'sales', level: 1, params: {} })}
 className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-500 hover:shadow-md transition-all"
 >
 <span className="font-sans text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Revaluation Impact', 'ریٹ تبدیلی نفع/نقصان')}</span>
 <strong className={`font-mono text-base font-bold tracking-tight mt-1.5 block${pricingRevaluationImpact >= 0 ? 'text-teal-605' : 'text-red-500'}`}>
 {pricingRevaluationImpact >= 0 ? '+' : ''}{formatCurrency(pricingRevaluationImpact, settings)}
 </strong>
 </div>

 <div 
 onClick={() => setActiveDrilldown({ title: 'BI Explorer > Expenses', type: 'expenses', level: 1, params: {} })}
 className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-500 hover:shadow-md transition-all"
 >
 <span className="font-sans text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Conjoined Expenses', 'مجموعی اخراجات مع تنخواہ')}</span>
 <strong className="font-mono text-base font-bold text-red-650 tracking-tight mt-1.5 block">
 {formatCurrency(summaryTotals.totalExpense, settings)}
 </strong>
 </div>

 <div 
 onClick={() => setActiveDrilldown({ title: 'BI Explorer > Sales', type: 'sales', level: 1, params: {} })}
 className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-500 hover:shadow-md transition-all"
 >
 <span className="font-sans text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Net Earnings', 'خالص آمدنی')}</span>
 <strong className={`font-mono text-base font-extrabold tracking-tight mt-1.5 block${summaryTotals.netEarning >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
 {formatCurrency(summaryTotals.netEarning, settings)}
 </strong>
 </div>

 </div>

 {/* DYNAMICAL CHARTS MATRIX */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
 {/* 1. Daily Sales timeline charts */}
 <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border pb-2 mb-3">
 <TrendingUp className="h-4 w-4 text-orange-500" />
 <span>{t('Daily Inflows vs Margin Profit Performance', 'یومیہ آمدنی بمقابلہ منافع گراف')}</span>
 </h3>
 
 {statsTimelineData.length === 0 ? (
 <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-xs">
 {t('Establish shifts or save expenses to plot visual graphs.', 'چارٹ لوڈ کرنے کے لیے ٹرانزیکشن کارروائی درج کیجئے')}
 </div>
 ) : (
 <div className="h-64 w-full text-xs font-mono">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={statsTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
 <defs>
 <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
 <XAxis dataKey="date" stroke="#94A3B8" />
 <YAxis stroke="#94A3B8" />
 <Tooltip formatter={(value: any) => formatCurrency(Number(value), settings)} />
 <Legend />
 <Area type="monotone" dataKey="Sales" stroke="#FF6B00" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name={t('Gross Sales', 'فروخت رقم')} />
 <Area type="monotone" dataKey="Profit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name={t('Margin Profit', 'تخمینہ منافع')} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 )}
 </div>

 {/* 2. Fuel Volumetric Distributions sold */}
 <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border pb-2 mb-3">
 <Package className="h-4 w-4 text-sky-500" />
 <span>{t('Absolute Fuel Litres Volume Pumped', 'کل پمپ شدہ فیول کا حجم بلحاظ لیٹر')}</span>
 </h3>

 {shifts.length === 0 ? (
 <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-xs">
 {t('No volumetric fuels finalized in shift readings.', 'لیٹر موازنہ گراف لوڈ کرنے کے لیے شفٹ فائنل انٹری کیجئے۔')}
 </div>
 ) : (
 <div className="h-64 w-full text-xs font-sans">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={fuelSalesVolData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
 <XAxis dataKey="name" stroke="#94A3B8" />
 <YAxis stroke="#94A3B8" />
 <Tooltip formatter={(v) => `${Number(v).toLocaleString()} Litres`} />
 <Legend />
 <Bar dataKey="Litres" fill="#1E293B" radius={[4, 4, 0, 0]} name={t('Sold Litres', 'فروخت لیٹر')} >
 {fuelSalesVolData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={FUEL_COLORS[index % FUEL_COLORS.length]} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 )}
 </div>

 </div>

 </div>
 )}


 {/* ========================================================
 REPORT VIEW 2: PARTY OUTSTANDING RECEIVABLES
 ======================================================== */}
 {activeReportTab === 'party_outstanding' && (
 <div className="space-y-6">
 
 <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
 <h3 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 mb-3 flex items-center justify-between">
 <span>{t('Party wise Outstanding Receivable Statement', 'صارفین اور گاہکوں کے بقایاجات کی فہرست')}</span>
 <span className="font-mono text-xs font-bold text-muted-foreground">
 {t('Total Active Debtors:', 'کل گاہک بقایا کھاتہ دار:')} {customers.length}
 </span>
 </h3>

 <div className="overflow-x-auto rounded-lg border border-border">
 <ResponsiveTable
 data={customers}
 columns={[
 {
 header: t('Party Name', 'نام کھاتہ دار'),
 accessor: (cust) => <span className="font-bold text-foreground">{t(cust.name, cust.urduName)}</span>,
 isPrimaryMobile: true
 },
 {
 header: t('Contact Phone', 'موبائل نمبر'),
 accessor: (cust) => <span className="font-mono font-semibold text-muted-foreground">{cust.contact}</span>,
 isSecondaryMobile: true
 },
 {
 header: t('Operational Block Address', 'مقام/پتہ'),
 accessor: (cust) => <span className="text-muted-foreground font-medium">{cust.address || 'Karachi, Pakistan'}</span>
 },
 {
 header: t('Credit Cap Limit', 'قرض مقرر حد'),
 className: 'text-right',
 accessor: (cust) => <span className="font-mono text-muted-foreground">{formatCurrency(cust.creditLimit, settings)}</span>
 },
 {
 header: t('Account Balance', 'بک بقایا رقم'),
 className: 'text-right',
 accessor: (cust) => {
 const isOwed = cust.balance > 0;
 return <span className={`font-mono font-extrabold${isOwed ? 'text-red-650' : 'text-emerald-705'}`}>{formatCurrency(cust.balance, settings)}</span>;
 }
 }
 ]}
 keyExtractor={(cust) => cust.id}
 emptyMessage={t('No customers registered yet.', 'توجہ فرمائیں! کوئی پارٹی رجسٹر نہیں کی گئی۔')}
 />
 </div>
 </div>

 </div>
 )}


 {/* ========================================================
 REPORT VIEW 3: INVENTORY AUDIT & STORAGE TANK MEASUREMENTS
 ======================================================== */}
 {activeReportTab === 'inventory_audit' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 
 {/* INVENTORY TABLE LEFT PANEL (2/3) */}
 <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
 <h3 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 mb-3">
 {t('Bulk Storage Levels & Status Auditing', 'پٹرولیم ٹینک اور پراڈکٹس اسٹاک والیم')}
 </h3>

 <div className="overflow-x-auto rounded-lg border border-border">
 <ResponsiveTable
 data={products}
 onRowClick={(prod) => setActiveDrilldown({ title: `BI Explorer > Inventory > ${prod.name}`, type: 'inventory', level: 3, params: { productId: prod.id } })}
 columns={[
 {
 header: t('Product Grade Name', 'پراڈکٹ ٹائپ'),
 accessor: (prod) => <span className="font-bold text-foreground">{t(prod.name, prod.urduName)}</span>,
 isPrimaryMobile: true
 },
 {
 header: t('Fuel/Lube Category', 'قسم'),
 accessor: (prod) => <span className="font-semibold text-muted-foreground capitalize">{prod.type}</span>,
 isSecondaryMobile: true
 },
 {
 header: t('Current Active Stock', 'موجودہ اسٹاک والیم'),
 className: 'text-right',
 accessor: (prod) => {
 const isLow = prod.currentStock <= prod.minStock;
 return <span className={`font-mono font-bold${isLow ? 'text-rose-600 font-extrabold' : 'text-foreground'}`}>{prod.currentStock.toLocaleString()} {prod.unit}</span>;
 }
 },
 {
 header: t('Low Alert Threshold', 'کم سے کم الرٹ حد'),
 className: 'text-right',
 accessor: (prod) => <span className="font-mono text-muted-foreground">{prod.minStock.toLocaleString()} {prod.unit}</span>
 },
 {
 header: t('Max Storage Capacity', 'زیادہ سے زیادہ گنجائش'),
 className: 'text-right',
 accessor: (prod) => <span className="font-mono text-muted-foreground">{prod.capacity ? `${prod.capacity.toLocaleString()} ${prod.unit}` : 'N/A'}</span>
 },
 {
 header: t('Unit rate (PKR)', 'موجودہ ریٹ فی لیٹر'),
 className: 'text-right',
 accessor: (prod) => <span className="font-mono font-bold text-emerald-700">{formatCurrency(prod.rate, settings)}</span>
 }
 ]}
 keyExtractor={(prod) => prod.id}
 />
 </div>
 </div>

 {/* STORAGE TANKS FAST SYNC GAUGES SIDE PANEL (1/3) */}
 <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-3">
 {t('Physical Storage Tanks Status', 'سٹوریج ٹینک مانیٹرنگ')}
 </h3>

 <div className="space-y-4">
 {tanks.length === 0 ? (
 <p className="py-8 text-center text-muted-foreground text-xs font-sans">
 {t('No tanks configured.', 'کوئی ٹینک کنفیگرڈ نہیں ہے۔')}
 </p>
 ) : (
 tanks.map(tnk => {
 const fillPct = Math.round((tnk.currentStock / tnk.capacity) * 100);
 const isUnderCritical = tnk.currentStock < tnk.criticalLevel;

 return (
 <div 
 key={tnk.id} 
 onClick={() => setActiveDrilldown({ title: `BI Explorer > Tanks > ${tnk.name}`, type: 'tanks', level: 2, params: { tankId: tnk.id } })}
 className="text-xs space-y-1.5 border-b border-border pb-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-card/5 p-2 rounded-lg transition-all"
 >
 <div className="flex justify-between font-sans">
 <strong className="text-foreground font-extrabold">{tnk.name} ({tnk.physicalLabel || 'General'})</strong>
 <span className={`font-semibold${isUnderCritical ? 'text-red-500' : 'text-teal-650'}`}>{fillPct}% Full</span>
 </div>
 <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
 <div
 style={{ width: `${Math.min(100, fillPct)}%` }}
 className={`h-full rounded-full${isUnderCritical ? 'bg-red-500' : 'bg-teal-500'}`}
 />
 </div>
 <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-1">
 <span>Stock: {tnk.currentStock.toLocaleString()} L</span>
 <span>Cap: {tnk.capacity.toLocaleString()} L</span>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 </div>
 </div>
 )}


 {/* ========================================================
 REPORT VIEW 4: FINALIZED SHIFT STATEMENT INVOICES / RECEIPTS
 ======================================================== */}
 {activeReportTab === 'shift_sheets' && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* List of past shifts archived */}
 <div className={`space-y-3.5${selectedHistoricalShiftId ? 'hidden lg:block' : 'block'}`}>
 <h4 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 block">
 {t('Select Shift session receipt:', 'شفٹ روزنامچہ منتخب کریں:')}
 </h4>

 <div className="space-y-2 max-h-[460px] overflow-y-auto">
 {shifts.length === 0 ? (
 <EmptyState
 icon={Clock}
 title={t('No archived shifts found.', 'کوئی فائنل شدہ شفٹ انٹری نہیں ملی۔')}
 description={t('Shifts appear here once they are started, reconciled, and closed.', 'روزنامچہ کی رپورٹ دیکھنے کے لیے پہلے شفٹ وزرڈ سے ایکٹو شفٹ شروع اور کلوز کریں۔')}
 />
 ) : (
 [...shifts].reverse().map(sh => (
 <button
 key={sh.id}
 onClick={() => setSelectedHistoricalShiftId(sh.id)}
 className={`w-full text-left rounded-xl border p-4 shadow-xs transition-colors block cursor-pointer${
 selectedHistoricalShiftId === sh.id
 ? 'border-orange-500 bg-orange-50/20'
 : 'border-border bg-card hover:border-border'
 }`}
 >
 <div className="flex justify-between items-center">
 <strong className="font-sans text-xs font-bold text-foreground uppercase">
 {t(`Shift #${sh.id} Final Slip`, `شفٹ رسید نمبر #${sh.id}`)}
 </strong>
 <span className="font-mono text-[10px] text-muted-foreground font-semibold uppercase bg-muted px-2 py-0.5 rounded-sm">
 {sh.type}
 </span>
 </div>

 <span className="font-mono text-[10px] text-muted-foreground tracking-tight block mt-2">
 📆 Date: {sh.date} ({sh.startTime} - {sh.endTime || 'Closed'})
 </span>
 <span className="font-sans text-[10px] text-muted-foreground font-semibold block mt-1">
 👤 Operator Count: {sh.status.toUpperCase()}
 </span>
 </button>
 ))
 )}
 </div>
 </div>

 {/* Graphical custom invoice template render */}
 <div className={`lg:col-span-2${!selectedHistoricalShiftId ? 'hidden lg:block' : 'block'}`}>
 {selectedHistoricalShiftId && (
 <button
 onClick={() => setSelectedHistoricalShiftId(null)}
 className="lg:hidden mb-4 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
 >
 <ArrowLeft className="h-4 w-4" />
 <span>{t('Back to Shifts List', 'شفٹ لسٹ پر واپس جائیں')}</span>
 </button>
 )}
 {activeShiftToReceipt ? (
 <div className="rounded-xl border border-border bg-card shadow-md p-6 space-y-6 relative" id="print-area">
 
 <div className="flex flex-col items-center justify-center border-b-2 border-border pb-5 text-center">
 <h3 className="font-sans text-xl font-bold text-foreground uppercase tracking-tight">{settings.stationName}</h3>
 <h4 className="font-sans text-lg font-semibold text-foreground font-urdu mt-1">{settings.stationUrduName}</h4>
 <p className="font-sans text-[11px] text-muted-foreground tracking-tight mt-1">{settings.address} | NTN: {settings.ntn}</p>
 </div>

 {/* Sub Metadata rows */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border pb-4 text-xs font-sans text-muted-foreground">
 <div>
 <span className="block font-bold">Shift ID: <span className="font-mono font-semibold">#{activeShiftToReceipt.id}</span></span>
 <span className="block mt-1">Date: <span className="font-semibold">{activeShiftToReceipt.date}</span></span>
 <span className="block mt-1">Type: <span className="font-semibold uppercase">{activeShiftToReceipt.type}</span></span>
 </div>
 <div className="text-right">
 <span className="block">Start: <span className="font-semibold">{activeShiftToReceipt.startTime}</span></span>
 <span className="block mt-1">End: <span className="font-semibold">{activeShiftToReceipt.endTime}</span></span>
 <span className="block mt-1">Status: <span className="font-bold text-emerald-600 uppercase">{activeShiftToReceipt.status.toUpperCase()}</span></span>
 </div>
 </div>

 {/* Financial reconciles */}
 <div className="space-y-4">
 <strong className="font-sans text-xs font-bold text-foreground uppercase block border-b border-border pb-2">
 {t('Final Cash Audit Sheet Summary', 'حتمی کیش گوشوارہ پڑتال')}
 </strong>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
 <div className="rounded-lg bg-subtle p-3 space-y-1.5 border border-border">
 <span className="text-muted-foreground font-semibold block">{t('EXPECTED COMPUTED CASH:', 'حسابی کیش ہونا چاہیۓ تھا:')}</span>
 <strong className="font-mono text-sm font-bold text-foreground">{formatCurrency(activeShiftToReceipt.expectedCash, settings)}</strong>
 </div>

 <div className="rounded-lg bg-orange-55/10 p-3 space-y-1.5 border border-orange-100">
 <span className="text-orange-600 font-semibold block">{t('SUBMITTED PHYSICAL CASH:', 'وصول شدہ فزیکل کیش:')}</span>
 <strong className="font-mono text-sm font-bold text-orange-700">{formatCurrency(activeShiftToReceipt.submittedCash, settings)}</strong>
 </div>
 </div>

 {activeShiftToReceipt.shortage > 0 ? (
 <div className="rounded-lg p-3 bg-red-50 border border-red-100 font-sans text-xs text-red-700 font-bold flex items-center gap-2">
 <span>⚠️ {t(`Operator Shortage Detected: ${formatCurrency(activeShiftToReceipt.shortage, settings)}`, `کیش میں کمی (شارٹیج): ${formatCurrency(activeShiftToReceipt.shortage, settings)}`)}</span>
 </div>
 ) : activeShiftToReceipt.overage > 0 ? (
 <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-100 font-sans text-xs text-emerald-700 font-bold flex items-center gap-2">
 <span>✅ {t(`Excess Overage Collected: ${formatCurrency(activeShiftToReceipt.overage, settings)}`, `کیش میں زیادتی (فالتو): ${formatCurrency(activeShiftToReceipt.overage, settings)}`)}</span>
 </div>
 ) : (
 <div className="rounded-lg p-3 bg-teal-50 border border-teal-100 font-sans text-xs text-teal-700 font-bold flex items-center gap-2">
 <span>✅ {t('Shift audit completely tally! Zero discrepancy.', 'کیش موازنہ بالکل برابر ہے۔')}</span>
 </div>
 )}
 </div>

 <div className="pt-4 border-t border-border flex justify-end gap-2">
 <button
 onClick={() => {
 const printContents = document.getElementById('print-area')?.innerHTML;
 const originalContents = document.body.innerHTML;
 if (printContents) {
 document.body.innerHTML = printContents;
 window.print();
 document.body.innerHTML = originalContents;
 window.location.reload();
 }
 }}
 className="flex items-center gap-1.5 rounded-lg bg-card text-foreground font-sans text-xs font-bold px-4 py-2 hover:bg-slate-900 transition-colors cursor-pointer"
 >
 <Printer className="h-3.5 w-3.5" />
 <span>{t('Print final shift slip receipt', 'شفٹ بل رسید پرنٹ کریں')}</span>
 </button>
 </div>

 </div>
 ) : (
 <div className="h-full rounded-xl border border-dashed border-border py-32 text-center text-slate-450 font-sans text-xs flex flex-col justify-center items-center gap-3 bg-card/20">
 <FileText className="h-10 w-10 text-slate-350" />
 <span>{t('Select an archived finalized shift to render the invoice slip layout.', 'بائیں پینل سے کسی فائنل کردہ شفٹ روزنامچہ رسید کا انتخاب کریں')}</span>
 </div>
 )}
 </div>

 </div>
 )}

 {/* ========================================================
 REPORT VIEW: ENTERPRISE SHIFT INTELLIGENCE REPORT
 ======================================================== */}
 {activeReportTab === 'shift_intelligence' && (
 <ShiftIntelligenceReport
 settings={settings}
 shifts={shifts}
 products={products}
 staff={staff}
 customers={customers}
 suppliers={suppliers}
 banks={banks || []}
 digitalAccounts={digitalAccounts || []}
 nozzles={nozzles}
 tanks={tanks}
 lubePosSales={[]}
 rateHistory={rateHistory}
 cogsRecords={cogsRecords}
 />
 )}

 {/* ========================================================
 REPORT VIEW 5: CHANNELS & BANK RECONCILIATION AUDITING CONSOLE
 ======================================================== */}
 {activeReportTab === 'reconciliation' && (
 <div className="space-y-6">
 <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
 <div>
 <h3 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider">
 {t('Double-Entry Bank & Digital reconciliation audit panel', 'ڈبل انٹری بینک اور ڈیجیٹل بقایا تصفیہ اور ریکنسیلیشن')}
 </h3>
 <p className="font-sans text-xs text-muted-foreground mt-1">
 {t('Audit shift digital sales against bank cash deposits, spot-check variance logs, and settle discrepancies.', 'موبائل والٹ پر کی گئی ڈیجیٹل سیلز کا بینک میں نقد جمع کرائی گئی رقم کے ساتھ آڈٹ اور تصفیہ کا خودکار نظام۔')}
 </p>
 </div>
 </div>

 {/* Aggregated indicators */}
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-card p-4 rounded-xl border border-border">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Total Shifts Logged', 'کل شفٹ ریکارڈز')}</span>
 <strong className="font-mono text-lg font-bold text-foreground block mt-1">{shifts.length}</strong>
 </div>
 <div className="bg-card p-4 rounded-xl border border-border">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Reconciled & Settle (✓)', 'تصفیہ شدہ شفٹس')}</span>
 <strong className="font-mono text-lg font-bold text-emerald-600 block mt-1">{reconciledShiftIds.length}</strong>
 </div>
 <div className="bg-card p-4 rounded-xl border border-border">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Unreconciled Audits (✕)', 'زیر التوا آڈٹس')}</span>
 <strong className="font-mono text-lg font-bold text-amber-600 block mt-1">{shifts.length - reconciledShiftIds.length}</strong>
 </div>
 <div className="bg-card p-4 rounded-xl border border-border">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-snug">{t('Master Bank Balance', 'مجموعی بینک بیلنس')}</span>
 <strong className="font-mono text-lg font-bold text-blue-600 block mt-1">
 {formatCurrency(banks.reduce((sum, b) => sum + b.balance, 0), settings)}
 </strong>
 </div>
 </div>

 {/* Main Reconciliation comparison table */}
 <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
 <h4 className="font-sans text-xs font-bold text-slate-550 uppercase tracking-wider border-b border-border pb-2">
 {t('Shift-by-Shift Cash Verification Sheet', 'برائے شفٹ وار ڈیجیٹل اور بینک کیش آڈٹ شیٹ')}
 </h4>

 {shifts.length === 0 ? (
 <p className="text-center py-10 font-sans text-xs text-muted-foreground">{t('No finalized shifts recorded in system.', 'سسٹم میں کوئی شفٹ لاگ درج نہیں ملا۔')}</p>
 ) : (
 <div className="w-full">
 <ResponsiveTable
 data={shifts}
 columns={[
 {
 header: t('Shift Date & Time', 'تاریخ و وقت'),
 accessor: (s) => {
 // Extract a more readable identifier, like the start time, instead of raw timestamp ID
 const displayTime = s.startTime || (s.id.includes('_') ? s.id.split('_')[1].slice(-4) : s.id.slice(-4));
 return (
 <>
 <span className="font-mono text-[11px] text-muted-foreground block">{s.date}</span>
 <strong className="text-foreground text-xs">SH-{displayTime}</strong>
 </>
 );
 },
 isSecondaryMobile: true
 },
 {
 header: t('Supervisor', 'سپروائزر'),
 accessor: (s) => {
 const supervisor = staff.find(st => st.id === s.staffId);
 const displayName = supervisor?.name || s.staffId?.toUpperCase() || 'Unknown';
 return <span className="text-muted-foreground font-semibold truncate max-w-[120px]" title={s.staffId}>{displayName}</span>;
 },
 isPrimaryMobile: true
 },
 {
 header: t('Shift Digital Payments (A)', 'ڈیجیٹل والٹ وصولی (A)' ),
 className: 'text-right',
 accessor: (s) => {
 const totalDigital = (s.digitalCashEntries || []).reduce((sum, dc) => sum + dc.amount, 0);
 return <span className="font-mono font-bold text-foreground">{formatCurrency(totalDigital, settings)}</span>;
 }
 },
 {
 header: t('Shift Bank Deposits (B)', 'بینک ڈیپازٹ رقم (B)'),
 className: 'text-right',
 accessor: (s) => {
 const totalBank = (s.bankCashEntries || []).reduce((sum, bc) => sum + bc.amount, 0);
 return <span className="font-mono font-bold text-foreground">{formatCurrency(totalBank, settings)}</span>;
 }
 },
 {
 header: t('Audit Gap / Variance (A - B)', 'حساب میں فرق'),
 className: 'text-right',
 accessor: (s) => {
 const totalDigital = (s.digitalCashEntries || []).reduce((sum, dc) => sum + dc.amount, 0);
 const totalBank = (s.bankCashEntries || []).reduce((sum, bc) => sum + bc.amount, 0);
 const variance = totalDigital - totalBank;
 return <span className={`font-mono font-extrabold text-[12px]${variance === 0 ? 'text-slate-500' : 'text-rose-600'}`}>{formatCurrency(variance, settings)}</span>;
 }
 },
 {
 header: t('Status', 'اسٹیٹس'),
 className: 'text-center',
 accessor: (s) => {
 const totalDigital = (s.digitalCashEntries || []).reduce((sum, dc) => sum + dc.amount, 0);
 const totalBank = (s.bankCashEntries || []).reduce((sum, bc) => sum + bc.amount, 0);
 const variance = totalDigital - totalBank;
 const isReconciled = reconciledShiftIds.includes(s.id);
 return isReconciled ? (
 <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 leading-none">
 ✓ {t('Reconciled', 'تصفیہ مکمل')}
 </span>
 ) : variance === 0 ? (
 <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 leading-none">
 ⚠ {t('Pending Verification', 'آڈٹ زیر التواء')}
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 leading-none">
 ✕ {t('Discrepancy Variance', 'حساب میں فرق')}
 </span>
 );
 }
 },
 {
 header: t('Verification Settle', 'آڈٹ ایکشن'),
 className: 'text-right',
 accessor: (s) => {
 const isReconciled = reconciledShiftIds.includes(s.id);
 return (
 <button
 onClick={() => handleToggleReconcile(s.id)}
 className={`text-[10.5px] font-bold px-3 py-1 rounded-md transition-all cursor-pointer${
 isReconciled
 ? 'bg-muted text-slate-500 hover:bg-slate-200'
 : 'bg-orange-600 text-white hover:bg-orange-700'
 }`}
 >
 {isReconciled ? t('Un-reconcile', 'دوبارہ آڈٹ کریں') : t('Mark Reconciled', 'توازن منظور کریں')}
 </button>
 );
 }
 }
 ]}
 keyExtractor={(s) => s.id}
 emptyMessage={t('No finalized shifts recorded in system.', 'سسٹم میں کوئی شفٹ لاگ درج نہیں ملا۔')}
 />
 </div>
 )}
 </div>
 </div>
 )}

 </div>
 );
}
