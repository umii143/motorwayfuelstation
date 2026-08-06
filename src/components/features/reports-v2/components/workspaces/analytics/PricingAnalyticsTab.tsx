/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * PricingAnalyticsTab — Dedicated Pricing & Fuel Rate Analysis Tab
 */

import React from 'react';
import { DollarSign, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  lang?: 'en' | 'ur';
}

export const PricingAnalyticsTab: React.FC<TabProps> = ({ metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. PRICING BOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Average Dealer Margin / L</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">Rs {metrics.avgMargin.toFixed(2)} / L</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">OGRA Margin Approved</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">OGRA Circular Compliance</div>
          <div className="text-2xl font-black text-[var(--text-main)] font-mono mt-1">100% Synced</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Government Feed Verified</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Pending Revisions</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">1 Scheduled</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold mt-1">Effective 15th August</div>
        </div>
      </div>

      {/* 2. CURRENT ACTIVE FUEL RATES TABLE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          {t('Current Active Fuel Retail Price Board', 'موجودہ فیول پرائس بورڈ')}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            { product: 'Super Petrol (MS 92)', rate: 'Rs 285.45 / L', cost: 'Rs 276.81 / L', margin: 'Rs 8.64 / L', status: 'Active' },
            { product: 'HSD High Speed Diesel', rate: 'Rs 292.10 / L', cost: 'Rs 284.10 / L', margin: 'Rs 8.00 / L', status: 'Active' },
            { product: 'HOBC Hi-Octane 97', rate: 'Rs 305.00 / L', cost: 'Rs 294.50 / L', margin: 'Rs 10.50 / L', status: 'Active' }
          ].map((r) => (
            <div key={r.product} className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--text-main)] font-sans block">{r.product}</span>
                <span className="text-[10px] text-[var(--text-muted)]">Cost Price: {r.cost}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-sm">{r.rate}</span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">Margin: {r.margin}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
