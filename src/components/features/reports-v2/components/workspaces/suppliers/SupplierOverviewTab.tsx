/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierOverviewTab — Executive Accounts Payable (AP) & Vendor Control Center
 * 100% Realtime computed from LedgerEngine with ZERO static dummy fallbacks.
 */

import React, { useMemo } from 'react';
import { SupplierEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { Truck, DollarSign, ShieldCheck, CreditCard, Building2, CheckCircle, Clock } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface SupplierOverviewTabProps {
  suppliers: SupplierEnrichedRecord[];
  payableSuppliers: SupplierEnrichedRecord[];
  totalPayable: number;
  overdueCount: number;
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
  onSelectTab: (tabId: any) => void;
}

export const SupplierOverviewTab: React.FC<SupplierOverviewTabProps> = ({
  suppliers,
  payableSuppliers,
  totalPayable,
  overdueCount,
  lang,
  onOpenInspector,
  onSelectTab,
}) => {
  const isEn = lang === 'en';

  const omcVendors = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.category?.toLowerCase().includes('omc') ||
        s.name.toUpperCase().includes('PSO') ||
        s.name.toUpperCase().includes('SHELL') ||
        s.name.toUpperCase().includes('ATTOCK') ||
        s.name.toUpperCase().includes('TOTAL') ||
        s.name.toUpperCase().includes('HASCOL')
    );
  }, [suppliers]);

  const vendorHealthIndex = useMemo(() => {
    if (!suppliers.length) return 100;
    const healthyCount = suppliers.length - overdueCount;
    return Math.round((healthyCount / suppliers.length) * 100);
  }, [suppliers, overdueCount]);

  const categories = useMemo(() => {
    return [
      { label: isEn ? 'OMC Fuel Vendors' : 'او ایم سی فیول سپلائرز', count: omcVendors.length, color: 'bg-amber-500/10 text-amber-600 border-amber-500/25' },
      { label: isEn ? 'Lubricants & Engine Oil' : 'موبل آئل اور لیوبز', count: suppliers.filter(s => s.category === 'Lube' || s.category === 'Lubricants').length, color: 'bg-blue-500/10 text-blue-600 border-blue-500/25' },
      { label: isEn ? 'Station Maintenance' : 'اسٹیشن کی دیکھ بھال', count: suppliers.filter(s => s.category === 'Maintenance').length, color: 'bg-purple-500/10 text-purple-600 border-purple-500/25' },
      { label: isEn ? 'Utilities & Services' : 'یوٹیلٹیز (بجلی و گیس)', count: suppliers.filter(s => s.category === 'Utilities').length, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25' },
    ];
  }, [suppliers, omcVendors, isEn]);

  return (
    <div className="space-y-5 font-sans text-slate-800">
      {/* ── 1. AI VENDOR HEALTH & AP PREDICTION BANNER ── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-600/30 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-2xl font-black shrink-0">
              🚛
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30 uppercase tracking-wider">
                  AI Vendor Health Index
                </span>
                <span className="text-xs text-amber-200 font-bold">
                  {overdueCount === 0 ? 'Supply Chain Risk: LOW' : 'Supply Chain Risk: PAYMENTS DUE'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1 tracking-tight">
                Vendor Network Health: <span className="text-amber-400">{vendorHealthIndex}% (Realtime Index)</span>
              </h2>
              <ul className="flex items-center gap-4 text-xs text-slate-300 mt-1.5 font-semibold flex-wrap">
                <li className="flex items-center gap-1 text-primary">
                  <CheckCircle size={13} /> {suppliers.length} Total Vendors Registered
                </li>
                <li className="flex items-center gap-1 text-amber-300">
                  <Clock size={13} /> {payableSuppliers.length} Pending Payment Accounts
                </li>
                <li className="flex items-center gap-1 text-blue-300">
                  <Building2 size={13} /> {omcVendors.length} OMC Partners
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectTab('payments')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CreditCard size={15} />
              <span>Launch Payment Center</span>
            </button>
            <button
              onClick={() => onSelectTab('contracts')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              Review OMC Contracts
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. TOP KPIS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Total Suppliers</span>
          <div className="text-2xl font-black text-foreground mt-1">{suppliers.length} Vendors</div>
          <span className="text-[10px] font-bold text-muted-foreground">{omcVendors.length} OMC Oil Companies</span>
        </div>

        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/25 shadow-2xs">
          <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Total Accounts Payable (AP)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalPayable)}</div>
          <span className="text-[10px] font-bold text-amber-600">{payableSuppliers.length} Accounts Pending Payment</span>
        </div>

        <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/25 shadow-2xs">
          <span className="text-[11px] font-black text-rose-600 uppercase tracking-wider">Overdue Dues</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{overdueCount} Accounts</div>
          <span className="text-[10px] font-bold text-rose-600">High priority disbursement</span>
        </div>

        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/25 shadow-2xs">
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">OMC Vendors</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{omcVendors.length} Companies</div>
          <span className="text-[10px] font-bold text-blue-600">PSO / Shell / Attock / Total</span>
        </div>
      </div>

      {/* ── 3. VENDOR CATEGORIES ── */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-3">
        <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Supplier Category Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {categories.map((cat, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${cat.color}`}>
              <div className="text-[10px] font-black uppercase">{cat.label}</div>
              <div className="text-xl font-black mt-1">{cat.count} Vendors</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
