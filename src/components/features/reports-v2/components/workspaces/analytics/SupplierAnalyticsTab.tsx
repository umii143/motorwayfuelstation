/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierAnalyticsTab — Dedicated Supplier & Payables Tab
 */

import React from 'react';
import { Building2, ShieldCheck, Clock } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  lang?: 'en' | 'ur';
}

export const SupplierAnalyticsTab: React.FC<TabProps> = ({ metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. SUPPLIER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Accounts Payable Total</div>
          <div className="text-2xl font-black text-[var(--text-main)] font-mono mt-1">{formatCurrency(metrics.payables)}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold mt-1">3 OMC Suppliers</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Delivery On-Time Score</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">98.4%</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Verified Bowsers</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Density Certification Score</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">100% Certified</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Zero Density Mismatches</div>
        </div>
      </div>

      {/* 2. SUPPLIER ACCOUNTS AGING */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          {t('Supplier Accounts & Delivery Performance', 'سپلائر اکاؤنٹس اور کارکردگی')}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            { name: 'Pakistan State Oil (PSO)', payable: 'Rs 520,000', leadTime: '3.8 Hours', rating: '99.1%' },
            { name: 'Shell Pakistan Ltd', payable: 'Rs 240,000', leadTime: '4.5 Hours', rating: '97.8%' },
            { name: 'Total PARCO Pakistan', payable: 'Rs 130,000', leadTime: '4.1 Hours', rating: '98.5%' }
          ].map((s) => (
            <div key={s.name} className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--text-main)] font-sans block">{s.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">Lead Time: {s.leadTime} • On-Time: {s.rating}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-[var(--text-main)] block">{s.payable}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-800">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
