/**
 * FuelPro — Supplier Payables Intelligence Panel
 * Tracks outstanding payables, aging by supplier, due dates, cash forecast
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */
import React, { useMemo, useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Building2, ChevronDown, ChevronUp,
  Wallet
} from 'lucide-react';
import { StockBatch, Supplier } from '../../../types';

interface SupplierPayablesPanelProps {
  suppliers: Supplier[];
  batches: StockBatch[];
  language: string;
  onRecordPayment?: (supplierId: string, amount: number, note: string) => void;
}

// Payable aging buckets
type PayableTier = 'current' | '1-30' | '31-60' | '60+';

interface SupplierPayable {
  supplier: Supplier;
  totalOutstanding: number;
  batches: StockBatch[];
  payableBuckets: {
    current: number;
    days1_30: number;
    days31_60: number;
    days60plus: number;
  };
  oldestDueDate: string | null;
  isOverdue: boolean;
  concentrationPct: number;
  upcomingDue7Days: number;
}

function getDaysOverdue(dueDateStr?: string): number {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr).getTime();
  const today = Date.now();
  const diff = today - due;
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

function getPayableTierForBatch(b: StockBatch): PayableTier {
  if (!b.paymentDueDate) return 'current';
  const days = getDaysOverdue(b.paymentDueDate);
  if (days <= 0) return 'current';
  if (days <= 30) return '1-30';
  if (days <= 60) return '31-60';
  return '60+';
}

