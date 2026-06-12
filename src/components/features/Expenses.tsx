/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  Coins,
  ArrowDownRight,
  PlusCircle,
  Search,
  Filter,
  Wrench,
  Utensils,
  Lightbulb,
  Info,
  Calendar,
  CreditCard,
  Notebook,
  Sparkles,
  Trash2,
  Settings2
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { ModuleSearchBar } from '../shared/ModuleSearchBar';
import { ExportToolbar } from '../shared/ExportToolbar';
import AIDocumentScanner from '../ui/AIDocumentScanner';
import { ExpenseEntry, GlobalSettings, Shift } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { useStation } from '../../contexts/StationContext';

interface ExpensesProps {
  settings: GlobalSettings;
  activeStationId: string;
  shifts: Shift[];
  onAddExpenseShift?: (expense: ExpenseEntry) => void;
  // Dynamic direct standalone expenses state persistence if shifts are not running
  standaloneExpenses: ExpenseEntry[];
  onAddStandaloneExpense: (expense: ExpenseEntry) => void;
}

export default function Expenses({
  settings,
  activeStationId,
  shifts,
  standaloneExpenses,
  onAddStandaloneExpense
}: ExpensesProps) {
  const { showToast, handleUpdateSettings } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isUrdu = settings.language === 'ur';

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatUrdu, setNewCatUrdu] = useState('');

  // Time filter checking helper
  const isWithinTimeFilter = (dateStr: string) => {
    if (timeFilter === 'all') return true;
    const baseline = new Date('2026-06-01');
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return true;
    const diffDays = (baseline.getTime() - target.getTime()) / (1000 * 3600 * 24);
    if (timeFilter === 'weekly') return diffDays >= 0 && diffDays <= 7;
    if (timeFilter === 'monthly') return diffDays >= 0 && diffDays <= 30;
    if (timeFilter === 'yearly') return diffDays >= 0 && diffDays <= 365;
    return true;
  };

  // Form states
  const [formCategory, setFormCategory] = useState('meals');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaidFrom, setFormPaidFrom] = useState<'cash' | 'bank'>('cash');
  const [showExport, setShowExport] = useState(false);

  // Single source of truth: use activeStationId, not shift-existence heuristic
  const isLube = activeStationId === 'st_lube';

  // Categories list helper — lube-appropriate labels
  const baseExpenseCategories = isLube ? [
    { id: 'meals', label: 'Staff Food & Meals', urdu: 'عملے کا کھانا' },
    { id: 'maintenance', label: 'Shop Maintenance', urdu: 'دکان کی دیکھ بھال/مرمت' },
    { id: 'electricity', label: 'Utility Grid Bills', urdu: 'بجلی اور گیس بل' },
    { id: 'workshop_tools', label: 'Workshop Tools & Equipment', urdu: 'ورکشاپ ٹولز اور سامان' },
    { id: 'salary', label: 'Staff Wages/Pay', urdu: 'عملے کی تنخواہ' },
    { id: 'stationery', label: 'Stationery & Packaging', urdu: 'اسٹیشنری و پیکنگ' },
    { id: 'other', label: 'Miscellaneous Other', urdu: 'دیگر متفرق اخراجات' }
  ] : [
    { id: 'meals', label: 'Staff Food & Meals', urdu: 'عملے کا کھانا' },
    { id: 'maintenance', label: 'Pump Maintenance', urdu: 'پمپ کی دیکھ بھال/مرمت' },
    { id: 'electricity', label: 'Utility Grid Bills', urdu: 'بجلی اور گیس بل' },
    { id: 'generator_fuel', label: 'Generator Fuel Oil', urdu: 'جنریٹر کا ایندھن' },
    { id: 'salary', label: 'Operator Wages/Pay', urdu: 'عملے کی تنخواہ' },
    { id: 'stationery', label: 'Stationery & Slips', urdu: 'اسٹیشنری و پرنٹنگ' },
    { id: 'other', label: 'Miscellaneous Other', urdu: 'دیگر متفرق اخراجات' }
  ];

  const expenseCategories = useMemo(() => {
    const custom = settings.customExpenseCategories || [];
    return [...baseExpenseCategories, ...custom];
  }, [baseExpenseCategories, settings.customExpenseCategories]);

  // Compile ALL expenses dynamically (Shifts expenses + standalone expenses)
  const allExpenses = useMemo(() => {
    const list: ExpenseEntry[] = [...standaloneExpenses];

    shifts.forEach(sh => {
      // Find expense logged inside shift session
      sh.expenseEntries.forEach(exp => {
        list.push({
          ...exp,
          // Retain parent shift context
          id: `shift_${sh.id}_${exp.id}`,
          date: sh.date // overwrite or fallback to shift execution date
        });
      });
    });

    // Sort by Date descending
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, standaloneExpenses]);

  // Handle Search and category filtering
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesPayment = paymentModeFilter === 'all' || e.paidFrom === paymentModeFilter;
      const matchesTime = isWithinTimeFilter(e.date);
      return matchesSearch && matchesCategory && matchesPayment && matchesTime;
    });
  }, [allExpenses, searchQuery, categoryFilter, paymentModeFilter, timeFilter]);

  const exportColumns = [
    { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
    { key: 'category', label: 'Category', urduLabel: 'کیٹیگری' },
    { key: 'description', label: 'Description', urduLabel: 'تفصیل' },
    { key: 'paidFrom', label: 'Paid From', urduLabel: 'ادائیگی کا ذریعہ' },
    { key: 'amount', label: 'Amount', urduLabel: 'رقم' }
  ];

  // Aggregate metrics
  const totalAmountSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const categoryAggs = useMemo(() => {
    const map: Record<string, number> = {};
    expenseCategories.forEach(cat => { map[cat.id] = 0; });

    allExpenses.forEach(e => {
      if (map[e.category] !== undefined) {
        map[e.category] += e.amount;
      } else {
        map['other'] = (map['other'] || 0) + e.amount;
      }
    });

    return Object.entries(map).map(([k, v]) => ({
      categoryId: k,
      amount: v,
      percentage: allExpenses.length > 0 ? Math.round((v / allExpenses.reduce((sum, x) => sum + x.amount, 0)) * 100) : 0,
      label: expenseCategories.find(item => item.id === k)?.label || k,
      urduLabel: expenseCategories.find(item => item.id === k)?.urdu || k
    })).sort((a, b) => b.amount - a.amount);
  }, [allExpenses]);


  // ==========================================
  // FORM SUBMIT HANDLERS
  // ==========================================

  const handleCreateExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(formAmount);
    if (!amt || amt <= 0) {
      showToast(t('Please enter a valid expense amount.', 'براہ کرم درست خرچہ رقم درج کریں۔'), 'error');
      return;
    }

    if (!formDescription) {
      showToast(t('Please describe the expenditure.', 'تفصیل لکھنا ضروری ہے۔'), 'error');
      return;
    }

    if (formCategory === 'salary') {
      showToast(t('Please use the Staff module to process salaries to maintain the ledger.', 'تنخواہ کا اندراج سٹاف ماڈیول سے کریں۔'), 'error');
      return;
    }

    // Capture standalone direct expense entry
    const newExp: ExpenseEntry = {
      id: `exp_${Date.now()}`,
      category: formCategory,
      amount: amt,
      description: formDescription,
      date: new Date().toISOString().split('T')[0],
      paidFrom: formPaidFrom
    };

    onAddStandaloneExpense(newExp);

    setFormAmount('');
    setFormDescription('');
    setShowAddExpense(false);
    showToast(t('Direct station expense registered successfully!', 'اسٹیشن کا براہ راست خرچہ رجسٹر ہو گیا!'), 'success');
  };

  const handleExpenseAutoFill = (data: any) => {
    if (data.Amount) {
      const amtMatch = String(data.Amount).replace(/[^0-9.]/g, '');
      if (amtMatch) setFormAmount(amtMatch);
    }
    
    if (data.Category || data['Product Details']) {
      const text = String(data.Category || data['Product Details']).toLowerCase();
      if (text.includes('meal') || text.includes('food')) setFormCategory('meals');
      else if (text.includes('mainten') || text.includes('repair')) setFormCategory('maintenance');
      else if (text.includes('elect') || text.includes('util') || text.includes('bill')) setFormCategory('electricity');
      else if (text.includes('gen') || text.includes('fuel')) setFormCategory('generator_fuel');
      else if (text.includes('sal') || text.includes('wage')) setFormCategory('salary');
      else if (text.includes('stat') || text.includes('print') || text.includes('paper')) setFormCategory('stationery');
      else setFormCategory('other');
    }
    
    let desc = '';
    if (data['Supplier/Customer Name'] && data['Supplier/Customer Name'] !== 'N/A') desc += `${data['Supplier/Customer Name']} - `;
    if (data['Product Details'] && data['Product Details'] !== 'N/A') desc += data['Product Details'];
    
    if (desc) setFormDescription(desc);
    else if (data.Remarks) setFormDescription(data.Remarks);
    
    if (data['Payment Method']) {
      const pMode = String(data['Payment Method']).toLowerCase();
      if (pMode.includes('bank') || pMode.includes('card') || pMode.includes('transfer')) setFormPaidFrom('bank');
      else setFormPaidFrom('cash');
    }

    setTimeout(() => {
      setIsScannerOpen(false);
      showToast('Form auto-filled from receipt!', 'success');
    }, 1500);
  };

  // Aggregate widget stats based on filtered list
  const widgetStats = useMemo(() => {
    let mealsSum = 0;
    let maintenanceSum = 0;
    let salaryAndUtilSum = 0;

    filteredExpenses.forEach(e => {
      if (e.category === 'meals') {
        mealsSum += e.amount;
      } else if (e.category === 'maintenance') {
        maintenanceSum += e.amount;
      } else if (e.category === 'salary' || e.category === 'electricity' || e.category === 'generator_fuel') {
        salaryAndUtilSum += e.amount;
      }
    });

    return {
      mealsSum,
      maintenanceSum,
      salaryAndUtilSum
    };
  }, [filteredExpenses]);

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel || !newCatUrdu) {
      showToast(t('Please enter both English and Urdu names.', 'براہ کرم انگلش اور اردو دونوں نام درج کریں۔'), 'error');
      return;
    }
    const id = 'custom_' + Date.now();
    const newCat = { id, label: newCatLabel, urdu: newCatUrdu };
    const currentCustom = settings.customExpenseCategories || [];
    handleUpdateSettings({
      ...settings,
      customExpenseCategories: [...currentCustom, newCat]
    });
    setNewCatLabel('');
    setNewCatUrdu('');
    showToast(t('Custom category added!', 'کسٹم کیٹیگری شامل کر دی گئی!'), 'success');
  };

  const handleDeleteCustomCategory = (id: string) => {
    if (!window.confirm(t('Are you sure you want to delete this category?', 'کیا آپ واقعی یہ کیٹیگری حذف کرنا چاہتے ہیں؟'))) return;
    const currentCustom = settings.customExpenseCategories || [];
    handleUpdateSettings({
      ...settings,
      customExpenseCategories: currentCustom.filter(c => c.id !== id)
    });
    showToast(t('Custom category deleted!', 'کسٹم کیٹیگری حذف کر دی گئی!'), 'success');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">

      {/* HEADER ROW WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">OPERATIONS</span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Coins className="h-6 w-6 text-orange-600" />
            <span>{t('Operational Expenses', 'اخراجات اور کاروباری بلنگ')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t('Audit and document stationary purchases, machinery calibrations, meals and overheads.', 'اسٹیشن کے تمام آپریشنل اور ذاتی اخراجات، تنخواہیں اور مرمت کے بلوں کی مانیٹرنگ۔')}
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
            onClick={() => setShowManageCategories(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 font-sans text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-200 transition-all cursor-pointer"
          >
            <Settings2 className="h-4 w-4" />
            <span>{t('Categories', 'کیٹیگریز')}</span>
          </button>
          
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-md shadow-orange-500/10 hover:bg-orange-700 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('+ Log Expense', 'نیا خرچہ لکھیں')}</span>
          </button>
        </div>
      </div>

      {/* UNIVERSAL MODULE SEARCH BAR */}
      <ModuleSearchBar
        moduleName={t('Expenses', 'اخراجات')}
        placeholder={t('Search notes description...', 'تفصیل تلاش کریں...')}
        onSearch={setSearchQuery}
        onExport={() => setShowExport(true)}
      />

      {/* DYNAMIC KPI CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AMBER CARD - TOTAL SPEND */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">TOTAL SPEND</span>
              <h3 className="font-sans text-2xl font-black text-amber-900 mt-1 truncate animate-pulse">
                {formatCurrency(totalAmountSpent, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 animate-bounce">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>{t('Summed active company expenses', 'مجموعی اخراجات کی رقم')}</span>
          </div>
        </div>

        {/* GREEN CARD - STAFF FOOD & MEALS */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">STAFF FOOD & MEALS</span>
              <h3 className="font-sans text-2xl font-black text-emerald-900 mt-1">
                {formatCurrency(widgetStats.mealsSum, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <Utensils className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <span>{t('Welfare & daily lunches cost', 'سٹاف فلاح و بہبود کھانا')}</span>
          </div>
        </div>

        {/* CRIMSON CARD - PUMP MAINTENANCE */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">{isLube ? 'SHOP MAINTENANCE' : 'PUMP MAINTENANCE'}</span>
              <h3 className="font-sans text-2xl font-black text-rose-900 mt-1">
                {formatCurrency(widgetStats.maintenanceSum, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-700 font-bold">
            <span>{isLube ? t('Shop repairs & equipment', 'مرمت اور ساز و سامان') : t('Nozzles, calibrations & repairs', 'مرمت اور دیکھ بھال کا خرچہ')}</span>
          </div>
        </div>

        {/* BLUE CARD - OPERATOR WAGES & UTILITIES */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">WAGES & UTILITIES</span>
              <h3 className="font-sans text-2xl font-black text-blue-900 mt-1">
                {formatCurrency(widgetStats.salaryAndUtilSum, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Lightbulb className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-blue-700 font-bold text-ellipsis overflow-hidden truncate">
            <span>{t('Power, salaries & gen fuel', 'بجلی بل، تنخواہیں و جنریٹر')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COMPEX: TIMELINES & DETAIL LIST OF EXPENDITURES */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* SEARCH & FILTER CONTROLS CARD */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 px-2.5 font-sans text-xs focus:border-red-550 focus:outline-hidden"
                >
                  <option value="all">{t('All Categories', 'تمام کیٹیگریز')}</option>
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{isUrdu ? c.urdu : c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 px-2.5 font-sans text-xs focus:border-red-550 focus:outline-hidden"
                >
                  <option value="all">{t('All Outflows', 'بک بقایا ادائیگی ذریعہ')}</option>
                  <option value="cash">{t('Paid from Cash Drawer', 'صرف کیش رقم')}</option>
                  <option value="bank">{t('Paid from Bank Current Account', 'بینک اکاؤنٹ منتقلی')}</option>
                </select>
              </div>

            </div>
          </div>

          {/* TABLE LOG LISTING */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full border-collapse text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-650 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('Session Date', 'تاریخ')}</th>
                  <th className="py-3 px-4">{t('Expenditure details', 'خرچہ تفصیل')}</th>
                  <th className="py-3 px-4">{t('Category', 'قسم کیٹیگری')}</th>
                  <th className="py-3 px-4">{t('Payment Type', 'ذریعہ ادائیگی')}</th>
                  <th className="py-3 px-4 text-right">{t('Amount Used', 'خرچہ رقم')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 bg-slate-50/10">
                      <EmptyState
                        icon={Notebook}
                        title={t('No expenses found for this period.', 'کوئی اخراجات درج نہیں ہیں۔')}
                        description={t('Track stationery, meals, power utilities, and repair costs.', 'ملازمین کا کھانا، بجلی کا بل، یا جنریٹر ایندھن کا خرچہ ریکارڈ کریں۔')}
                        actionLabel={t('Log New Expense', 'نیا خرچہ لکھیں')}
                        onAction={() => setShowAddExpense(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const catInfo = expenseCategories.find(c => c.id === exp.category);
                    const labelStyle = exp.paidFrom === 'cash' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-sky-50 text-sky-700 border-sky-100';

                    return (
                      <tr key={exp.id} className="hover:bg-slate-55/40">
                        <td className="py-3 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">{exp.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 pr-4">{exp.description}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {catInfo ? (isUrdu ? catInfo.urdu : catInfo.label) : exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`rounded-sm border px-1.5 py-0.5 font-bold text-[9px] uppercase ${labelStyle}`}>
                            {exp.paidFrom === 'cash' ? t('CASH BOX', 'کیش کیبن') : t('BANK ONLINE', 'بینک اکاؤنٹ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                          {formatCurrency(exp.amount, settings)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* RIGHT ANALYTICS BOARD PANEL: BURDEN CATEGORIES */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
          <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Notebook className="h-4.5 w-4.5 text-slate-400" />
            <span>{t('Categorized burden summaries', 'تفصیلی کیٹیگری موازنہ کلاسیفیکیشن')}</span>
          </h3>

          <div className="space-y-4">
            {categoryAggs.map(agg => (
              <div key={agg.categoryId} className="space-y-1.5">
                <div className="flex justify-between items-center font-sans text-xs font-semibold">
                  <span className="text-slate-700">{settings.language === 'ur' ? agg.urduLabel : agg.label}</span>
                  <span className="font-mono text-slate-500">{agg.percentage}% ({formatCurrency(agg.amount, settings)})</span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-300"
                    style={{ width: `${agg.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DETAILED LOG OVERLAY MODAL */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-red-550" />
                  <span>{t('Register Standalone Expenditure', 'اسٹیشن کا نیا روز مرہ خرچہ درج کریں')}</span>
                </h3>
                <button onClick={() => setShowAddExpense(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-sans text-sm font-bold py-2.5 hover:bg-indigo-100 transition-colors cursor-pointer mb-5 shadow-xs"
              >
                <Sparkles className="h-4.5 w-4.5" />
                {t('Auto-Fill with Receipt Scanner', 'رسید سکین کر کے آٹو فل کریں')}
              </button>

              <form onSubmit={handleCreateExpenseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Select Expenditure Category:', 'خرچہ کی قسم منتخب کریں:')}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-sans text-sm focus:border-red-500 focus:outline-hidden"
                  >
                    {expenseCategories.filter(c => c.id !== 'salary').map(c => (
                      <option key={c.id} value={c.id}>{isUrdu ? c.urdu : c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Rupees Amount (PKR):', 'اخراجات کی رقم:')}</label>
                  <input
                    type="number"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Paid From Account:', 'رقم کہاں سے ادا کی گئی:')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPaidFrom('cash')}
                      className={`py-2 rounded-lg border font-sans text-xs font-bold cursor-pointer transition-all ${
                        formPaidFrom === 'cash' ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      💵 {t('Cash counter drawer', 'کیش کیبن')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaidFrom('bank')}
                      className={`py-2 rounded-lg border font-sans text-xs font-bold cursor-pointer transition-all ${
                        formPaidFrom === 'bank' ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-xs' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      🏦 {t('Bank online transfer', 'بینک اکاؤنٹ')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Expense Narrative description:', 'خرچہ کی تفصیل:')}</label>
                  <input
                    type="text"
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Weekly tea and biscuits for shift workers"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-4 cursor-pointer"
                >
                  {t('SUBMIT EXPENDITURE BILL', 'خرچہ درج کر دیں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showManageCategories && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-indigo-550" />
                  <span>{t('Manage Expense Categories', 'اخراجات کی کیٹیگریز ترتیب دیں')}</span>
                </h3>
                <button onClick={() => setShowManageCategories(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
              </div>

              {/* List existing custom categories */}
              <div className="mb-6 space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Custom Categories:', 'آپ کی بنائی گئی کیٹیگریز:')}</label>
                {(!settings.customExpenseCategories || settings.customExpenseCategories.length === 0) ? (
                  <div className="text-center p-4 bg-slate-50 rounded-lg text-slate-400 text-xs font-bold">
                    {t('No custom categories yet.', 'ابھی تک کوئی کسٹم کیٹیگری نہیں ہے۔')}
                  </div>
                ) : (
                  settings.customExpenseCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <div className="font-bold text-sm text-slate-800">{cat.label}</div>
                        <div className="text-xs text-slate-500">{cat.urdu}</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteCustomCategory(cat.id)}
                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Category Form */}
              <form onSubmit={handleAddCustomCategory} className="space-y-4 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">{t('Create New Category:', 'نئی کیٹیگری بنائیں:')}</label>
                <div>
                  <input
                    type="text"
                    required
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder={t("Category Name (English)", "انگلش نام")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-indigo-500 focus:outline-hidden mb-3"
                  />
                  <input
                    type="text"
                    required
                    value={newCatUrdu}
                    onChange={(e) => setNewCatUrdu(e.target.value)}
                    dir="rtl"
                    placeholder={t("Category Name (Urdu)", "اردو نام")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-indigo-500 focus:outline-hidden mb-3"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold tracking-wider rounded-lg shadow-md cursor-pointer"
                >
                  {t('+ ADD CATEGORY', 'کیٹیگری شامل کریں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIDocumentScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        settings={settings}
        extractionPrompt='You are an expert fuel station accounting assistant. Extract data from this expense receipt and return it strictly as JSON with exactly these keys: "Amount" (number or string with number), "Category" (e.g. meals, maintenance, electricity, generator_fuel, salary, stationery, other), "Supplier/Customer Name", "Product Details" (what was bought), "Payment Method". Do not use markdown backticks, just the raw JSON object.'
        onDataExtracted={handleExpenseAutoFill}
      />

      <ExportToolbar
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredExpenses}
        columns={exportColumns}
        title="Expenses Report"
        filenamePrefix="expenses_report"
      />
    </div>
  );
}
