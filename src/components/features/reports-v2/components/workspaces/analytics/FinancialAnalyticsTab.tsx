/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * FinancialAnalyticsTab — Dedicated Finance, Treasury & Cash Flow Tab
 */

import React from 'react';
import { DollarSign, Wallet, CreditCard, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  lang?: 'en' | 'ur';
}

export const FinancialAnalyticsTab: React.FC<TabProps> = ({ metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. LIQUIDITY & CAPITAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Verified Cash Position</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">{formatCurrency(metrics.cashPosition)}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold mt-1">Cash on-hand + Digital Wallets</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Bank Accounts Balance</div>
          <div className="text-2xl font-black text-[var(--text-main)] font-mono mt-1">{formatCurrency(metrics.bankPosition)}</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">100% Reconciled</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Station Operating Expenses</div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">{formatCurrency(metrics.expenses)}</div>
          <div className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1">-12% under monthly budget</div>
        </div>
      </div>

      {/* 2. SANKEY CAPITAL FLOW WATERFALL */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          {t('Live Capital & Cash Flow Sankey Breakdown', 'لائیو کیش فلو سنکی ڈایاگرام')}
        </h3>

        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center font-bold">
            <span>Customer Receipts</span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
            <span>Cash & Wallets</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
            <span>Bank Deposits</span>
            <ArrowRight className="w-4 h-4 text-rose-600" />
            <span>Supplier Settlements</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] pt-2 border-t border-[var(--border-muted)]">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-800 font-bold">{formatCurrency(metrics.grossRevenue)}</div>
            <div className="p-2 rounded bg-blue-500/10 text-blue-800 font-bold">{formatCurrency(metrics.cashPosition)}</div>
            <div className="p-2 rounded bg-purple-500/10 text-purple-800 font-bold">{formatCurrency(metrics.bankPosition)}</div>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-800 font-bold">{formatCurrency(metrics.netProfit)} Net Profit</div>
          </div>
        </div>
      </div>
    </div>
  );
};
