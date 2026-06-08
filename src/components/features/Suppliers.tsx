/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStation } from '../../contexts/StationContext';
import {
  Truck,
  Plus,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Phone,
  Bookmark,
  MapPin,
  Coins,
  Send,
  PlusCircle,
  Hash,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import AIDocumentScanner from '../ui/AIDocumentScanner';
import PartyLedgerModal, { LedgerEntry, PartyInfo } from '../ui/PartyLedgerModal';
import SupplierPayments from './SupplierPayments';
import { Supplier, Shift, Product, GlobalSettings, BankAccount } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import { fetchWithAuth } from '../../lib/api';
import { useFinancialStore } from '../../stores/useFinancialStore';

interface SuppliersProps {
  settings: GlobalSettings;
  suppliers: Supplier[];
  shifts: Shift[];
  products: Product[];
  banks: BankAccount[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onDeleteSupplierPayment: (shiftId: string, entryId: string) => void;
}

export default function Suppliers({
  settings,
  suppliers,
  shifts,
  products,
  banks,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onDeleteSupplierPayment
}: SuppliersProps) {
  const { showToast, showConfirm } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, settings);

  // States
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [activeTab, setActiveTab] = useState<'ledger' | 'purchases' | 'payments'>('ledger');

  // Ledger Modal State
  const [ledgerParty, setLedgerParty] = useState<PartyInfo | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Pay Bill Modal State
  const [showPayBillModal, setShowPayBillModal] = useState(false);

  // Open full ledger for a supplier
  const openSupplierLedger = (sup: Supplier) => {
    const rawEntries: LedgerEntry[] = [];
    const journalEntries = useFinancialStore.getState().journalEntries;
    
    const supplierEntries = journalEntries.filter(j => j.partyType === 'supplier' && j.partyId === sup.id);

    supplierEntries.forEach(j => {
       rawEntries.push({
          id: j.id,
          date: j.date.split('T')[0],
          description: j.description,
          debit: j.type === 'debit' ? j.amount : 0,
          credit: j.type === 'credit' ? j.amount : 0,
          balance: 0,
          tag: j.type === 'debit' ? 'Payment Made' : 'Stock Invoice'
       });
    });

    // Sort ascending, compute running balance (Credit increases what we owe, Debit reduces what we owe)
    rawEntries.sort((a, b) => a.date.localeCompare(b.date));
    let running = 0; // Ideally starting balance should be handled, but we assume 0 before first txn
    const withBalance = rawEntries.map(e => {
      running += e.credit - e.debit;
      return { ...e, balance: running };
    });

    // Reverse for latest-first display
    withBalance.reverse();

    const party: PartyInfo = {
      id: sup.id,
      name: sup.name,
      contact: sup.contact,
      accountNo: sup.accountNo,
      balance: sup.balance,
      type: 'supplier',
    };

    setLedgerParty(party);
    setLedgerEntries(withBalance);
    setIsLedgerOpen(true);
  };

  // Edit Supplier Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSuppName, setEditSuppName] = useState('');
  const [editSuppUrduName, setEditSuppUrduName] = useState('');
  const [editSuppContact, setEditSuppContact] = useState('');
  const [editSuppAccountNo, setEditSuppAccountNo] = useState('');

  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    if (!editSuppName.trim()) {
      showToast('Supplier name is required.', 'error');
      return;
    }
    const updated: Supplier = {
      ...currentSupplier,
      name: editSuppName,
      urduName: editSuppUrduName,
      contact: editSuppContact,
      accountNo: editSuppAccountNo
    };
    onUpdateSupplier(updated);
    setShowEditModal(false);
  };

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

  // Dynamic KPI calculations for Suppliers
  const kpiStats = useMemo(() => {
    // 1. Total Payables
    const totalPayables = suppliers.reduce((sum, s) => sum + s.balance, 0);

    // 2. Active Suppliers count
    const activeCount = suppliers.filter(s => s.balance > 0).length;

    // 3. Count overdue (where payable exists / is unpaid - wait, lets use suppliers with balance > 500,000 as overdue or simulated)
    const overdueCount = suppliers.filter(s => s.balance > 1000000).length;

    // 4. Ledger Entries or payments in selected period
    let paymentAmountSum = 0;
    let paymentCount = 0;

    shifts.forEach(sh => {
      if (!isWithinTimeFilter(sh.date)) return;
      sh.supplierPayments.forEach(p => {
        paymentAmountSum += p.amount;
        paymentCount++;
      });
    });

    return {
      totalPayables,
      activeCount,
      overdueCount,
      paymentAmountSum,
      paymentCount
    };
  }, [suppliers, shifts, timeFilter]);
  
  // AI Supplier Insights State
  const [isGeneratingAiInsights, setIsGeneratingAiInsights] = useState(false);
  const [aiInsightsResult, setAiInsightsResult] = useState<string | null>(null);

  const generateAISupplierInsights = async () => {
    setIsGeneratingAiInsights(true);
    setAiInsightsResult(null);
    try {
      // Limit to max 50 top suppliers to avoid token limit
      const topSuppliers = [...suppliers].sort((a, b) => b.balance - a.balance).slice(0, 50);
      const supplierContext = {
        totalPayables: kpiStats.totalPayables,
        activeSuppliers: kpiStats.activeCount,
        overdueCount: kpiStats.overdueCount,
        totalPaymentsMade: kpiStats.paymentAmountSum,
        topSuppliers: topSuppliers.map(s => ({ name: s.name, balance: s.balance }))
      };

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are an AI financial auditor for a fuel station. Analyze the provided supplier and accounts payable data. Highlight key risks, top payables, payment performance, and provide strategic recommendations in 3-4 concise sentences.',
          userMessage: JSON.stringify(supplierContext),
          language: settings.language,
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI insights');
      const data = await response.json();
      setAiInsightsResult(data.reply);
    } catch (error) {
      console.error(error);
      setAiInsightsResult(t("⚠️ Could not generate AI insights.", "⚠️ AI تجزیہ تیار نہیں ہو سکا۔"));
    } finally {
      setIsGeneratingAiInsights(false);
    }
  };

  // Modal toggle & form states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUrduName, setAddUrduName] = useState('');
  const [addContact, setAddContact] = useState('');
  const [addAccount, setAddAccount] = useState('');
  const [addOpeningBal, setAddOpeningBal] = useState('');

  // Adjust direct ledger balances
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustNature, setAdjustNature] = useState<'invoice' | 'payment'>('invoice');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustComment, setAdjustComment] = useState('');
  
  // AI Scanner state for Supplier adjustment
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSupplierAutoFill = (data: any) => {
    if (data.Amount) {
      const amtMatch = String(data.Amount).replace(/[^0-9.]/g, '');
      if (amtMatch) setAdjustAmount(amtMatch);
    }
    
    let desc = '';
    if (data['Invoice/Receipt Number'] && data['Invoice/Receipt Number'] !== 'N/A') desc += `Inv #${data['Invoice/Receipt Number']} - `;
    if (data['Supplier/Customer Name'] && data['Supplier/Customer Name'] !== 'N/A') desc += `${data['Supplier/Customer Name']} `;
    if (data['Product Details'] && data['Product Details'] !== 'N/A') desc += `(${data['Product Details']})`;
    
    if (desc.trim()) setAdjustComment(desc.trim());
    else if (data.Remarks) setAdjustComment(data.Remarks);

    // Auto-detect nature (payment receipt vs stock invoice)
    if (data.Type) {
      const t = String(data.Type).toLowerCase();
      if (t.includes('payment') || t.includes('receipt')) setAdjustNature('payment');
      else setAdjustNature('invoice');
    } else {
      setAdjustNature('invoice'); // default to invoice
    }

    setTimeout(() => {
      setIsScannerOpen(false);
      showToast('Form auto-filled from document!', 'success');
    }, 1500);
  };

  // Selected supplier object lookup
  const currentSupplier = useMemo(() => {
    if (!selectedSupplierId) return null;
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [selectedSupplierId, suppliers]);

  // Filters
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.urduName.includes(searchQuery) ||
        s.contact.includes(searchQuery)
      );
    });
  }, [suppliers, searchQuery]);

  // Historical ledger statement for chosen vendor
  const vendorLedgerLogs = useMemo(() => {
    if (!currentSupplier) return [];

    const journalEntries = useFinancialStore.getState().journalEntries;
    const supplierEntries = journalEntries.filter(j => j.partyType === 'supplier' && j.partyId === currentSupplier.id);

    const history: Array<{
      id: string;
      date: string;
      description: string;
      debit: number;  // Outflowing Payments we made to vendor (reduces our payable)
      credit: number; // Inflowing Invoice stock we bought (increases our payable)
      balance: number;
    }> = [];

    supplierEntries.forEach(j => {
       history.push({
          id: j.id,
          date: j.date.split('T')[0],
          description: j.description,
          debit: j.type === 'debit' ? j.amount : 0,
          credit: j.type === 'credit' ? j.amount : 0,
          balance: 0
       });
    });

    // Sort by Date ascending
    history.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance starting from the seed or opening balance
    let runningPayable = 0;
    const computed = history.map(item => {
      // credit increases what we owe, debit reduces what we owe
      runningPayable += item.credit - item.debit;
      return {
        ...item,
        balance: runningPayable
      };
    });

    return computed.reverse();
  }, [currentSupplier]);


  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName) return;

    const newSup: Supplier = {
      id: `s_${Date.now()}`,
      name: addName,
      urduName: addUrduName || addName,
      contact: addContact,
      accountNo: addAccount || 'N/A',
      balance: Number(addOpeningBal) || 0
    };

    onAddSupplier(newSup);

    setAddName('');
    setAddUrduName('');
    setAddContact('');
    setAddAccount('');
    setAddOpeningBal('');
    setShowAddSupplierModal(false);
  };

  const handleAdjustSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;

    const amt = Number(adjustAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    let updatedBal = currentSupplier.balance;
    if (adjustNature === 'invoice') {
      // Invoice increases what we owe
      updatedBal += amt;
    } else {
      // Payment reduces what we owe
      updatedBal -= amt;
    }

    onUpdateSupplier({
      ...currentSupplier,
      balance: updatedBal
    });

    setIsAdjusting(false);
    setAdjustAmount('');
    setAdjustComment('');
  };


  return (
    <div className="space-y-6 pb-16 lg:pb-0">

      {/* HEADER ROW WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">OPERATIONS</span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-600" />
            <span>{t('Accounts Payable', 'آئل سپلائرز اور ٹینکرز کھاتہ')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t('Manage supplier ledgers, purchases, payments, and due balances', 'آئل کمپنیوں کے چالان، چیمبر ڈیپو بلز، ٹینکرز کرایہ اور ادائیگیاں۔')}
          </p>
        </div>

        {/* TIME FILTER SELECTOR & TRIGGER ROW */}
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
            onClick={generateAISupplierInsights}
            disabled={isGeneratingAiInsights || suppliers.length === 0}
            className={`flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 transition-all cursor-pointer ${isGeneratingAiInsights ? 'opacity-50' : ''}`}
          >
            <Sparkles className={`h-4 w-4 ${isGeneratingAiInsights ? 'animate-spin' : ''}`} />
            <span>{t('AI Insights', 'اے آئی تجزیہ')}</span>
          </button>

          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-md shadow-orange-500/10 hover:bg-orange-700 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('+ Add Supplier', 'نیا سپلائر شامل کریں')}</span>
          </button>

          <button
            onClick={() => setShowPayBillModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>{t('Pay Bill', 'بل ادا کریں')}</span>
          </button>
        </div>
      </div>

      {aiInsightsResult && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="font-bold text-indigo-800 text-sm">{t('AI Supplier Insights', 'اے آئی سپلائر تجزیہ')}</span>
          </div>
          <div className="prose prose-sm max-w-none text-indigo-900 whitespace-pre-wrap leading-relaxed text-xs">
            {aiInsightsResult}
          </div>
        </div>
      )}

      {/* DYNAMIC KPI CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AMBER CARD - TOTAL PAYABLES */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">TOTAL PAYABLES</span>
              <h3 className="font-sans text-2xl font-black text-amber-900 mt-1 truncate animate-pulse">
                {formatCurrency(kpiStats.totalPayables, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 animate-bounce">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>{t('From supplier ledger database', 'لیجر کیلکولیشن کی بنیاد پر')}</span>
          </div>
        </div>

        {/* GREEN CARD - ACTIVE SUPPLIERS */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">ACTIVE SUPPLIERS</span>
              <h3 className="font-sans text-2xl font-black text-emerald-900 mt-1">
                {kpiStats.activeCount}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <span>of {suppliers.length} total active depots</span>
          </div>
        </div>

        {/* CRIMSON CARD - OVERDUE DEPOT BILLING */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">OVERDUE</span>
              <h3 className="font-sans text-2xl font-black text-rose-900 mt-1">
                {kpiStats.overdueCount}
              </h3>
            </div>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-700 font-bold">
            <span>{t('Need urgent payment focus', 'فی الفور ادائیگیوں کی ضرورت')}</span>
          </div>
        </div>

        {/* BLUE CARD - LEDGER TRANS/PAYMENTS */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">LEDGER ENTRIES</span>
              <h3 className="font-sans text-2xl font-black text-blue-900 mt-1">
                {kpiStats.paymentCount}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <PlusCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-blue-700 font-bold text-ellipsis overflow-hidden truncate">
            <span>Paid: {formatCurrency(kpiStats.paymentAmountSum, settings)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: LIST OF OIL VENDORS */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="relative">
              <Plus className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search oil company...', 'سپلائر تلا ش کریں...')}
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 font-sans text-xs shadow-inner focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {suppliers.length === 0 ? (
              <EmptyState
                icon={Truck}
                title={t('No suppliers yet.', 'کوئی سپلائر موجود نہیں ہے۔')}
                description={t('Register oil companies to record direct fuel stock purchases and billing ledger sheets.', 'آئل کمپنیوں کے چالان، چیمبر ڈیپو بلز اور ادائیگیاں ریکارڈ کرنے کے لیے سپلائرز شامل کریں۔')}
                actionLabel={t('+ Add Supplier', '+ سپلائر اکاؤنٹ بنائیں')}
                onAction={() => setShowAddSupplierModal(true)}
              />
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-sans bg-white border border-dashed border-slate-200 rounded-xl">
                {t('No suppliers matched search.', 'کوئی سپلائر میچ نہیں ہوا۔')}
              </div>
            ) : (
              filteredSuppliers.map((sup, idx) => {
                const isSelected = selectedSupplierId === sup.id;
                const payable = sup.balance;
                const isDue = payable > 0;

                return (
                  <motion.button
                    key={sup.id}
                    onClick={() => setSelectedSupplierId(sup.id)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
                    className={`relative w-full text-left rounded-xl border p-4 shadow-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-md bg-amber-500"></div>

                    <div className="pl-2">
                      <h4 className="font-sans text-xs font-bold text-slate-800">
                        {t(sup.name, sup.urduName)}
                      </h4>
                      <span className="font-mono text-[9px] text-slate-400 mt-1 block">
                        📞 {sup.contact}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`font-mono text-xs font-bold block ${isDue ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatCurrency(Math.abs(payable), settings)}
                      </span>
                      <span className="font-sans text-[9px] text-slate-400 uppercase tracking-widest block">
                        {isDue ? t('Payable', 'واجب الادا') : t('Settled', 'بے باق')}
                      </span>
                      {/* Ledger button */}
                      <button
                        onClick={e => { e.stopPropagation(); openSupplierLedger(sup); }}
                        className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 font-sans text-[10px] font-bold text-white hover:bg-slate-900 transition-colors cursor-pointer mt-1"
                      >
                        <Clock className="h-3 w-3" />
                        <span>View Ledger</span>
                      </button>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (2/3 WIDTH): VENDOR TRANSACTION SHEET AND ADJUSTMENT BAR */}
        <div className="lg:col-span-2">
          {currentSupplier ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
              
              {/* Header profile info */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-3 items-center flex-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shrink-0">
                    <Truck className="h-5.5 w-5.5 text-orange-650" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans text-sm font-bold text-slate-900 leading-tight truncate">
                        {t(currentSupplier.name, currentSupplier.urduName)}
                      </h3>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditSuppName(currentSupplier.name);
                            setEditSuppUrduName(currentSupplier.urduName);
                            setEditSuppContact(currentSupplier.contact);
                            setEditSuppAccountNo(currentSupplier.accountNo);
                            setShowEditModal(true);
                          }}
                          className="px-2 py-0.5 font-sans text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer"
                        >
                          ✏️ {t('Edit', 'ترمیم')}
                        </button>
                        <button
                          onClick={() => {
                            if (currentSupplier.balance !== 0) {
                              showToast(t(
                                `Cannot delete “${currentSupplier.name}” — outstanding payable of Rs.${currentSupplier.balance.toLocaleString()} must be cleared first.`,
                                `سپلائر کا کھاتہ حذف نہیں ہو سکتا ہے کیونکہ بیلنس باقی ہے۔`
                              ), 'error');
                              return;
                            }
                            showConfirm(
                              t('Confirm Supplier Deletion', 'سپلائر حذف کرنے کی تصدیق'),
                              t(
                                `Delete supplier “${currentSupplier.name}”? This cannot be undone.`,
                                `کیا آپ واقعی اس سپلائر کو حذف کرنا چاہتے ہیں؟`
                              ),
                              () => {
                                onDeleteSupplier(currentSupplier.id);
                                setSelectedSupplierId(null);
                              }
                            );
                          }}
                          className="px-2 py-0.5 font-sans text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 cursor-pointer"
                        >
                          🗑️ {t('Delete', 'حذف')}
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">📞 {currentSupplier.contact}</span>
                      <span className="flex items-center gap-1">🏦 Bank IBAN: {currentSupplier.accountNo}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-orange-55/10 px-4 py-2 border border-orange-100 text-right shrink-0">
                  <span className="font-sans text-[9px] text-orange-605 font-bold uppercase tracking-wider block">{t('Amount We Owe (Payable Balance):', 'کل واجب الادا دوقم (پیبل بیلنس):')}</span>
                  <strong className="font-mono text-lg font-bold text-orange-705 block mt-0.5">{formatCurrency(currentSupplier.balance, settings)}</strong>
                </div>
              </div>

              {/* Adjust direct manual balance ledger form */}
              <div className="border border-slate-200 border-dashed rounded-lg p-4 bg-slate-50/60">
                {!isAdjusting ? (
                  <button
                    onClick={() => setIsAdjusting(true)}
                    className="w-full py-2 bg-slate-800 text-white font-sans text-xs font-bold rounded-md hover:bg-slate-900 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('ADD MANUAL BILL/INVOICE OR PAYMENT', 'براہ راست بل چالان / ادائیگی انٹری درج کریں')}</span>
                  </button>
                ) : (
                  <form onSubmit={handleAdjustSupplierSubmit} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                      <strong className="font-sans text-xs font-bold text-slate-700">{t('Direct Vendor Adjustment Invoice:', 'سپلائر تصحیح فارم:')}</strong>
                      <button type="button" onClick={() => setIsAdjusting(false)} className="text-xs font-bold text-slate-400">Cancel</button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-sans text-xs font-bold py-2 hover:bg-indigo-100 transition-colors cursor-pointer mb-3 shadow-xs"
                    >
                      <Sparkles className="h-4 w-4" />
                      {t('Auto-Fill with Invoice Scanner', 'بل سکین کر کے آٹو فل کریں')}
                    </button>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Transaction Nature:', 'انٹری کی قسم:')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAdjustNature('invoice')}
                            className={`py-1.5 rounded-md border font-sans text-xs font-bold cursor-pointer ${
                              adjustNature === 'invoice' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            ➕ {t('Wholesale Invoice (+)', 'سٹاک چالان بل (+)')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustNature('payment')}
                            className={`py-1.5 rounded-md border font-sans text-xs font-bold cursor-pointer ${
                              adjustNature === 'payment' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            ➖ {t('Payment Made (–)', 'رقم ادائیگی (–)')}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t(`Amount Bill (${getCurrencySymbol(settings)}):`, 'بل رقم (روپے):')}</label>
                        <input
                          type="number"
                          required
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="e.g. 500000"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-sm focus:border-orange-500 outline-hidden"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Invoice / Chalan reference reference number:', 'تفصیل / چالان حوالہ نمبر:')}</label>
                        <input
                          type="text"
                          required
                          value={adjustComment}
                          onChange={(e) => setAdjustComment(e.target.value)}
                          placeholder="e.g. PSO Delivery tanker invoice #DEP-293"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs focus:border-orange-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg shadow-md hover:bg-orange-700 cursor-pointer"
                    >
                      {t('SUBMIT VENDOR ADJUSTMENT', 'انٹری محفوظ کریں')}
                    </button>
                  </form>
                )}
              </div>

              {/* Ledger TIMELINES history */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                  <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    {t('Ledger History', 'لیجر ہسٹری')}
                  </h4>
                  <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button
                      onClick={() => setActiveTab('ledger')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${activeTab === 'ledger' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t('Running Ledger', 'مکمل لیجر')}
                    </button>
                    <button
                      onClick={() => setActiveTab('purchases')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${activeTab === 'purchases' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t('Purchases', 'خریداری')}
                    </button>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${activeTab === 'payments' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t('Payments', 'ادائیگیاں')}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-105">
                  <table className="w-full border-collapse text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-650 font-bold">
                        <th className="py-2.5 px-3">{t('Date', 'تاریخ')}</th>
                        <th className="py-2.5 px-3">{t('Description', 'تفصیل')}</th>
                        {activeTab !== 'payments' && <th className="py-2.5 px-3 text-right">{t('Purchase (+)', 'خریداری (+)')}</th>}
                        {activeTab !== 'purchases' && <th className="py-2.5 px-3 text-right">{t('Payment (-)', 'ادائیگی (-)')}</th>}
                        {activeTab === 'ledger' && <th className="py-2.5 px-3 text-right">{t('Balance', 'بیلنس')}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-705">
                      {vendorLedgerLogs.filter(v => 
                        activeTab === 'ledger' || 
                        (activeTab === 'purchases' && v.credit > 0) || 
                        (activeTab === 'payments' && v.debit > 0)
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            {t('No records found for the selected view.', 'کوئی ریکارڈ نہیں ملا۔')}
                          </td>
                        </tr>
                      ) : (
                        vendorLedgerLogs.filter(v => 
                          activeTab === 'ledger' || 
                          (activeTab === 'purchases' && v.credit > 0) || 
                          (activeTab === 'payments' && v.debit > 0)
                        ).map(v => (
                          <tr key={v.id} className="hover:bg-slate-55/40">
                            <td className="py-3 px-3 font-mono font-medium text-slate-500">{v.date}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800 leading-tight pr-4">{v.description}</td>
                            {activeTab !== 'payments' && <td className="py-3 px-3 text-right font-mono font-bold text-red-550">{v.credit > 0 ? `${formatCurrency(v.credit, settings)}` : '—'}</td>}
                            {activeTab !== 'purchases' && <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">{v.debit > 0 ? `${formatCurrency(v.debit, settings)}` : '—'}</td>}
                            {activeTab === 'ledger' && <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(v.balance, settings)}</td>}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full rounded-xl border border-dashed border-slate-250 py-32 text-center text-slate-400 font-sans text-xs flex flex-col justify-center items-center gap-3">
              <Hash className="h-10 w-10 text-slate-300" />
              <span>{t('Select an oil supply company or vendor layout on the left to review records.', 'بائیں پینل سے کسی آئل کمپنی یا سپلائر کا انتخاب کیجئے')}</span>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW MODAL */}
      <AnimatePresence>
        {showAddSupplierModal && (
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
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <span>{t('Register Oil Company Supplier', 'نیا آئل سپلائر کھاتہ کھولیں')}</span>
                </h3>
                <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
              </div>

              <form onSubmit={handleCreateSupplierSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Supplier Company Name:', 'سپلائر کمپنی کا نام (انگلش):')}</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Umar Ali"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Urdu Name Representation:', 'سپلائر کمپنی کا نام (اردو):')}</label>
                  <input
                    type="text"
                    value={addUrduName}
                    onChange={(e) => setAddUrduName(e.target.value)}
                    placeholder="مثال: شیل پیٹرولیم پاکستان"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Official Mobile / Fax No:', 'آفیس فون / موبائل نمبر:')}</label>
                  <input
                    type="text"
                    value={addContact}
                    onChange={(e) => setAddContact(e.target.value)}
                    placeholder="e.g. 03168432329"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Deposit Bank IBAN Account No:', 'بینک اکاؤنٹ نمبر (آئی بی اے این):')}</label>
                  <input
                    type="text"
                    value={addAccount}
                    onChange={(e) => setAddAccount(e.target.value)}
                    placeholder="e.g. HBL-ONLINE-9923"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Initial Opening Payable Dues:', 'ابتدائی واجب الادا بقایا رقم:')}</label>
                  <input
                    type="number"
                    value={addOpeningBal}
                    onChange={(e) => setAddOpeningBal(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-4 cursor-pointer"
                >
                  {t('CREATE VENDOR ACCOUNT', 'سپلائر اکاؤنٹ بنائیں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Supplier Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <span>{t('Edit Supplier Profile', 'سپلائر پروفائل میں ترمیم کریں')}</span>
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
              </div>

              <form onSubmit={handleEditSupplierSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Supplier Company Name:', 'سپلائر کمپنی کا نام (انگلش):')}</label>
                  <input
                    type="text"
                    required
                    value={editSuppName}
                    onChange={(e) => setEditSuppName(e.target.value)}
                    placeholder="e.g. Umar Ali"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Urdu Name Representation:', 'سپلائر کمپنی کا نام (اردو):')}</label>
                  <input
                    type="text"
                    value={editSuppUrduName}
                    onChange={(e) => setEditSuppUrduName(e.target.value)}
                    placeholder="مثال: شیل پیٹرولیم پاکستان"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Official Mobile / Fax No:', 'آفیس فون / موبائل نمبر:')}</label>
                  <input
                    type="text"
                    value={editSuppContact}
                    onChange={(e) => setEditSuppContact(e.target.value)}
                    placeholder="e.g. 03168432329"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Deposit Bank IBAN Account No:', 'بینک اکاؤنٹ نمبر (آئی بی اے این):')}</label>
                  <input
                    type="text"
                    value={editSuppAccountNo}
                    onChange={(e) => setEditSuppAccountNo(e.target.value)}
                    placeholder="e.g. HBL-ONLINE-9923"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-4 cursor-pointer"
                >
                  {t('UPDATE VENDOR PROFILE', 'سپلائر پروفائل اپ ڈیٹ کریں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL-SCREEN PARTY LEDGER MODAL ── */}
      <PartyLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        party={ledgerParty}
        entries={ledgerEntries}
        settings={settings}
        debitLabel="Payment Made (Dr)"
        creditLabel="Stock Invoice (Cr)"
        accentColor="emerald"
      />

      <AnimatePresence>
        {showPayBillModal && (
          <SupplierPayments
            suppliers={suppliers}
            banks={banks}
            settings={settings}
            onClose={() => setShowPayBillModal(false)}
          />
        )}
      </AnimatePresence>

      <AIDocumentScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        settings={settings}
        extractionPrompt='You are an expert accounting assistant. Extract data from this supplier invoice or payment receipt and return it strictly as JSON with exactly these keys: "Amount" (number or string with number), "Type" (either "invoice" for stock purchase, or "payment" for payment made), "Supplier/Customer Name", "Invoice/Receipt Number", "Product Details" (items purchased or payment method). Do not use markdown backticks, just the raw JSON object.'
        onDataExtracted={handleSupplierAutoFill}
      />

    </div>
  );
}
