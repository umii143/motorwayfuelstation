import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 Smartphone,
 PlusCircle,
 Clock,
 Search,
 Notebook,
 SmartphoneNfc,
 Wallet,
 CreditCard,
 Building
} from 'lucide-react';
import { ResponsiveTable } from '../shared/ResponsiveTable';
import { DigitalAccount, Shift, GlobalSettings, LubePosSale } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { useStationStore } from '../../stores/useStationStore';
import TreasuryDrillDownModal from './ExecutiveDashboard/TreasuryDrillDownModal';

interface DigitalCashPanelProps {
 settings: GlobalSettings;
 digitalAccounts: DigitalAccount[];
 onAddDigitalAccount: (account: DigitalAccount) => void;
 onUpdateDigitalAccounts: (accounts: DigitalAccount[]) => void;
 shifts: Shift[];
 lubePosSales: LubePosSale[];
}

export default function DigitalCashPanel({
 settings,
 digitalAccounts,
 onAddDigitalAccount,
 onUpdateDigitalAccounts,
 shifts,
 lubePosSales
}: DigitalCashPanelProps) {
 const showToast = useStationStore((state) => state.showToast);
 const t = (en: string, ur: string) => translate(en, ur, settings);

 const [searchQuery, setSearchQuery] = useState('');
 const [showAddAccount, setShowAddAccount] = useState(false);
 const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
 const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');

 // Time filter checking helper
 const isWithinTimeFilter = (dateStr: string) => {
 if (timeFilter === 'all') return true;
 const baseline = new Date();
 baseline.setHours(0, 0, 0, 0);
 const target = new Date(dateStr);
 if (isNaN(target.getTime())) return true;
 const diffDays = (baseline.getTime() - target.getTime()) / (1000 * 3600 * 24);
 if (timeFilter === 'weekly') return diffDays >= 0 && diffDays <= 7;
 if (timeFilter === 'monthly') return diffDays >= 0 && diffDays <= 30;
 if (timeFilter === 'yearly') return diffDays >= 0 && diffDays <= 365;
 return true;
 };

 // Form states: New Digital Account
 const [newAccountName, setNewAccountName] = useState('');
 const [newAccountNo, setNewAccountNo] = useState('');
 const [newBalance, setNewBalance] = useState('');

 // Form states: Manual adjustment
 const [adjustAccountId, setAdjustAccountId] = useState<string | null>(null);
 const [adjustType, setAdjustType] = useState<'deposit' | 'withdrawal'>('deposit');
 const [adjustAmount, setAdjustAmount] = useState('');
 const [adjustReason, setAdjustReason] = useState('');

 // Auto-calculated shift digital cash entries across history
 const compiledShiftDigitalEntries = useMemo(() => {
 const list: Array<{
 id: string;
 shiftId: string;
 date: string;
 sortKey: string;
 operator: string;
 methodName: string;
 transactionId: string;
 amount: number;
 }> = [];

 shifts.forEach((s) => {
 if (!isWithinTimeFilter(s.date)) return;
 s.digitalCashEntries?.forEach((dc, idx) => {
 list.push({
 id: dc.id || `dc-${s.id}-${idx}`,
 shiftId: `SH-${s.id}`,
 date: s.date,
 sortKey: `${s.date}T23:59`,
 operator: s.staffId || t('System', 'سسٹم'),
 methodName: dc.method || t('EasyPaisa / JazzCash / POS', 'موبائل والٹ'),
 transactionId: dc.transactionId || '—',
 amount: dc.amount
 });
 });
 });

 lubePosSales.forEach((sale) => {
 if (!isWithinTimeFilter(sale.date) || sale.paymentMode !== 'digital' || !sale.digitalAccountId) {
 return;
 }

 list.push({
 id: `lps_digital_${sale.id}`,
 shiftId: sale.invoiceNo,
 date: sale.date,
 sortKey: `${sale.date}T${sale.time || '23:59'}`,
 operator: sale.cashierId || t('System', 'سسٹم'),
 methodName: t('Lube POS Digital', 'لیوب پی او ایس ڈیجیٹل'),
 transactionId: sale.invoiceNo,
 amount: sale.total
 });
 });

 return list.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
 
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [shifts, timeFilter, lubePosSales, settings]);


 const handleCreateAccount = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newAccountName || !newAccountNo) {
 showToast(t('Please provide account name and account/merchant number.', 'برائے مہربانی اکاؤنٹ کا نام اور مرچنٹ نمبر فراہم کریں۔'), 'error');
 return;
 }

 const nextAccount: DigitalAccount = {
 id: `da_${Date.now()}`,
 name: newAccountName,
 accountNo: newAccountNo,
 balance: Number(newBalance) || 0
 };

 onAddDigitalAccount(nextAccount);
 setNewAccountName('');
 setNewAccountNo('');
 setNewBalance('');
 setShowAddAccount(false);
 };

 const handleAdjustSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const amt = Number(adjustAmount);
 if (!adjustAccountId || isNaN(amt) || amt <= 0) {
 showToast(t('Please enter a valid amount.', 'درست رقم درج کریں۔'), 'error');
 return;
 }

 const updated = digitalAccounts.map((da) => {
 if (da.id === adjustAccountId) {
 const delta = adjustType === 'deposit' ? amt : -amt;
 return {
 ...da,
 balance: da.balance + delta
 };
 }
 return da;
 });

 onUpdateDigitalAccounts(updated);
 setAdjustAccountId(null);
 setAdjustAmount('');
 setAdjustReason('');
 showToast(t('Digital account balance adjusted successfully!', 'ڈیجیٹل اکاؤنٹ کا بیلنس تصدیق کے ساتھ تبدیل کردیا گیا!'), 'success');
 };

 const filteredAccounts = useMemo(() => {
 return digitalAccounts.filter(
 (da) =>
 da.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 da.accountNo.includes(searchQuery)
 );
 }, [digitalAccounts, searchQuery]);

 // Dynamic KPI stats calculation
 const kpiStats = useMemo(() => {
 const totalBalance = digitalAccounts.reduce((sum, d) => sum + d.balance, 0);
 const totalShiftDigitalSum = compiledShiftDigitalEntries.reduce((sum, d) => sum + d.amount, 0);
 const collectionsCount = compiledShiftDigitalEntries.length;
 const activeWalletsCount = digitalAccounts.length;

 return {
 totalBalance,
 totalShiftDigitalSum,
 collectionsCount,
 activeWalletsCount
 };
 }, [digitalAccounts, compiledShiftDigitalEntries]);

 // Helper to determine visual details for Pakistani payment providers and types
 const getProviderDetails = (name: string) => {
 const norm = name.toLowerCase();
 if (norm.includes('easypaisa') || norm.includes('easy paisa')) {
 return {
 provider: 'EasyPaisa',
 color: 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/10 dark:to-transparent',
 borderColor: 'border-emerald-200 dark:border-emerald-500/20',
 textColor: 'text-emerald-700 dark:text-emerald-400',
 badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20',
 badgeText: 'text-emerald-800 dark:text-emerald-300',
 glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)] dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)]',
 icon: <Wallet className="h-4.5 w-4.5 text-emerald-600" />
 };
 }
 if (norm.includes('jazzcash') || norm.includes('jazz cash')) {
 return {
 provider: 'JazzCash',
 color: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/10 dark:to-transparent',
 borderColor: 'border-amber-250 dark:border-amber-500/20',
 textColor: 'text-amber-850 dark:text-amber-400',
 badgeBg: 'bg-amber-100 dark:bg-amber-500/20',
 badgeText: 'text-amber-900 dark:text-amber-300',
 glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)] dark:shadow-[0_0_15px_-3px_rgba(245,158,11,0.05)]',
 icon: <Wallet className="h-4.5 w-4.5 text-amber-600" />
 };
 }
 if (norm.includes('pos') || norm.includes('card') || norm.includes('swipe') || norm.includes('machine') || norm.includes('terminal')) {
 return {
 provider: t('POS Terminal', 'پی او ایس'),
 color: 'from-cyan-500/10 to-cyan-600/5 dark:from-cyan-500/10 dark:to-transparent',
 borderColor: 'border-cyan-200 dark:border-cyan-500/20',
 textColor: 'text-cyan-800 dark:text-cyan-400',
 badgeBg: 'bg-cyan-100 dark:bg-cyan-500/20',
 badgeText: 'text-cyan-900 dark:text-cyan-300',
 glow: 'shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)] dark:shadow-[0_0_15px_-3px_rgba(6,182,212,0.05)]',
 icon: <CreditCard className="h-4.5 w-4.5 text-cyan-600" />
 };
 }
 if (norm.includes('bank') || norm.includes('hbl') || norm.includes('alfalah') || norm.includes('mcb') || norm.includes('meezan') || norm.includes('ubl') || norm.includes('allied') || norm.includes('faisal')) {
 return {
 provider: t('Bank Account', 'بینک اکاؤنٹ'),
 color: 'from-indigo-500/10 to-indigo-650/5 dark:from-indigo-500/10 dark:to-transparent',
 borderColor: 'border-indigo-200 dark:border-indigo-500/20',
 textColor: 'text-indigo-800 dark:text-indigo-400',
 badgeBg: 'bg-indigo-100 dark:bg-indigo-500/20',
 badgeText: 'text-indigo-900 dark:text-indigo-300',
 glow: 'shadow-[0_0_15px_-3px_rgba(99,102,241,0.1)] dark:shadow-[0_0_15px_-3px_rgba(99,102,241,0.05)]',
 icon: <Building className="h-4.5 w-4.5 text-indigo-600" />
 };
 }
 return {
 provider: t('Digital Wallet', 'ڈیجیٹل والٹ'),
 color: 'from-slate-500/5 to-slate-600/5 dark:from-white/5 dark:to-transparent',
 borderColor: 'border-border',
 textColor: 'text-slate-700 ',
 badgeBg: 'bg-muted',
 badgeText: 'text-foreground ',
 glow: '',
 icon: <Smartphone className="h-4.5 w-4.5 text-muted-foreground" />
 };
 };

 return (
 <div className="space-y-6 pb-20 lg:pb-5">
 {/* HEADER SECTION WITH INTEGRATED DYNAMIC TIME FILTER */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
 <div>
 <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">OPERATIONS</span>
 <h2 className="font-sans text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
 <Smartphone className="h-6 w-6 text-orange-600" />
 <span>{t('Digital Wallet Accounts', 'موبائل مانی والٹ اور ڈیجیٹل پیمنٹس اسسٹنٹ')}</span>
 </h2>
 <p className="font-sans text-xs text-muted-foreground mt-1">
 {t('Monitor and audit EasyPaisa, JazzCash, digital QR-stands, and credit card swipe machines used during cashier shifts.', 'ایزی پیسہ، جاز کیش، بینک کارڈ مشین اور الیکٹرانک اکاؤنٹ کسٹمر ادائیگیوں کی وصولی کا انتظام۔')}
 </p>
 </div>

 {/* TIME FILTER & TRIGGER ROW */}
 <div className="flex flex-wrap items-center gap-3">
 <div className="flex bg-muted rounded-xl p-1 border border-border/60 shadow-inner shrink-0">
 {(['all', 'weekly', 'monthly', 'yearly'] as const).map((filter) => (
 <button
 key={filter}
 onClick={() => setTimeFilter(filter)}
 className={`px-3.5 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer${
 timeFilter === filter
 ? 'bg-orange-600 text-white shadow-sm'
 : 'text-slate-500 hover:text-foreground dark:hover:text-white hover:bg-card/50 dark:hover:bg-card/5'
 }`}
 >
 {filter === 'all' && t('All-Time', 'کل وقت')}
 {filter === 'weekly' && t('Weekly', 'ہفتہ وار')}
 {filter === 'monthly' && t('Monthly', 'ماہانہ')}
 {filter === 'yearly' && t('Yearly', 'سالانہ')}
 </button>
 ))}
 </div>

 <button
 onClick={() => setShowAddAccount(true)}
 className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-lg shadow-orange-600/10 hover:bg-orange-700 hover:shadow-orange-700/20 active:scale-[0.98] transition-all cursor-pointer"
 >
 <PlusCircle className="h-4 w-4" />
 <span>{t('+ Add Digital Account', 'نیا والٹ رجسٹر کریں')}</span>
 </button>
 </div>
 </div>

 {/* DYNAMIC KPI CARDS SECTION */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {/* AMBER CARD - TOTAL IN DIGITAL */}
 <div 
 onClick={() => setIsDrillDownOpen(true)}
 className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-xs flex flex-col justify-between min-h-[115px] relative overflow-hidden cursor-pointer hover:border-amber-500/60 dark:hover:border-amber-500/40 hover:shadow-lg dark:hover:shadow-amber-500/5 hover:scale-[1.01] transition-all duration-200 group"
 >
 <div className="flex items-start justify-between">
 <div>
 <span className="font-mono text-[9px] font-bold text-amber-800 uppercase tracking-widest block mb-1">TOTAL DIGITAL ASSETS</span>
 <h3 className="font-sans text-2xl font-black text-foreground mt-1 whitespace-nowrap">
 {formatCurrency(kpiStats.totalBalance, settings)}
 </h3>
 </div>
 <div className="rounded-xl bg-amber-100 p-2 text-amber-700 transition-transform group-hover:scale-105">
 <Smartphone className="h-5 w-5" />
 </div>
 </div>
 <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-800 font-bold">
 <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
 <span>{t('Wallets cumulative liquidity', 'والٹس کا مجموعی بیلنس')}</span>
 </div>
 </div>

 {/* GREEN CARD - DISBURSEMENTS OR SHIFTS RECEIVABLE */}
 <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-xs flex flex-col justify-between min-h-[115px] relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 group">
 <div className="flex items-start justify-between">
 <div>
 <span className="font-mono text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">SHIFT DIGITAL PAYMENTS</span>
 <h3 className="font-sans text-2xl font-black text-foreground mt-1">
 {formatCurrency(kpiStats.totalShiftDigitalSum, settings)}
 </h3>
 </div>
 <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 transition-transform group-hover:scale-105">
 <SmartphoneNfc className="h-5 w-5" />
 </div>
 </div>
 <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-850 font-bold">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span>{t('Direct digital QR & card swipes', 'کیو آر کوڈز اور کارڈ مشین کی کل رقم')}</span>
 </div>
 </div>

 {/* CRIMSON CARD - SHIFT WALLET TRANSACTION LOG COUNT */}
 <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5 shadow-xs flex flex-col justify-between min-h-[115px] relative overflow-hidden transition-all duration-200 hover:border-rose-500/40 dark:hover:border-rose-500/30 group">
 <div className="flex items-start justify-between">
 <div>
 <span className="font-mono text-[9px] font-bold text-rose-800 uppercase tracking-widest block mb-1">COLLECTION TRANSACTIONS</span>
 <h3 className="font-sans text-2xl font-black text-foreground mt-1">
 {kpiStats.collectionsCount}
 </h3>
 </div>
 <div className="rounded-xl bg-rose-100 p-2 text-rose-700 transition-transform group-hover:scale-105">
 <Clock className="h-5 w-5" />
 </div>
 </div>
 <div className="mt-3 flex items-center gap-1.5 text-[10px] text-rose-850 font-bold">
 <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
 <span>{t('Electronic checkouts in this period', 'ڈیجیٹل ٹرانزیکشنز کی تعداد')}</span>
 </div>
 </div>

 {/* BLUE CARD - REGISTERED WALLETS AND MERCHANTS */}
 <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-xs flex flex-col justify-between min-h-[115px] relative overflow-hidden transition-all duration-200 hover:border-blue-500/40 dark:hover:border-blue-500/30 group">
 <div className="flex items-start justify-between">
 <div>
 <span className="font-mono text-[9px] font-bold text-blue-800 uppercase tracking-widest block mb-1">ACTIVE WALLETS</span>
 <h3 className="font-sans text-2xl font-black text-foreground mt-1">
 {kpiStats.activeWalletsCount}
 </h3>
 </div>
 <div className="rounded-xl bg-blue-100 p-2 text-blue-700 transition-transform group-hover:scale-105">
 <Notebook className="h-5 w-5" />
 </div>
 </div>
 <div className="mt-3 flex items-center gap-1.5 text-[10px] text-blue-850 font-bold text-ellipsis overflow-hidden whitespace-nowrap">
 <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
 <span>{t('QR codes and merchant gates', 'درج شدہ والٹس اور پیمنٹ سورس')}</span>
 </div>
 </div>
 </div>

 {/* TWO COLUMN CONTENT LAYOUT */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
 {/* LEFT COLUMN: WALLETS AND TRANSACTIONS HISTORY */}
 <div className="lg:col-span-2 space-y-6">
 {/* Active Wallets Listing */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
 <div>
 <h3 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
 <Wallet className="h-4.5 w-4.5 text-orange-600" />
 <span>{t('Mobile Wallets & Electronic Merchant Accounts', 'موبائل والٹس اور POS ڈائریکٹری')}</span>
 </h3>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 {t('Manage live balances and track ledger adjustments.', 'والٹس کا بیلنس اور ان کی ایڈجسٹمنٹ کو منظم کریں۔')}
 </p>
 </div>

 <div className="relative w-full sm:w-64">
 <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-405" />
 <input
 type="text"
 placeholder={t('Search merchant account...', 'تلاش اکاؤنٹ...')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full rounded-xl border border-border bg-card pl-9 pr-3.5 py-1.5 font-sans text-xs focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-hidden text-foreground transition-all shadow-inner"
 />
 </div>
 </div>

 {filteredAccounts.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground text-xs font-sans">
 {t('No active digital wallets or merchant accounts registered.', 'اسٹیشن پینل میں کوئی ڈیجیٹل اکاؤنٹ نہیں پایا گیا۔')}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {filteredAccounts.map((da) => {
 const details = getProviderDetails(da.name);
 return (
 <div
 key={da.id}
 className={`rounded-2xl border${details.borderColor}bg-gradient-to-br${details.color}p-4 flex flex-col justify-between min-h-[145px] transition-all hover:scale-[1.01] hover:shadow-md${details.glow}relative overflow-hidden`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-start gap-2.5">
 <div className={`rounded-xl${details.badgeBg}p-2 text-foreground`}>
 {details.icon}
 </div>
 <div>
 <span className={`font-mono text-[9px] font-black uppercase tracking-widest${details.textColor}block`}>
 {details.provider}
 </span>
 <h4 className="font-sans text-sm font-bold text-foreground mt-0.5 truncate max-w-[140px]">
 {da.name}
 </h4>
 </div>
 </div>
 <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider${details.badgeBg}${details.badgeText}`}>
 {t('Live Active', 'فعال')}
 </span>
 </div>

 <div className="mt-4">
 <span className="text-[10px] text-slate-450 block font-sans">
 {t('Account No / Merchant ID:', 'اکاؤنٹ نمبر / کوڈ:')}
 </span>
 <code className="text-xs font-mono font-bold text-foreground">
 {da.accountNo}
 </code>
 </div>

 <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
 <div>
 <span className="text-[9px] text-slate-450 block uppercase tracking-wider font-mono">
 {t('Current Balance', 'موجودہ بیلنس')}
 </span>
 <strong className="font-sans text-base font-black text-foreground leading-tight block mt-0.5">
 {formatCurrency(da.balance, settings)}
 </strong>
 </div>
 <button
 onClick={() => setAdjustAccountId(da.id)}
 className="bg-card text-foreground hover:bg-slate-800 dark:hover:bg-slate-100 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs hover:shadow-sm cursor-pointer"
 >
 {t('Post Adjustment', 'بیلنس تبدیل کریں')}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* HISTORICAL DIGITAL ENTRIES */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
 <div className="border-b border-border pb-3">
 <h3 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider">
 {t('Shift Log Captured Digital Payments', 'شفٹ وار ڈیجیٹل وصولیوں کا لاگ')}
 </h3>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 {t('Automated registry of digital payments compiled across completed cashier shifts.', 'مکمل ہونے والی شفٹوں میں موصولہ ڈیجیٹل ادائیگیوں کا خودکار لاگ۔')}
 </p>
 </div>

 {compiledShiftDigitalEntries.length === 0 ? (
 <p className="text-center py-10 font-sans text-xs text-muted-foreground">
 {t('No automated shift digital entries recorded yet.', 'شفٹ کے دوران ڈیجیٹل یا موبائل والٹ پر کوئی رقم موصول نہیں ہوئی۔')}
 </p>
 ) : (
 <ResponsiveTable
 data={compiledShiftDigitalEntries}
 columns={[
 {
 header: t('Date', 'تاریخ'),
 accessor: (item) => <span className="text-slate-550 font-mono text-[11px] truncate">{item.date}</span>,
 isSecondaryMobile: true
 },
 {
 header: t('Shift ID & Operator', 'شفٹ اور کیشئر'),
 accessor: (item) => (
 <div>
 <div className="font-semibold text-foreground truncate">{item.shiftId}</div>
 <div className="text-[10px] text-muted-foreground truncate mt-0.5">{item.operator.toUpperCase()}</div>
 </div>
 ),
 isPrimaryMobile: true
 },
 {
 header: t('Method / Wallet', 'طریقہ کار'),
 accessor: (item) => <span className="text-foreground font-semibold truncate pr-2">{item.methodName}</span>
 },
 {
 header: t('Transaction/SMS ID', 'ٹرانزیکشن ID'),
 accessor: (item) => <span className="text-muted-foreground font-mono text-[11.5px] truncate pr-2">{item.transactionId}</span>
 },
 {
 header: t('Amount Received', 'وصول شدہ رقم'),
 className: 'text-right',
 accessor: (item) => (
 <span className="font-mono text-emerald-600 font-extrabold text-[12px] truncate">
 +{formatCurrency(item.amount, settings)}
 </span>
 )
 }
 ]}
 keyExtractor={(item) => item.id}
 emptyMessage=""
 />
 )}
 </div>
 </div>

 {/* RIGHT COLUMN: MANUAL AUDITING POLICIES */}
 <div className="space-y-6">
 {/* Reconciliation Advisory notice */}
 <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 shadow-xs border-l-4 border-l-amber-500 space-y-2.5">
 <h4 className="font-sans text-xs font-bold text-amber-850 uppercase tracking-widest flex items-center gap-1.5">
 <Clock className="h-4 w-4" />
 <span>{t('Digital Reconciliation Notice', 'والٹ موازنہ ہدایات')}</span>
 </h4>
 <p className="font-sans text-[11.5px] text-muted-foreground leading-relaxed">
 {t(
 'Digital cash entries represent payments clients paid directly via mobile banking or credit machines in active shifts. These accumulate for visual verification and can be reconciled against the bank balance using the Bank Reconciliation Tool.',
 'ڈیجیٹل والٹ بیلنس شفٹ کے اندر موصول کنندہ رقوم کو ظاہر کرتا ہے۔ ان کا موازنہ اور تصفیہ بینک اکاؤنٹ کے ساتھ جوڑنے کے لیے ماسٹر آڈٹ میں موجود"بینک موازنہ اور ریکنسلیشن پینل" کو استعمال کریں۔'
 )}
 </p>
 </div>

 {/* Interactive wallets summary */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
 <span className="font-sans text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-2">
 {t('Interactive Wallets Summary', 'والٹس بلحاظ رقم')}
 </span>
 <div className="space-y-2.5">
 {digitalAccounts.map((da) => {
 const details = getProviderDetails(da.name);
 return (
 <div key={da.id} className="p-3 bg-subtle rounded-xl flex items-center justify-between border border-border">
 <div className="flex items-center gap-2">
 <div className={`p-1.5 rounded-lg${details.badgeBg}text-foreground scale-90`}>
 {details.icon}
 </div>
 <div>
 <strong className="text-foreground text-xs block font-bold">{da.name}</strong>
 <span className="text-[9px] text-muted-foreground font-mono block mt-0.5">{da.accountNo}</span>
 </div>
 </div>
 <strong className="font-mono text-xs text-foreground font-extrabold">
 {formatCurrency(da.balance, settings)}
 </strong>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>

 {/* MODAL 1: REGISTER NEW wallet */}
 <AnimatePresence>
 {showAddAccount && (
 <div className="premium-modal-overlay">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
 >
 <div className="flex items-center justify-between border-b border-border pb-3.5 mb-2">
 <h3 className="font-sans text-base font-bold text-foreground flex items-center gap-2">
 <Smartphone className="h-5 w-5 text-orange-600" />
 <span>{t('Register New Mobile Wallet / Merchant', 'نیا موبائل بٹوے رجسٹر کریں')}</span>
 </h3>
 <button
 onClick={() => setShowAddAccount(false)}
 className="text-muted-foreground hover:text-slate-600 font-bold text-xl cursor-pointer"
 >
 &times;
 </button>
 </div>

 <form onSubmit={handleCreateAccount} className="space-y-4">
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {t('Account Interface Name (EasyPaisa Pro, Card POS etc):', 'ڈیجیٹل کھاتہ یا والٹ کا نام:')}
 </label>
 <input
 type="text"
 required
 placeholder="e.g. EasyPaisa Merchant"
 value={newAccountName}
 onChange={(e) => setNewAccountName(e.target.value)}
 className="premium-input border border-border bg-card text-foreground px-3 py-2 font-sans text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500/35 focus:outline-hidden rounded-xl w-full"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {t('Mobile Number / POS Merchant Terminal ID:', 'رابطہ نمبر یا مرچنٹ کوڈ:')}
 </label>
 <input
 type="text"
 required
 placeholder="e.g. 03168432329"
 value={newAccountNo}
 onChange={(e) => setNewAccountNo(e.target.value)}
 className="premium-input border border-border bg-card text-foreground px-3 py-2 font-mono text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500/35 focus:outline-hidden rounded-xl w-full"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {t(`Starting Wallet Book balance (${getCurrencySymbol(settings)}):`, 'ابتدائی بیلنس (روپے):')}
 </label>
 <input
 type="number"
 placeholder="e.g. 15000"
 value={newBalance}
 onChange={(e) => setNewBalance(e.target.value)}
 className="premium-input border border-border bg-card text-foreground px-3 py-2 font-mono text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/35 focus:outline-hidden rounded-xl w-full"
 />
 </div>

 <button
 type="submit"
 className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold tracking-wider rounded-xl shadow-md cursor-pointer mt-3 transition-colors duration-150"
 >
 {t('REGISTER EXPANDED DIGITAL WALLET', 'نیا ڈیجیٹل پیمنٹ اکاؤنٹ رجسٹر کریں')}
 </button>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* MODAL 2: MANUAL ADJUST wallet BALANCE */}
 <AnimatePresence>
 {adjustAccountId && (
 <div className="premium-modal-overlay">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
 >
 <div className="flex items-center justify-between border-b border-border pb-3.5 mb-1">
 <h3 className="font-sans text-base font-bold text-foreground flex items-center gap-1.5">
 <Smartphone className="h-5 w-5 text-orange-600" />
 <span>{t('Post Manual Wallet Adjustment', 'تبدیلی بیلنس')}</span>
 </h3>
 <button
 onClick={() => setAdjustAccountId(null)}
 className="text-slate-405 hover:text-slate-600 font-bold text-xl cursor-pointer"
 >
 &times;
 </button>
 </div>

 <form onSubmit={handleAdjustSubmit} className="space-y-4">
 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {t('Adjustment Action Type:', 'تبدیلی کی نوعیت:')}
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <button
 type="button"
 onClick={() => setAdjustType('deposit')}
 className={`py-2 font-bold rounded-xl border transition-all duration-150 cursor-pointer${
 adjustType === 'deposit'
 ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 font-extrabold shadow-xs'
 : 'border-border bg-card text-muted-foreground'
 }`}
 >
 {t('Credit / Deposit (+)', 'رقم جمع کریں')}
 </button>
 <button
 type="button"
 onClick={() => setAdjustType('withdrawal')}
 className={`py-2 font-bold rounded-xl border transition-all duration-150 cursor-pointer${
 adjustType === 'withdrawal'
 ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 font-extrabold shadow-xs'
 : 'border-border bg-card text-muted-foreground'
 }`}
 >
 {t('Debit / Drawal (-)', 'رقم نکالیں')}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {t('Adjustment Amount (PKR Value):', 'منتقلی رقم (روٞی):')}
 </label>
 <input
 type="number"
 required
 placeholder="e.g. 5000"
 value={adjustAmount}
 onChange={(e) => setAdjustAmount(e.target.value)}
 className="premium-input border border-border bg-card text-foreground px-3 py-2 font-mono text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/35 focus:outline-hidden rounded-xl w-full"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
 {t('Reason / Memo Statement:', 'تبدیلی کی وجہ / تصٍیہ تفصیل:')}
 </label>
 <input
 type="text"
 required
 placeholder="reconciling transfer"
 value={adjustReason}
 onChange={(e) => setAdjustReason(e.target.value)}
 className="premium-input border border-border bg-card text-foreground px-3 py-2 font-sans text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500/35 focus:outline-hidden rounded-xl w-full"
 />
 </div>

 <button
 type="submit"
 className="w-full py-3 bg-card hover:bg-slate-800 dark:hover:bg-slate-100 text-foreground font-sans text-xs font-bold tracking-wider rounded-xl shadow-md mt-3 cursor-pointer transition-colors duration-150"
 >
 {t('COMMIT BALANCE ADJUSTMENT', 'تبدیلی فنانشل لاگ درج کریں')}
 </button>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <TreasuryDrillDownModal 
 isOpen={isDrillDownOpen}
 onClose={() => setIsDrillDownOpen(false)}
 settings={settings}
 />
 </div>
 );
}