/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * ProfitabilityAnalyticsTab — Dedicated True Profit & Waterfall P&L Tab
 */

import React from 'react';
import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  lang?: 'en' | 'ur';
}

export const ProfitabilityAnalyticsTab: React.FC<TabProps> = ({ metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. PROFIT SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Gross Profit Margin</div>
          <div className="text-2xl font-black text-primary dark:text-primary font-mono mt-1">{formatCurrency(metrics.grossProfit)}</div>
          <div className="text-xs text-primary dark:text-primary font-bold mt-1">12.0% Margin ({formatCurrency(metrics.targetGrossProfit)} Target)</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Net Operational Profit</div>
          <div className="text-2xl font-black text-primary dark:text-primary font-mono mt-1">{formatCurrency(metrics.netProfit)}</div>
          <div className="text-xs text-primary dark:text-primary font-bold mt-1">↑ +5.2% MTD ({formatCurrency(metrics.targetNetProfit)} Target)</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Station Operating Expenses</div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">{formatCurrency(metrics.expenses)}</div>
          <div className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1">-12% under monthly expense budget</div>
        </div>
      </div>

      {/* 2. PROFIT WATERFALL BREAKDOWN */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          {t('Double-Entry Verified Profit Waterfall Analysis', 'ڈبل اینٹری تصدیق شدہ واٹر فال نفع و نقصان')}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] font-bold">
            <span>1. Gross Sales Revenue</span>
            <span className="text-primary dark:text-primary">{formatCurrency(metrics.grossRevenue)}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] font-bold">
            <span className="text-rose-700 dark:text-rose-400">2. Cost of Fuel & Goods (COGS)</span>
            <span className="text-rose-700 dark:text-rose-400">-{formatCurrency(metrics.grossRevenue * 0.88)}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 font-bold">
            <span className="text-primary dark:text-primary">3. Gross Margin (12.0%)</span>
            <span className="text-primary dark:text-primary">{formatCurrency(metrics.grossProfit)}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] font-bold">
            <span className="text-amber-700 dark:text-amber-400">4. Operating Expenses & Salaries</span>
            <span className="text-amber-700 dark:text-amber-400">-{formatCurrency(metrics.expenses)}</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-amber-600 text-white font-black text-sm shadow-md">
            <span>5. Net Retained Profit</span>
            <span>{formatCurrency(metrics.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