function PaymentModal({
  supplier, onClose, onSave,
}: {
  supplier: Supplier;
  onClose: () => void;
  onSave: (amount: number, note: string, mode: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'cash' | 'bank' | 'cheque'>('cash');

  return (
    <div className="premium-modal-overlay">
      <div className="bg-theme-card rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white">
          <h3 className="font-black text-lg">💳 Record Payment</h3>
          <p className="text-slate-300 text-sm mt-0.5">To: {supplier.name}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Amount (Rs.)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full border border-theme-main rounded-xl px-4 py-2.5 text-slate-800 text-sm font-mono focus:outline-none focus:border-orange-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Payment Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['cash', 'bank', 'cheque'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                    mode === m ? 'bg-orange-600 text-white border-orange-600' : 'bg-theme-bg text-slate-600 border-theme-main hover:border-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reference / Note</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Cheque no. / Transfer ref..."
              className="w-full border border-theme-main rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-theme-main text-slate-600 text-sm font-bold hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={() => {
                const amt = parseFloat(amount);
                if (amt > 0) onSave(amt, note || `Payment via ${mode}`, mode);
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-black hover:bg-orange-700 disabled:opacity-50"
            >
              💾 Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupplierPayablesPanel({
  suppliers, batches, language, onRecordPayment
}: SupplierPayablesPanelProps) {
  const t = (en: string, ur: string) => language === 'ur' ? ur : en;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [filterTier, setFilterTier] = useState<PayableTier | 'all'>('all');

  // Build per-supplier payable data from supplier balance + batch records
  const payables = useMemo<SupplierPayable[]>(() => {
    const totalAllOutstanding = suppliers.reduce((s, sup) => s + Math.max(0, sup.balance), 0);

    return suppliers
      .map(supplier => {
        const supplierBatches = batches.filter(b => b.supplierId === supplier.id && (b.paymentMethod === 'credit' || b.paymentMethod === 'partial' || (b.outstandingBalance && b.outstandingBalance > 0)));

        const buckets = { current: 0, days1_30: 0, days31_60: 0, days60plus: 0 };
        for (const b of supplierBatches) {
          const outstanding = b.outstandingBalance || 0;
          if (outstanding <= 0) continue;
          const tier = getPayableTierForBatch(b);
          if (tier === 'current') buckets.current += outstanding;
          else if (tier === '1-30') buckets.days1_30 += outstanding;
          else if (tier === '31-60') buckets.days31_60 += outstanding;
          else buckets.days60plus += outstanding;
        }

        const totalOutstanding = Math.max(0, supplier.balance);
        const oldestDue = supplierBatches
          .filter(b => b.paymentDueDate)
          .sort((a, b) => new Date(a.paymentDueDate!).getTime() - new Date(b.paymentDueDate!).getTime())[0]?.paymentDueDate || null;

        const isOverdue = totalOutstanding > 0 && !!oldestDue && getDaysOverdue(oldestDue) > 0;

        // Due in next 7 days
        const next7 = new Date();
        next7.setDate(next7.getDate() + 7);
        const upcomingDue7Days = supplierBatches
          .filter(b => b.paymentDueDate && new Date(b.paymentDueDate) <= next7 && (b.outstandingBalance || 0) > 0)
          .reduce((s, b) => s + (b.outstandingBalance || 0), 0);

        return {
          supplier,
          totalOutstanding,
          batches: supplierBatches,
          payableBuckets: buckets,
          oldestDueDate: oldestDue,
          isOverdue,
          concentrationPct: totalAllOutstanding > 0 ? (totalOutstanding / totalAllOutstanding) * 100 : 0,
          upcomingDue7Days,
        };
      })
      .filter(p => p.totalOutstanding > 0)
      .filter(p => {
        if (filterTier === 'all') return true;
        if (filterTier === 'current') return p.payableBuckets.current > 0;
        if (filterTier === '1-30') return p.payableBuckets.days1_30 > 0;
        if (filterTier === '31-60') return p.payableBuckets.days31_60 > 0;
        if (filterTier === '60+') return p.payableBuckets.days60plus > 0;
        return true;
      })
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [suppliers, batches, filterTier]);

  // Fleet totals
  const totalPayable = suppliers.reduce((s, sup) => s + Math.max(0, sup.balance), 0);
  const overduePayable = payables.filter(p => p.isOverdue).reduce((s, p) => s + p.payableBuckets.days1_30 + p.payableBuckets.days31_60 + p.payableBuckets.days60plus, 0);
  const next7DaysRequired = payables.reduce((s, p) => s + p.upcomingDue7Days, 0);
  const largestLiability = payables.reduce((max, p) => p.totalOutstanding > max ? p.totalOutstanding : max, 0);

  return (
    <div className="space-y-5">
      {/* Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('Total Payable', 'کل ادائیگی'), value: `Rs.${(totalPayable / 1000000).toFixed(2)}M`, icon: Wallet, color: 'text-slate-700', bg: 'bg-theme-bg border-theme-main' },
          { label: t('Overdue', 'مدت گزر گئی'), value: `Rs.${(overduePayable / 1000).toFixed(0)}K`, icon: AlertTriangle, color: 'text-red-700', bg: overduePayable > 0 ? 'bg-red-50 border-red-200' : 'bg-theme-bg border-theme-main' },
          { label: t('Due in 7 Days', '7 دن میں واجب'), value: `Rs.${(next7DaysRequired / 1000).toFixed(0)}K`, icon: Calendar, color: 'text-orange-700', bg: next7DaysRequired > 0 ? 'bg-orange-50 border-orange-200' : 'bg-theme-bg border-theme-main' },
          { label: t('Largest Liability', 'سب سے بڑی ذمہ داری'), value: `Rs.${(largestLiability / 1000).toFixed(0)}K`, icon: Building2, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${s.bg} flex items-center gap-3`}>
            <div className="size-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
              <s.icon className={`size-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cash Forecast Banner */}
      {next7DaysRequired > 0 && (
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-4 text-white flex items-center gap-3 shadow-md">
          <Calendar className="size-8 shrink-0" />
          <div>
            <p className="font-black text-base">
              {t('7-Day Cash Requirement Forecast', '7 دن کا نقد ادائیگی تخمینہ')}
            </p>
            <p className="text-orange-100 text-sm mt-0.5">
              <span className="text-white font-black text-lg">Rs.{next7DaysRequired.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
              {' '}{t('required for upcoming supplier payments', 'آنے والی سپلائر ادائیگیوں کیلئے درکار')}
            </p>
          </div>
        </div>
      )}

      {/* Payable Aging Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: t('All', 'سب') },
          { id: 'current', label: t('Current', 'موجودہ') },
          { id: '1-30', label: t('1–30 Days', '1–30 دن') },
          { id: '31-60', label: t('31–60 Days', '31–60 دن') },
          { id: '60+', label: t('60+ Days', '60+ دن') },
        ].map(f => (
          <button
            key={f.id}
             
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => setFilterTier(f.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              filterTier === f.id
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-theme-card text-slate-600 border-theme-main hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Supplier Payable List */}
      {payables.length === 0 ? (
        <div className="premium-card border border-theme-main text-center">
          <CheckCircle className="size-12 mx-auto text-emerald-400 mb-3" />
          <p className="font-bold text-slate-400 text-lg">{t('No outstanding payables', 'کوئی واجب الادا رقم نہیں')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('All supplier balances are settled.', 'تمام سپلائر بیلنس صاف ہیں۔')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payables.map(p => {
            const isExpanded = expandedId === p.supplier.id;
            const daysOverdue = getDaysOverdue(p.oldestDueDate || undefined);

            return (
              <div key={p.supplier.id} className={`bg-theme-card rounded-2xl border shadow-sm overflow-hidden ${p.isOverdue ? 'border-red-200' : 'border-theme-main'}`}>
                {/* Main row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : p.supplier.id)}
                >
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${p.isOverdue ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <Building2 className={`size-5 ${p.isOverdue ? 'text-red-600' : 'text-slate-500'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-800">{p.supplier.name}</span>
                      {p.isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          🔴 Overdue {daysOverdue}d
                        </span>
                      )}
                      {p.concentrationPct > 40 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                          ⚠️ High Concentration {p.concentrationPct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {p.oldestDueDate && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due: {new Date(p.oldestDueDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {p.upcomingDue7Days > 0 && (
                          <span className="ml-2 text-orange-600 font-semibold">Rs.{(p.upcomingDue7Days / 1000).toFixed(0)}K due this week</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-slate-800">
                      Rs.{(p.totalOutstanding / 1000).toFixed(0)}K
                    </p>
                    <p className="text-[10px] text-slate-400">{p.concentrationPct.toFixed(1)}% of total</p>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); setPayingSupplier(p.supplier); }}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors shrink-0"
                  >
                    Pay
                  </button>

                  {isExpanded ? <ChevronUp className="size-4 text-slate-400 shrink-0" /> : <ChevronDown className="size-4 text-slate-400 shrink-0" />}
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-theme-bg p-4">
                    {/* Aging breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Current', value: p.payableBuckets.current, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                        { label: '1–30 Days', value: p.payableBuckets.days1_30, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
                        { label: '31–60 Days', value: p.payableBuckets.days31_60, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' },
                        { label: '60+ Days', value: p.payableBuckets.days60plus, color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
                      ].map((bucket, i) => (
                        <div key={i} className={`rounded-xl p-2.5 border text-center ${bucket.bg}`}>
                          <p className="text-[10px] text-slate-500 font-semibold mb-1">{bucket.label}</p>
                          <p className={`text-sm font-black ${bucket.color}`}>
                            {bucket.value > 0 ? `Rs.${(bucket.value / 1000).toFixed(0)}K` : '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Batch breakdown */}
                    {p.batches.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Batches</p>
                        {p.batches.filter(b => (b.outstandingBalance || 0) > 0).map(b => (
                          <div key={b.id} className="flex justify-between items-center bg-theme-card rounded-lg border border-theme-main px-3 py-2 text-xs">
                            <div>
                              <span className="font-mono font-bold text-slate-700">{b.batchNumber}</span>
                              <span className="text-slate-400 ml-2">{new Date(b.deliveryDate || b.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</span>
                              {b.paymentDueDate && (
                                <span className={`ml-2 font-semibold ${getDaysOverdue(b.paymentDueDate) > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                  Due: {new Date(b.paymentDueDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-black text-slate-800">Rs.{((b.outstandingBalance || 0) / 1000).toFixed(0)}K</span>
                              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                                b.paymentMethod === 'credit' ? 'bg-amber-100 text-amber-700' :
                                b.paymentMethod === 'partial' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                              }`}>{b.paymentMethod}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment modal */}
      {payingSupplier && (
        <PaymentModal
          supplier={payingSupplier}
          onClose={() => setPayingSupplier(null)}
          onSave={(amount, note, mode) => {
            onRecordPayment?.(payingSupplier.id, amount, `${note} (${mode})`);
            setPayingSupplier(null);
          }}
        />
      )}
    </div>
  );
}
