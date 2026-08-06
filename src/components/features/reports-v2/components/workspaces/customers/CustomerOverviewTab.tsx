/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomerOverviewTab — Executive Customer Relationship & AR Control Center
 * 100% Realtime computed from LedgerEngine with ZERO static dummy fallbacks.
 */

import React, { useMemo } from 'react';
import { CustomerEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { Users, DollarSign, ShieldAlert, PhoneCall } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface CustomerOverviewTabProps {
  customers: CustomerEnrichedRecord[];
  debtorCustomers: CustomerEnrichedRecord[];
  totalOutstanding: number;
  overdueCount: number;
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
  onSelectTab: (tabId: any) => void;
}

export const CustomerOverviewTab: React.FC<CustomerOverviewTabProps> = ({
  customers,
  debtorCustomers,
  totalOutstanding,
  overdueCount,
  lang,
  onOpenInspector,
  onSelectTab,
}) => {
  const isEn = lang === 'en';

  const totalCreditLimit = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  }, [customers]);

  const creditUtilization = totalCreditLimit > 0 ? Math.round((totalOutstanding / totalCreditLimit) * 100) : 0;
  const highestDebtor = useMemo(() => {
    return [...debtorCustomers].sort((a, b) => b.balance - a.balance)[0];
  }, [debtorCustomers]);

  const portfolioHealthScore = useMemo(() => {
    if (!customers.length) return 100;
    const healthyCount = customers.length - overdueCount;
    return Math.round((healthyCount / customers.length) * 100);
  }, [customers, overdueCount]);

  const segments = useMemo(() => {
    return [
      { label: 'Regular Commercial', count: customers.filter(c => (c as any).category === 'Commercial' || !(c as any).category).length, color: 'bg-primary/10 text-primary border-primary/25' },
      { label: 'Fleet & Logistics', count: customers.filter(c => (c as any).category === 'Fleet').length, color: 'bg-blue-50 text-blue-800 border-blue-200' },
      { label: 'Government & Contractors', count: customers.filter(c => (c as any).category === 'Government').length, color: 'bg-purple-50 text-purple-800 border-purple-200' },
      { label: 'VIP Priority Accounts', count: customers.filter(c => (c as any).category === 'VIP').length, color: 'bg-amber-50 text-amber-800 border-amber-200' },
      { label: 'Blacklisted / Overdue', count: overdueCount, color: 'bg-red-50 text-red-800 border-red-200' },
    ];
  }, [customers, overdueCount]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ── 1. AI CREDIT HEALTH & PREDICTION BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-primary to-primary-hover text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-primary/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black shrink-0">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black border border-primary/30 uppercase tracking-wider">
                  AI Credit Health Engine
                </span>
                <span className="text-xs text-primary/70 font-bold">
                  {overdueCount === 0 ? 'Realtime Portfolio Risk: LOW' : 'Realtime Portfolio Risk: ATTENTION REQUIRED'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1 tracking-tight">
                Customer Portfolio Health Score: <span className="text-primary">{portfolioHealthScore} / 100</span>
              </h2>
              <p className="text-xs text-slate-200 mt-1 font-medium max-w-2xl leading-relaxed">
                {customers.length === 0
                  ? 'No customer accounts registered in database.'
                  : `${portfolioHealthScore}% of customer accounts are in good standing. ${overdueCount} account(s) require payment follow-up.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectTab('recovery')}
              className="px-4 py-2.5 bg-primary hover:bg-primary text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall size={15} />
              <span>Launch Recovery Center</span>
            </button>
            <button
              onClick={() => onSelectTab('credit_limits')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              Review Credit Limits
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. TOP KPIS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Total Customers</span>
          <div className="text-2xl font-black text-foreground mt-1">{customers.length} Accounts</div>
          <span className="text-[10px] font-bold text-muted-foreground">Master Directory</span>
        </div>

        <div className="bg-primary/10 p-4 rounded-2xl border border-primary/25 shadow-2xs">
          <span className="text-[11px] font-black text-primary uppercase tracking-wider">Total Receivable</span>
          <div className="text-2xl font-black text-primary mt-1">{formatCurrency(totalOutstanding)}</div>
          <span className="text-[10px] font-bold text-primary">{debtorCustomers.length} Active Debtors</span>
        </div>

        <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/25 shadow-2xs">
          <span className="text-[11px] font-black text-rose-600 uppercase tracking-wider">Overdue Dues</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{overdueCount} Accounts</div>
          <span className="text-[10px] font-bold text-rose-600">High priority recovery</span>
        </div>

        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/25 shadow-2xs">
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">Credit Utilization</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{creditUtilization}%</div>
          <span className="text-[10px] font-bold text-blue-600">Limit: {formatCurrency(totalCreditLimit)}</span>
        </div>

        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/25 shadow-2xs">
          <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Highest Debtor</span>
          <div className="text-lg font-black text-amber-600 truncate mt-1">{highestDebtor ? highestDebtor.name : 'None'}</div>
          <span className="text-[10px] font-bold text-amber-600">{highestDebtor ? formatCurrency(highestDebtor.balance) : '—'}</span>
        </div>
      </div>

      {/* ── 3. PORTFOLIO SEGMENTS ── */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-3">
        <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Customer Portfolio Segmentation</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {segments.map((seg, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${seg.color}`}>
              <div className="text-[10px] font-black uppercase">{seg.label}</div>
              <div className="text-xl font-black mt-1">{seg.count} Accounts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
