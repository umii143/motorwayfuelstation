import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Landmark,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Clock,
  Briefcase,
  Users,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  CheckCircle,
  Notebook
} from 'lucide-react';
import { BankAccount, Shift, GlobalSettings, LubePosSale } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { useStation } from '../../contexts/StationContext';
import TreasuryDrillDownModal from './ExecutiveDashboard/TreasuryDrillDownModal';

interface BankCashPanelProps {
  settings: GlobalSettings;
  banks: BankAccount[];
  onAddBank: (bank: BankAccount) => void;
  onUpdateBanks: (banks: BankAccount[]) => void;
  shifts: Shift[];
  lubePosSales: LubePosSale[];
}

export default function BankCashPanel({
  settings,
  banks,
  onAddBank,
  onUpdateBanks,
  shifts,
  lubePosSales
}: BankCashPanelProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const { showToast } = useStation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBank, setShowAddBank] = useState(false);
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

  // Form states: New Bank
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNo, setNewAccountNo] = useState('');
  const [newBalance, setNewBalance] = useState('');

  // Form states: Manual adjustment
  const [adjustBankId, setAdjustBankId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Auto-calculated aggregated shift bank cash entries
  const compiledShiftDeposits = useMemo(() => {
    const list: Array<{
      id: string;
      shiftId: string;
      date: string;
      sortKey: string;
      operator: string;
      bankName: string;
      reference: string;
      amount: number;
    }> = [];

    shifts.forEach((s) => {
      if (!isWithinTimeFilter(s.date)) return;
      s.bankCashEntries?.forEach((bc, idx) => {
        const bkName = banks.find((b) => b.id === bc.bankAccountId)?.name || t('Unknown Bank', 'نامعلوم بینک');
        list.push({
          id: bc.id || `bc-${s.id}-${idx}`,
          shiftId: `SH-${s.id}`,
          date: s.date,
          sortKey: `${s.date}T23:59`,
          operator: s.staffId || t('System', 'سسٹم'),
          bankName: bkName,
          reference: bc.reference || t('Shift Cash Bag Deposit', 'شفٹ بیگ نقد جمع'),
          amount: bc.amount
        });
      });
    });

    lubePosSales.forEach((sale) => {
      if (!isWithinTimeFilter(sale.date) || sale.paymentMode !== 'bank' || !sale.bankAccountId) {
        return;
      }

      const bankName =
        banks.find((bank) => bank.id === sale.bankAccountId)?.name ||
        t('Unknown Bank', 'نامعلوم بینک');

      list.push({
        id: `lps_bank_${sale.id}`,
        shiftId: sale.invoiceNo,
        date: sale.date,
        sortKey: `${sale.date}T${sale.time || '23:59'}`,
        operator: sale.cashierId || t('System', 'سسٹم'),
        bankName,
        reference: t(`Lube POS receipt ${sale.invoiceNo}`, `لیوب پی او ایس رسید ${sale.invoiceNo}`),
        amount: sale.total
      });
    });

    return list.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [shifts, banks, timeFilter, lubePosSales, settings]);


  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newAccountNo) {
      showToast(t('Please provide bank name and account number.', 'برائے مہربانی بینک کا نام اور اکاؤنٹ نمبر فراہم کریں۔'), 'error');
      return;
    }

    const nextBank: BankAccount = {
      id: `bk_${Date.now()}`,
      name: newBankName,
      accountNo: newAccountNo,
      balance: Number(newBalance) || 0
    };

    onAddBank(nextBank);
    setNewBankName('');
    setNewAccountNo('');
    setNewBalance('');
    setShowAddBank(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(adjustAmount);
    if (!adjustBankId || isNaN(amt) || amt <= 0) {
      showToast(t('Please enter a valid amount.', 'درست رقم درج کریں۔'), 'error');
      return;
    }

    const updated = banks.map((bk) => {
      if (bk.id === adjustBankId) {
        const delta = adjustType === 'deposit' ? amt : -amt;
        return {
          ...bk,
          balance: bk.balance + delta
        };
      }
      return bk;
    });

    onUpdateBanks(updated);
    setAdjustBankId(null);
    setAdjustAmount('');
    setAdjustReason('');
    showToast(t('Bank balance adjusted successfully!', 'بینک کا فزیکل بیلنس تبدیل کردیا گیا!'), 'success');
  };

  const filteredBanks = useMemo(() => {
    return banks.filter(
      (b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.accountNo.includes(searchQuery)
    );
  }, [banks, searchQuery]);

  // Dynamic KPI stats calculation
  const kpiStats = useMemo(() => {
    const totalBalance = banks.reduce((sum, b) => sum + b.balance, 0);
    const totalShiftDepositsSum = compiledShiftDeposits.reduce((sum, d) => sum + d.amount, 0);
    const shiftDepositsCount = compiledShiftDeposits.length;
    const activeAccountsCount = banks.length;

    return {
      totalBalance,
      totalShiftDepositsSum,
      shiftDepositsCount,
      activeAccountsCount
    };
  }, [banks, compiledShiftDeposits]);

  return (
    <div className="space-y-6 pb-20 lg:pb-5">
      {/* HEADER ROW WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="flex flex-row flex-wrap items-start items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">OPERATIONS</span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-orange-600" />
            <span>{t('Commercial Bank Accounts', 'بینکنگ کیش اور کرنٹ اکاؤنٹس کونسل')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t('Register commercial bank accounts, audit direct shift cash bag deposits and post manual cash balances adjustments.', 'نجی بینک اکاؤنٹس کے اندراج اور شفٹس کی براہ راست بینک ڈیپازٹ رقوم کا ریکارڈ آڈٹ کرنے کا نظام۔')}
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
            onClick={() => setShowAddBank(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-md hover:bg-orange-700 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('+ Add Bank Account', 'نیا بینک اکاؤنٹ شامل کریں')}</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC KPI CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AMBER CARD - TOTAL IN BANKS */}
        <div 
          onClick={() => setIsDrillDownOpen(true)}
          className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden cursor-pointer hover:bg-amber-100/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1 group-hover:text-amber-900 transition-colors">TOTAL BANK CASH</span>
              <h3 className="font-sans text-2xl font-black text-amber-900 mt-1 truncate animate-pulse">
                {formatCurrency(kpiStats.totalBalance, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 animate-bounce">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Sum of active registers</span>
          </div>
        </div>

        {/* GREEN CARD - DISBURSEMENTS OR SHIFTS DEPOSITS */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">PERIOD SHIFT DEPOSITS</span>
              <h3 className="font-sans text-2xl font-black text-emerald-900 mt-1">
                {formatCurrency(kpiStats.totalShiftDepositsSum, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <span>Direct operator submissions</span>
          </div>
        </div>

        {/* CRIMSON CARD - SHIFT DEPOSIT ENTRIES */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">DEPOSIT ENTRIES</span>
              <h3 className="font-sans text-2xl font-black text-rose-900 mt-1">
                {kpiStats.shiftDepositsCount}
              </h3>
            </div>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-700 font-bold">
            <span>Recorded shift transactions</span>
          </div>
        </div>

        {/* BLUE CARD - ACTIVE ACCOUNTS */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">ACTIVE ACCOUNTS</span>
              <h3 className="font-sans text-2xl font-black text-blue-900 mt-1">
                {kpiStats.activeAccountsCount}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-blue-700 font-bold text-ellipsis overflow-hidden truncate">
            <span>Commercial active banks</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN (2/3): BANKS DIRECTORY & MANUAL ADJUSTMENTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-row items-center sm:justify-between gap-3">
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                {t('Registered Banking Institutions Directory', 'بینک اکاؤنٹ معلوماتی فہرست')}
              </h3>
              <div className="relative">
                <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('Search bank name...', 'تلاش بینک...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-slate-250 bg-white pl-8 pr-3 py-1.5 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            {filteredBanks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs text-sans">
                {t('No registered bank accounts found matching search query.', 'کوئی مطلوبہ بینک اکاؤنٹ نہیں ملا۔')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr className="border-slate-150 text-[10px]">
                      <th className="py-2.5 px-3">{t('Bank Name', 'بینک کا نام')}</th>
                      <th className="py-2.5 px-3">{t('Account Number', 'اکاؤنٹ نمبر')}</th>
                      <th className="py-2.5 px-3 font-right text-right">{t('Current Active Balance', 'موجودہ بیلنس')}</th>
                      <th className="py-2.5 px-3 text-right">{t('Quick Actions', 'کارروائی')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBanks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="px-3">{b.name}</td>
                        <td className="px-3 font-mono text-[11px]">{b.accountNo}</td>
                        <td className="px-3 text-right font-mono font-extrabold text-[12px]">
                          {formatCurrency(b.balance, settings)}
                        </td>
                        <td className="px-3 text-right">
                          <button
                            onClick={() => setAdjustBankId(b.id)}
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

          {/* HISTORICAL SHIFTS REFRESH BAGS DIRECTORY */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              {t('Shift Transactions Bank Deposits Ledger', 'شفٹ وار بینک ڈیپازٹس کا تاریخی کھاتہ')}
            </h3>

            {compiledShiftDeposits.length === 0 ? (
              <p className="text-center py-10 font-sans text-xs text-slate-400">
                {t('No automated shift cash deposits tracked yet.', 'اسٹور کی کسی شفٹ کے دوران نقد بیگ بینک میں جمع نہیں کرایا گیا۔')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr className="border-slate-150 text-[10px]">
                      <th className="py-2.5 px-3">{t('Date', 'تاریخ')}</th>
                      <th className="py-2.5 px-3">{t('Shift Ref & Operator', 'شفٹ و سیلز مین')}</th>
                      <th className="py-2.5 px-3">{t('Target Bank', 'منتقل بینک')}</th>
                      <th className="py-2.5 px-3">{t('Reference / Description', 'تفصیل')}</th>
                      <th className="py-2.5 px-3 text-right">{t('Amount Deposited', 'منتقل رقم')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compiledShiftDeposits.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-3 text-slate-550 font-mono text-[11px]">{item.date}</td>
                        <td className="px-3">
                          <div className="font-semibold text-slate-800">{item.shiftId}</div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{item.operator.toUpperCase()}</span>
                        </td>
                        <td className="px-3 text-slate-700 font-semibold">{item.bankName}</td>
                        <td className="px-3">{item.reference}</td>
                        <td className="px-3 text-right font-mono text-emerald-600 font-extrabold text-[12px]">
                          +{formatCurrency(item.amount, settings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (1/3): QUICK RECONCILIATIONS STATEMENT */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-amber-50/20 p-5 shadow-xs border-l-4 border-l-amber-500 space-y-2">
            <h4 className="font-sans text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{t('Double-Entry Bank Compliance Note', 'بینکنگ ڈبل انٹری رولز')}</span>
            </h4>
            <p className="font-sans text-[11.5px] text-amber-700/90 leading-relaxed">
              {t(
                'Shift deposits are added directly to the selected bank when they are processed by supervisors in the Shift Wizard. Use the Manual Post Adjustment form only to reconcile bank interest, credit-line payments, or tax deductions.',
                'شفٹس کے دوران آپریٹر کی طرف سے جمع کیا گیا کیش بیگ متعلقہ بینک اکاؤنٹ میں خودکار طور پر جمع ہوتا ہے۔ دستی ایڈجسٹمنٹ کو صرف ٹیکس کے اخراجات یا بینک منافع کے اندراج کیلئے استعمال کریں۔'
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
              {t('Station Banks Directory Summary', 'بینکوں کی مجموعی صورتحال')}
            </span>
            <div className="space-y-2">
              {banks.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 text-xs block truncate max-w-full max-w-[150px]">{b.name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{b.accountNo}</span>
                  </div>
                  <strong className="font-mono text-xs text-slate-700">{formatCurrency(b.balance, settings)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW BANK */}
      <AnimatePresence>
        {showAddBank && (
          <div className="premium-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-orange-600" />
                  <span>{t('Register New Commercial Bank Account', 'نیا بینک اکاؤنٹ اکاؤنٹ کا اندراج')}</span>
                </h3>
                <button
                  onClick={() => setShowAddBank(false)}
                  className="text-slate-400 hover:text-slate-650 font-bold text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateBank} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('Bank Name (e.g. Meezan Bank):', 'بینک کا نام:')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meezan Bank Ltd"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="premium-input border bg-white px-3 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('Account Number / IBAN:', 'بینک اکاؤنٹ نمبر:')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PK83MEZN000109283910"
                    value={newAccountNo}
                    onChange={(e) => setNewAccountNo(e.target.value)}
                    className="premium-input border bg-white px-3 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t(`Opening / Starting Book Balance (${getCurrencySymbol(settings)}):`, 'ابتدائی بینک بیلنس (روپے):')}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="premium-input border bg-white px-3 .5 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold tracking-wider rounded-lg shadow-md cursor-pointer mt-2"
                >
                  {t('REGISTER CORPORATE BANK ACCOUNT', 'نیا بینک کھاتہ رجسٹر کریں')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: MANUAL ADJUST BALANCE */}
      <AnimatePresence>
        {adjustBankId && (
          <div className="premium-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Landmark className="h-5 w-5 text-orange-6o0" />
                  <span>{t('Post Manual Bank Adjustment', 'دستی متبادل بیلنس اپ ڈیٹ')}</span>
                </h3>
                <button
                  onClick={() => setAdjustBankId(null)}
                  className="text-slate-400 hover:text-slate-650 font-bold text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
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
                      {t('Deposit / Credit (+)', 'رقم جمع کریں')}
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
                      {t('Withdrawal / Debit (-)', 'رقم نکالیں')}
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
                    placeholder="e.g. 25000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="premium-input border bg-white px-3 .5 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('Reason / Memo Statement:', 'تبدیلی کی وجہ / رسید تفصیل:')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Interbank Profit Credit"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="premium-input border bg-white px-3 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-sans text-xs font-bold tracking-wider rounded-lg shadow-md mt-2 cursor-pointer"
                >
                  {t('COMMIT BALANCE ADJUSTMENT', 'متبادل فنانشل ٹانزیکشن درج کریں')}
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
