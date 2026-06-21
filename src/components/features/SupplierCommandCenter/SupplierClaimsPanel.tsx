/**
 * FuelPro — Supplier Claims Intelligence Panel (Phase 2 Enhanced)
 * Recovery %, Avg Resolution, By-Supplier Analytics, 30+ Day Auto-Highlight
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */
import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, Plus, Check, X, Clock, ChevronDown, ChevronUp,
  FileText, Building2, RefreshCw, CheckCircle, XCircle,
  BarChart2, TrendingUp, ShieldAlert, Award, AlertCircle
} from 'lucide-react';
import { SupplierClaim, StockBatch, Supplier } from '../../../types';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useShallow } from 'zustand/react/shallow';
import { generateClaimNumber } from '../../../services/fifoEngine';
import { db } from '../../../data/db';

interface SupplierClaimsPanelProps {
  batches: StockBatch[];
  suppliers: Supplier[];
  language: string;
}

const CLAIM_TYPE_LABELS: Record<SupplierClaim['claimType'], string> = {
  short_quantity: '⚖️ Short Quantity',
  quality:        '🧪 Quality Issue',
  seal_broken:    '🔓 Seal Broken',
  adulteration:   '⚗️ Adulteration',
  other:          '📋 Other',
};

const STATUS_CONFIG: Record<SupplierClaim['status'], { label: string; color: string; bg: string }> = {
  pending:   { label: '⏳ Pending',   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  submitted: { label: '📤 Submitted', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  approved:  { label: '✅ Approved',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected:  { label: '❌ Rejected',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
  recovered: { label: '💰 Recovered', color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200' },
  partial:   { label: '🔄 Partial',   color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
};

function getDaysSinceRaised(raisedDate: string): number {
  const diff = Date.now() - new Date(raisedDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function RecoveryModal({
  claim, onClose, onSave,
}: { claim: SupplierClaim; onClose: () => void; onSave: (amount: number, notes: string, newStatus: SupplierClaim['status']) => void }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const pct = amount && claim.claimAmount > 0 ? ((parseFloat(amount) / claim.claimAmount) * 100).toFixed(1) : '0';

  return (
    <div className="premium-modal-overlay">
      <div className="bg-theme-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white">
          <h3 className="font-black text-base">💰 Record Recovery</h3>
          <p className="text-emerald-100 text-xs mt-0.5">{claim.claimNumber} · Total: Rs.{claim.claimAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Recovery Amount (Rs.)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Max: ${claim.claimAmount}`}
              max={claim.claimAmount}
              className="w-full border border-theme-main rounded-xl px-3 py-2 text-slate-800 text-sm font-mono focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            {parseFloat(amount) > 0 && (
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, parseFloat(pct))}%` }} />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1 font-mono">{pct}% recovered</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Resolution Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Credit note received from PSO..."
              className="w-full border border-theme-main rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-theme-main text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button
              onClick={() => {
                const amt = parseFloat(amount);
                if (amt > 0) {
                  const newStatus: SupplierClaim['status'] = amt >= claim.claimAmount ? 'recovered' : 'partial';
                  onSave(amt, notes, newStatus);
                }
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50"
            >
              💾 Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupplierClaimsPanel({ batches, suppliers, language }: SupplierClaimsPanelProps) {
  const stationId = db.getActiveStationId();
  const { supplierClaims, handleAddSupplierClaim, handleUpdateSupplierClaim } = useInventoryStore(useShallow(state => ({
    supplierClaims: state.supplierClaims,
    handleAddSupplierClaim: state.handleAddSupplierClaim,
    handleUpdateSupplierClaim: state.handleUpdateSupplierClaim
  })));
  const t = (en: string, ur: string) => language === 'ur' ? ur : en;

  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<SupplierClaim['status'] | 'all'>('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recoveryClaimId, setRecoveryClaimId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'analytics'>('list');

  // New claim form state
  const [newClaim, setNewClaim] = useState<Partial<SupplierClaim>>({
    claimType: 'short_quantity',
    status: 'pending',
    raisedDate: new Date().toISOString().split('T')[0],
    recoveredAmount: 0,
    outstandingClaim: 0,
  });

  const filtered = useMemo(() => {
    return supplierClaims.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterSupplier !== 'all' && c.supplierId !== filterSupplier) return false;
      return true;
    }).sort((a, b) => new Date(b.raisedDate).getTime() - new Date(a.raisedDate).getTime());
  }, [supplierClaims, filterStatus, filterSupplier]);

  // ─── Intelligence Metrics ────────────────────────────────────────────────────
  const intelligence = useMemo(() => {
    const total = supplierClaims.length;
    const pending = supplierClaims.filter(c => c.status === 'pending' || c.status === 'submitted').length;
    const resolved = supplierClaims.filter(c => c.status === 'recovered' || c.status === 'approved' || c.status === 'partial').length;
    const rejected = supplierClaims.filter(c => c.status === 'rejected').length;

    const totalClaimAmount = supplierClaims.reduce((s, c) => s + c.claimAmount, 0);
    const totalRecovered = supplierClaims.reduce((s, c) => s + c.recoveredAmount, 0);
    const totalOutstanding = supplierClaims.reduce((s, c) => s + c.outstandingClaim, 0);
    const recoveryPct = totalClaimAmount > 0 ? (totalRecovered / totalClaimAmount) * 100 : 0;
    const successRate = total > 0 ? ((resolved) / total) * 100 : 0;

    // Avg resolution days
    const resolvedClaims = supplierClaims.filter(c => c.resolvedDate);
    const avgResolutionDays = resolvedClaims.length > 0
      ? resolvedClaims.reduce((s, c) => {
          return s + Math.floor((new Date(c.resolvedDate!).getTime() - new Date(c.raisedDate).getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / resolvedClaims.length
      : 0;

    // Claims 30+ days old (unresolved)
    const overdueUnresolved = supplierClaims.filter(c =>
      (c.status === 'pending' || c.status === 'submitted') &&
      getDaysSinceRaised(c.raisedDate) > 30
    );

    // By supplier breakdown
    const bySupplier = suppliers.map(s => {
      const sClaims = supplierClaims.filter(c => c.supplierId === s.id);
      const sRecovered = sClaims.reduce((sum, c) => sum + c.recoveredAmount, 0);
      const sTotal = sClaims.reduce((sum, c) => sum + c.claimAmount, 0);
      return {
        supplier: s,
        count: sClaims.length,
        totalClaim: sTotal,
        recovered: sRecovered,
        outstanding: sTotal - sRecovered,
        recoveryPct: sTotal > 0 ? (sRecovered / sTotal) * 100 : 0,
        pending: sClaims.filter(c => c.status === 'pending' || c.status === 'submitted').length,
      };
    }).filter(s => s.count > 0).sort((a, b) => b.totalClaim - a.totalClaim);

    return {
      total, pending, resolved, rejected,
      totalClaimAmount, totalRecovered, totalOutstanding,
      recoveryPct, successRate, avgResolutionDays,
      overdueUnresolved, bySupplier,
    };
  }, [supplierClaims, suppliers]);

  const handleSaveClaim = async () => {
    if (!newClaim.batchId || !newClaim.supplierId || !newClaim.claimAmount) {
      return;
    }
    setSaving(true);
    const batch = batches.find(b => b.id === newClaim.batchId);
    const claimNum = generateClaimNumber(supplierClaims);

    const claim: SupplierClaim = {
      id: `clm_${Date.now()}`,
      claimNumber: claimNum,
      batchId: newClaim.batchId!,
      supplierId: newClaim.supplierId!,
      claimType: newClaim.claimType as SupplierClaim['claimType'],
      qtyShort: newClaim.qtyShort,
      claimAmount: Number(newClaim.claimAmount) || 0,
      description: newClaim.description || `${CLAIM_TYPE_LABELS[newClaim.claimType as SupplierClaim['claimType']]} — Batch ${batch?.batchNumber || newClaim.batchId}`,
      status: 'pending',
      raisedDate: newClaim.raisedDate || new Date().toISOString().split('T')[0],
      recoveredAmount: 0,
      outstandingClaim: Number(newClaim.claimAmount) || 0,
      raisedBy: 'Owner',
      notes: newClaim.notes,
      stationId,
    } as SupplierClaim;

    await handleAddSupplierClaim(claim);
    setSaving(false);
    setShowAddForm(false);
    setNewClaim({
      claimType: 'short_quantity',
      status: 'pending',
      raisedDate: new Date().toISOString().split('T')[0],
      recoveredAmount: 0,
      outstandingClaim: 0,
    });
  };

  const updateClaimStatus = async (
    claim: SupplierClaim,
    newStatus: SupplierClaim['status'],
    recoveredAmount?: number,
    notes?: string
  ) => {
    const updated: SupplierClaim = {
      ...claim,
      status: newStatus,
      recoveredAmount: recoveredAmount ?? claim.recoveredAmount,
      outstandingClaim: claim.claimAmount - (recoveredAmount ?? claim.recoveredAmount),
      resolvedDate: (['recovered', 'approved', 'rejected', 'partial'].includes(newStatus))
        ? new Date().toISOString().split('T')[0] : undefined,
      notes: notes || claim.notes,
      updatedAt: Date.now(),
    };
    await handleUpdateSupplierClaim(updated);
  };

  const recoveryClaimObj = recoveryClaimId ? supplierClaims.find(c => c.id === recoveryClaimId) : null;

  const inputCls = "w-full rounded-xl border border-theme-main bg-theme-card px-3 py-2 text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm";
  const selectCls = "w-full rounded-xl border border-theme-main bg-theme-bg px-3 py-2 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none text-sm";

  return (
    <div className="space-y-4">
      {/* 30+ Day Overdue Alert */}
      {intelligence.overdueUnresolved.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-4 text-white shadow-md flex items-center gap-3">
          <ShieldAlert className="size-8 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-black text-base">
              {intelligence.overdueUnresolved.length} {t('Claims Overdue 30+ Days', 'کلیمز 30+ دن سے زیادہ')}
            </p>
            <p className="text-red-100 text-sm mt-0.5">
              {t('Outstanding exposure: ', 'بقایا رقم: ')}
              <strong className="text-white">
                Rs.{intelligence.overdueUnresolved.reduce((s, c) => s + c.outstandingClaim, 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </strong>
              {' · '}{t('Follow up required immediately.', 'فوری فالو اپ ضروری ہے۔')}
            </p>
          </div>
        </div>
      )}

      {/* KPI Header */}
      <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('Total Claims', 'کل کلیمز'), value: intelligence.total, icon: AlertTriangle, bg: 'bg-theme-bg border-theme-main', color: 'text-slate-700', valueColor: 'text-slate-800' },
          { label: t('Recovery Rate', 'وصولی شرح'), value: `${intelligence.recoveryPct.toFixed(1)}%`, icon: TrendingUp, bg: intelligence.recoveryPct >= 70 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200', color: intelligence.recoveryPct >= 70 ? 'text-emerald-600' : 'text-red-600', valueColor: intelligence.recoveryPct >= 70 ? 'text-emerald-800' : 'text-red-800' },
          { label: t('Avg Resolution', 'اوسط حل وقت'), value: intelligence.avgResolutionDays > 0 ? `${intelligence.avgResolutionDays.toFixed(0)}d` : '—', icon: Clock, bg: intelligence.avgResolutionDays > 30 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200', color: 'text-blue-600', valueColor: 'text-blue-800' },
          { label: t('Outstanding', 'بقایا'), value: `Rs.${(intelligence.totalOutstanding / 1000).toFixed(0)}K`, icon: BarChart2, bg: intelligence.totalOutstanding > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200', color: intelligence.totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600', valueColor: intelligence.totalOutstanding > 0 ? 'text-red-800' : 'text-emerald-800' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${s.bg} flex items-center gap-3`}>
            <div className="size-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
              <s.icon className={`size-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-black ${s.valueColor}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Intelligence Recovery Bar */}
      <div className="premium-card border border-theme-main">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Claim Recovery Pipeline', 'کلیم وصولی')}</span>
          <span className="text-xs font-black text-emerald-700">
            Rs.{intelligence.totalRecovered.toLocaleString('en-PK', { maximumFractionDigits: 0 })} / Rs.{intelligence.totalClaimAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${intelligence.recoveryPct >= 70 ? 'bg-emerald-500' : intelligence.recoveryPct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, intelligence.recoveryPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{intelligence.resolved} resolved · {intelligence.rejected} rejected</span>
          <span>{intelligence.pending} {t('open', 'کھلے')}</span>
        </div>
      </div>

      {/* View Toggle + Actions Header */}
      <div className="flex flex-row gap-3 items-start items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['list', 'analytics'] as const).map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                activeView === v ? 'bg-theme-card text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v === 'list' ? '📋 Claims List' : '📊 By Supplier'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-sm"
        >
          <Plus className="size-4" />
          {t('Raise Claim', 'کلیم درج کریں')}
        </button>
      </div>

      {/* Add Claim Form */}
      {showAddForm && (
        <div className="premium-card border overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-rose-700 px-5 py-3 flex items-center justify-between">
            <h4 className="font-black text-white flex items-center gap-2">
              <Plus className="size-4" /> {t('New Claim', 'نئی کلیم')}
            </h4>
            <button onClick={() => setShowAddForm(false)} className="text-red-200 hover:text-white">✕</button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('Linked Batch *', 'منسلک بیچ *')}</label>
              <select value={newClaim.batchId || ''} onChange={e => {
                const batch = batches.find(b => b.id === e.target.value);
                setNewClaim(prev => ({ ...prev, batchId: e.target.value, supplierId: batch?.supplierId || prev.supplierId, qtyShort: batch?.qtyShort }));
              }} className={selectCls} required>
                <option value="">— Select Batch —</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber}{b.invoiceNumber ? ` (${b.invoiceNumber})` : ''}{b.qtyShort ? ` — SHORT: ${b.qtyShort}L` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('Supplier *', 'سپلائر *')}</label>
              <select value={newClaim.supplierId || ''} onChange={e => setNewClaim(prev => ({ ...prev, supplierId: e.target.value }))} className={selectCls} required>
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('Claim Type *', 'کلیم قسم *')}</label>
              <select value={newClaim.claimType} onChange={e => setNewClaim(prev => ({ ...prev, claimType: e.target.value as any }))} className={selectCls}>
                {Object.entries(CLAIM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {newClaim.claimType === 'short_quantity' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('Qty Short (L)', 'کم وصول لیٹر')}</label>
                <input type="number" value={newClaim.qtyShort || ''} onChange={e => setNewClaim(prev => ({ ...prev, qtyShort: Number(e.target.value) }))} className={inputCls} placeholder="e.g. 150" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('Claim Amount (Rs.) *', 'کلیم رقم *')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">Rs.</span>
                <input type="number" value={newClaim.claimAmount || ''} onChange={e => setNewClaim(prev => ({ ...prev, claimAmount: Number(e.target.value) }))} className={`${inputCls} pl-10`} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('Date Raised', 'تاریخ')}</label>
              <input type="date" value={newClaim.raisedDate} onChange={e => setNewClaim(prev => ({ ...prev, raisedDate: e.target.value }))} className={inputCls} />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('Description', 'تفصیل')}</label>
              <input type="text" value={newClaim.description || ''} onChange={e => setNewClaim(prev => ({ ...prev, description: e.target.value }))} className={inputCls} placeholder="Describe the claim issue..." />
            </div>
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl border border-theme-main text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button
              onClick={handleSaveClaim}
              disabled={saving || !newClaim.batchId || !newClaim.supplierId || !newClaim.claimAmount}
              className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? '⏳ Saving...' : '💾 Save Claim'}
            </button>
          </div>
        </div>
      )}

      {/* ─── ANALYTICS VIEW ─────────────────────────────────────────────────── */}
      {activeView === 'analytics' && (
        <div className="premium-card border border-theme-main space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <BarChart2 className="size-4" />
            {t('Claims by Supplier', 'سپلائر کے مطابق کلیمز')}
          </h3>
          {intelligence.bySupplier.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">{t('No supplier claims data.', 'کوئی سپلائر کلیمز نہیں۔')}</p>
          ) : (
            <div className="space-y-3">
              {intelligence.bySupplier.map(s => (
                <div key={s.supplier.id} className="bg-theme-bg rounded-xl p-3 border border-theme-main">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-slate-500" />
                      <span className="font-bold text-sm text-slate-800">{s.supplier.name}</span>
                      {s.pending > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-700 border border-red-200">
                          {s.pending} open
                        </span>
                      )}
                    </div>
                    <div className="text-right text-xs">
                      <p className={`font-black text-sm ${s.recoveryPct >= 70 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {s.recoveryPct.toFixed(0)}% recovered
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${s.recoveryPct >= 70 ? 'bg-emerald-500' : s.recoveryPct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, s.recoveryPct)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
                    <div>
                      <p className="text-slate-400">Claims</p>
                      <p className="font-black text-slate-700">{s.count}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Total</p>
                      <p className="font-black text-slate-700">Rs.{(s.totalClaim / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Recovered</p>
                      <p className="font-black text-emerald-700">Rs.{(s.recovered / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Outstanding</p>
                      <p className={`font-black ${s.outstanding > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {s.outstanding > 0 ? `Rs.${(s.outstanding / 1000).toFixed(0)}K` : '✅ Nil'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── LIST VIEW ──────────────────────────────────────────────────────── */}
      {activeView === 'list' && (
        <div className="premium-card border overflow-hidden">
          {/* Filters */}
          <div className="px-4 py-3 border-b border-slate-100 flex flex-row gap-2 items-center">
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'pending', 'submitted', 'approved', 'rejected', 'recovered', 'partial'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${filterStatus === s ? 'bg-red-600 text-white border-red-600' : 'bg-theme-card text-slate-600 border-theme-main hover:border-slate-300'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <select
              value={filterSupplier}
              onChange={e => setFilterSupplier(e.target.value)}
              className="text-xs border border-theme-main rounded-lg px-2 py-1.5 bg-theme-card text-slate-700 focus:outline-none focus:border-orange-500 ml-auto"
            >
              <option value="all">{t('All Suppliers', 'سب سپلائرز')}</option>
              {suppliers.filter(s => supplierClaims.some(c => c.supplierId === s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <AlertTriangle className="size-10 mx-auto mb-3 opacity-30" />
                <p>{t('No claims found.', 'کوئی کلیم نہیں ملا۔')}</p>
                <p className="text-xs mt-1">{t('Raise a claim when a supplier delivers short or with quality issues.', 'سپلائر کم ڈیلیوری یا کوالٹی مسئلے پر کلیم درج کریں۔')}</p>
              </div>
            ) : (
              filtered.map(claim => {
                const batch = batches.find(b => b.id === claim.batchId);
                const supplier = suppliers.find(s => s.id === claim.supplierId);
                const statusCfg = STATUS_CONFIG[claim.status];
                const isExpanded = expandedId === claim.id;
                const daysSinceRaised = getDaysSinceRaised(claim.raisedDate);
                const isOverdue = (claim.status === 'pending' || claim.status === 'submitted') && daysSinceRaised > 30;

                return (
                  <div key={claim.id} className={`transition-colors ${isOverdue ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}`}>
                    <div
                      className="px-4 py-3.5 flex items-center justify-between gap-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-red-200' : 'bg-red-100'}`}>
                          <AlertTriangle className={`size-4 ${isOverdue ? 'text-red-700 animate-pulse' : 'text-red-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-slate-700">{claim.claimNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {CLAIM_TYPE_LABELS[claim.claimType]}
                            </span>
                            {isOverdue && (
                              <span className="text-xs font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                                🔴 {daysSinceRaised}d overdue
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {supplier?.name || '—'} · {batch?.batchNumber || claim.batchId} ·{' '}
                            {new Date(claim.raisedDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-red-500 font-semibold uppercase">Outstanding</p>
                          <p className="font-black text-slate-800 text-sm">Rs.{claim.outstandingClaim.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-theme-card border border-theme-main rounded-xl p-4 space-y-3 shadow-inner">
                          <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {[
                              { label: 'Claim Amount', value: `Rs.${claim.claimAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, color: 'text-slate-800', bg: 'bg-theme-bg border-slate-100' },
                              { label: 'Recovered', value: `Rs.${claim.recoveredAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                              { label: 'Outstanding', value: `Rs.${claim.outstandingClaim.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
                              { label: 'Days Pending', value: `${daysSinceRaised}d`, color: daysSinceRaised > 30 ? 'text-red-700' : 'text-slate-700', bg: daysSinceRaised > 30 ? 'bg-red-50 border-red-100' : 'bg-theme-bg border-slate-100' },
                            ].map((item, i) => (
                              <div key={i} className={`rounded-lg p-2.5 border ${item.bg} text-center`}>
                                <p className="text-slate-400 mb-0.5">{item.label}</p>
                                <p className={`font-black ${item.color}`}>{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Recovery progress */}
                          {claim.claimAmount > 0 && (
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Recovery Progress</span>
                                <span className="font-bold">{((claim.recoveredAmount / claim.claimAmount) * 100).toFixed(0)}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, (claim.recoveredAmount / claim.claimAmount) * 100)}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Quick Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(claim.status === 'pending') && (
                              <button onClick={() => updateClaimStatus(claim, 'submitted')}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 flex items-center gap-1">
                                <FileText className="size-3.5" /> Mark Submitted
                              </button>
                            )}
                            {(['pending', 'submitted', 'partial'] as SupplierClaim['status'][]).includes(claim.status) && (
                              <button
                                onClick={() => setRecoveryClaimId(claim.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1"
                              >
                                <Check className="size-3.5" /> Record Recovery
                              </button>
                            )}
                            {(claim.status === 'submitted') && (
                              <button onClick={() => updateClaimStatus(claim, 'approved')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1">
                                <CheckCircle className="size-3.5" /> Approved by Supplier
                              </button>
                            )}
                            {(claim.status === 'pending' || claim.status === 'submitted') && (
                              <button onClick={() => updateClaimStatus(claim, 'rejected')}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 flex items-center gap-1">
                                <XCircle className="size-3.5" /> Rejected
                              </button>
                            )}
                          </div>

                          {claim.description && <p className="text-xs text-slate-500 italic">{claim.description}</p>}
                          {claim.notes && <p className="text-xs text-slate-400">Note: {claim.notes}</p>}
                          {claim.resolvedDate && (
                            <p className="text-xs text-slate-400">
                              Resolved: {new Date(claim.resolvedDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      {recoveryClaimObj && (
        <RecoveryModal
          claim={recoveryClaimObj}
          onClose={() => setRecoveryClaimId(null)}
          onSave={async (amount, notes, newStatus) => {
            await updateClaimStatus(recoveryClaimObj, newStatus, amount, notes);
            setRecoveryClaimId(null);
          }}
        />
      )}
    </div>
  );
}
