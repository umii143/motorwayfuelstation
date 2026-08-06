/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * CustomerAnalyticsTab — Dedicated Customer Directory & Credit Receivables Tab
 */

import React from 'react';
import { Users, CreditCard, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  lang?: 'en' | 'ur';
}

export const CustomerAnalyticsTab: React.FC<TabProps> = ({ metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. CUSTOMER RECEIVABLES CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Accounts Receivable Balance</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">{formatCurrency(metrics.receivables)}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold mt-1">14 Commercial Credit Accounts</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Avg Collection Period</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">14.2 Days</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Within 15-day Credit Policy</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Overdue Accounts (&gt;30 Days)</div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">3 Accounts</div>
          <div className="text-xs text-rose-700 dark:text-rose-400 font-bold mt-1">Action Needed</div>
        </div>
      </div>

      {/* 2. TOP CREDIT CUSTOMERS DIRECTORY */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          {t('Top Credit Customers & Receivables Aging', 'ٹاپ کریڈٹ کسٹمرز اور وصولی کھاتے')}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            { customer: 'Khyber Goods Transport Ltd', balance: 'Rs 485,000', limit: 'Rs 1,000,000', status: 'Healthy', days: '12d' },
            { customer: 'Mardan Logistics Company', balance: 'Rs 340,000', limit: 'Rs 500,000', status: 'Warning', days: '28d' },
            { customer: 'Frontier Bus Services', balance: 'Rs 280,000', limit: 'Rs 400,000', status: 'Overdue', days: '34d' },
            { customer: 'Peshawar Construction Fleet', balance: 'Rs 135,000', limit: 'Rs 300,000', status: 'Healthy', days: '8d' }
          ].map((c) => (
            <div key={c.customer} className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--text-main)] font-sans block">{c.customer}</span>
                <span className="text-[10px] text-[var(--text-muted)]">Credit Limit: {c.limit} • Collection: {c.days}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-amber-700 dark:text-amber-400 block">{c.balance}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'Overdue' ? 'bg-rose-500/10 text-rose-800' : 'bg-emerald-500/10 text-emerald-800'}`}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
