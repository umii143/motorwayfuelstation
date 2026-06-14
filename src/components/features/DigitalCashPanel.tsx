import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  PlusCircle,
  Clock,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Notebook,
  HelpCircle,
  Save,
  CheckCircle,
  SmartphoneNfc
} from 'lucide-react';
import { ResponsiveTable, TableColumn } from '../shared/ResponsiveTable';
import { DigitalAccount, Shift, GlobalSettings, LubePosSale } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { useStation } from '../../contexts/StationContext';
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
  const { showToast } = useStation();
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

  return (
    <div className="space-y-6 pb-20 lg:pb-5">
      {/* HEADER SECTION WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="flex flex-row flex-wrap items-start items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">OPERATIONS</span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-orange-600" />
            <span>{t('Digital Wallet Accounts', 'موبائل مانی والٹ اور ڈیجیٹل پیمنٹس اسسٹنٹ')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t('Monitor and audit EasyPaisa, JazzCash, digital QR-stands, and credit card swipe machines used during cashier shifts.', 'ایزی پیسہ، جاز کیش، بینک کارڈ مشین اور الیکٹرانک اکاؤنٹ کسٹمر ادائیگیوں کی وصولی کا انتظام۔')}
          </p>
        </div>

        {/* TIME FILTER & TRIGGER ROW */}
        <div className="flex flex-wrap items-center gap-2 lg:self-center">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
            {(['all', 'weekly', 'monthly', 'yearly'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  timeFilter === filter
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
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
            className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-md hover:bg-orange-700 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('+ Add Digital Account', 'نیا والٹ رجسٹر کریں')}</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC KPI CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AMBER CARD - TOTAL IN DIGITAL */}
        <div 
          onClick={() => setIsDrillDownOpen(true)}
          className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden cursor-pointer hover:bg-amber-100/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1 group-hover:text-amber-900 transition-colors">TOTAL DIGITAL ASSETS</span>
              <h3 className="font-sans text-2xl font-black text-amber-900 mt-1 whitespace-nowrap animate-pulse">
                {formatCurrency(kpiStats.totalBalance, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 animate-bounce">
              <Smartphone className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Wallets cumulative liquidity</span>
          </div>
        </div>

        {/* GREEN CARD - DISBURSEMENTS OR SHIFTS RECEIVABLE */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">SHIFT DIGITAL PAYMENTS</span>
              <h3 className="font-sans text-2xl font-black text-emerald-950 mt-1">
                {formatCurrency(kpiStats.totalShiftDigitalSum, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <SmartphoneNfc className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <span>Direct digital QR & card swipes</span>
          </div>
        </div>

        {/* CRIMSON CARD - SHIFT WALLET TRANSACTION LOG COUNT */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">COLLECTION TRANSACTIONS</span>
              <h3 className="font-sans text-2xl font-black text-rose-900 mt-1">
                {kpiStats.collectionsCount}
              </h3>
            </div>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-700 font-bold">
            <span>Electronic checkouts in this period</span>
          </div>
        </div>

        {/* BLUE CARD - REGISTERED WALLETS AND MERCHANTS */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">ACTIVE WALLETS</span>
              <h3 className="font-sans text-2xl font-black text-blue-900 mt-1">
                {kpiStats.activeWalletsCount}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Notebook className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-blue-700 font-bold text-ellipsis overflow-hidden whitespace-nowrap">
            <span>QR codes and merchant gates</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: WALLETS AND TRANSACTIONS HISTORY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-row items-center sm:justify-between gap-3">
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                {t('Mobile Wallets & Electronic Merchant Accounts', 'موبائل والٹس اور POS ڈائریکٹری')}
              </h3>
              <div className="relative">
                <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('Search merchant account...', 'تلاش اکاؤنٹ...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-slate-250 bg-white pl-8 pr-3 py-1.5 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs text-sans">
                {t('No active digital wallets or merchant accounts registered.', 'اسٹیشن پینل میں کوئی ڈیجیٹل اکاونٹ نہیں پایا گیا۔')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">{t('Account/Method Name', 'والٹ کا نام')}</th>
                      <th className="py-2.5 px-3">{t('Account No / Merchant ID', 'موبائل / اکاؤنٹ مرچنٹ آئی ڈی')}</th>
                      <th className="py-2.5 px-3 font-right text-right">{t('Current Active Balance', 'موجودہ والٹ بیلنس')}</th>
                      <th className="py-2.5 px-3 text-right">{t('Actions', 'تبدیلی')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAccounts.map((da) => (
                      <tr key={da.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-800 font-bold">{da.name}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{da.accountNo}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900 font-extrabold text-[12px]">
                          {formatCurrency(da.balance, settings)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setAdjustAccountId(da.id)}
                            className="bg-slate-900 text-white hover:bg-slate-850 text-[10px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            {t('Post Adjustment', 'بیلنس تبدیل کریں')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* HISTORICAL DIGITAL ENTRIES */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              {t('Shift Log Captured Digital Payments', 'شفٹ وار ڈیجیٹل وصولیوں کا مکمل رجسٹرڈ لاگ')}
            </h3>

            {compiledShiftDigitalEntries.length === 0 ? (
              <p className="text-center py-10 font-sans text-xs text-slate-400">
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
                        <div className="font-semibold text-slate-800 truncate">{item.shiftId}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.operator.toUpperCase()}</div>
                      </div>
                    ),
                    isPrimaryMobile: true
                  },
                  {
                    header: t('Method / Wallet', 'طریقہ کار'),
                    accessor: (item) => <span className="text-slate-700 font-semibold truncate pr-2">{item.methodName}</span>
                  },
                  {
                    header: t('Transaction/SMS ID', 'ٹرانزیکشن ID'),
                    accessor: (item) => <span className="text-slate-500 font-mono text-[11.5px] truncate pr-2">{item.transactionId}</span>
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
          <div className="rounded-xl border border-slate-200 bg-amber-50/20 p-5 shadow-xs border-l-4 border-l-amber-500 space-y-2">
            <h4 className="font-sans text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{t('Digital Reconciliation Notice', 'والٹ موازنہ ہدایات')}</span>
            </h4>
            <p className="font-sans text-[11.5px] text-amber-700/90 leading-relaxed">
              {t(
                'Digital cash entries represent payments clients paid directly via mobile banking or credit machines in active shifts. These accumulate for visual verification and can be reconciled against the bank balance using the Bank Reconciliation Tool.',
                'ڈیجیٹل والٹ بیلنس شفٹ کے اندر موصول کنندہ رقوم کو ظاہر کرتا ہے۔ ان کا موازنہ اور تصفیہ بینک اکاؤنٹ کے ساتھ جوڑنے کیلئے ماسٹر آڈٹ میں موجود "بینک موازنہ اور ریکنسیلیشن پینل" کو استعمال کریں۔'
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
              {t('Interactive Wallets Summary', 'والٹس بلحاظ رقم')}
            </span>
            <div className="space-y-2">
              {digitalAccounts.map((da) => (
                <div key={da.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 text-xs block">{da.name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{da.accountNo}</span>
                  </div>
                  <strong className="font-mono text-xs text-slate-700">{formatCurrency(da.balance, settings)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW WALLET */}
      <AnimatePresence>
        {showAddAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-orange-600" />
                  <span>{t('Register New Mobile Wallet / Merchant', 'نیا موبائل بٹوے رجسٹر کریں')}</span>
                </h3>
                <button
                  onClick={() => setShowAddAccount(false)}
                  className="text-slate-400 hover:text-slate-650 font-bold text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('Account Interface Name (EasyPaisa Pro, Card POS etc):', 'ڈیجیٹل کھاتہ یا والٹ کا نام:')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EasyPaisa Merchant"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('Mobile Number / POS Merchant Terminal ID:', 'رابطہ نمبر یا مرچنٹ کوڈ:')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 03168432329"
                    value={newAccountNo}
                    onChange={(e) => setNewAccountNo(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t(`Starting Wallet Book balance (${getCurrencySymbol(settings)}):`, 'ابتدائی بیلنس (روپے):')}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold tracking-wider rounded-lg shadow-md cursor-pointer mt-2"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="h-5 w-5 text-orange-6o0" />
                  <span>{t('Post Manual Wallet Adjustment', 'دستی والٹ بیلنس اپ ڈیٹ')}</span>
                </h3>
                <button
                  onClick={() => setAdjustAccountId(null)}
                  className="text-slate-400 hover:text-slate-650 font-bold text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1">
                    {t('Adjustment Action Type:', 'تبدیلی کی نوعیت:')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    <button
                      type="button"
                      onClick={() => setAdjustType('deposit')}
                      className={`py-1.5 font-bold rounded-lg border transition-all cursor-pointer ${
                        adjustType === 'deposit'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {t('Credit / Deposit (+)', 'رقم جمع کریں')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('withdrawal')}
                      className={`py-1.5 font-bold rounded-lg border transition-all cursor-pointer ${
                        adjustType === 'withdrawal'
                          ? 'border-rose-500 bg-rose-50 text-rose-700 font-extrabold'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {t('Debit / Drawal (-)', 'رقم نکالیں')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('Adjustment Amount (PKR Value):', 'منتقل رقم (روپے):')}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('Reason / Memo Statement:', 'تبدیلی کی وجہ / رسید تفصیل:')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="reconciling transfer"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-sans text-xs font-bold tracking-wider rounded-lg shadow-md mt-2 cursor-pointer"
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
