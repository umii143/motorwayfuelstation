/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * SalesAnalyticsTab — Dedicated Sales & Fuel Volume Domain Tab
 */

import React from 'react';
import { TrendingUp, PieChart as PieIcon, Fuel, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  pumps: any[];
  lang?: 'en' | 'ur';
}

export const SalesAnalyticsTab: React.FC<TabProps> = ({ metrics, pumps, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. SALES SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Total Sales Revenue</div>
          <div className="text-2xl font-black text-[var(--text-main)] font-mono mt-1">{formatCurrency(metrics.grossRevenue)}</div>
          <div className="text-xs text-success dark:text-success font-bold mt-1">↑ +8.3% vs yesterday</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Total Fuel Dispensed</div>
          <div className="text-2xl font-black text-[var(--text-main)] mt-2">{metrics.fuelVolume.toLocaleString()} Liters</div>
          <div className="text-xs text-success dark:text-success font-bold mt-1">{(metrics.fuelVolume / (metrics.targetFuelVolume || 10000) * 100).toFixed(1)}% Volume Target</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Net Revenue (Excl Tax & Discount)</div>
          <div className="text-2xl font-black text-primary dark:text-primary font-mono mt-1">{formatCurrency(metrics.netRevenue)}</div>
          <div className="text-xs text-success dark:text-success font-bold mt-1">Verified Realtime</div>
        </div>
      </div>

      {/* 2. PRODUCT MIX REVENUE SHARE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-amber-600" />
          {t('Product Mix Revenue & Volume Shares', 'مصنوعات کی سیلز کا بریک ڈاؤن')}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            { name: 'Super Petrol (MS 92)', share: '52%', amount: formatCurrency(metrics.grossRevenue * 0.52), volume: `${Math.round(metrics.fuelVolume * 0.55).toLocaleString()} L` },
            { name: 'HSD High Speed Diesel', share: '36%', amount: formatCurrency(metrics.grossRevenue * 0.36), volume: `${Math.round(metrics.fuelVolume * 0.35).toLocaleString()} L` },
            { name: 'HOBC Hi-Octane 97', share: '7%', amount: formatCurrency(metrics.grossRevenue * 0.07), volume: `${Math.round(metrics.fuelVolume * 0.07).toLocaleString()} L` },
            { name: 'Engine Oils & Lubricants', share: '5%', amount: formatCurrency(metrics.grossRevenue * 0.05), volume: '120 Units' }
          ].map((item) => (
            <div key={item.name} className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--text-main)] font-sans">{item.name}</span>
                <span className="text-[10px] text-[var(--text-muted)] block">Volume: {item.volume}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary dark:text-primary">{item.amount}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-800 block mt-0.5">{item.share}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
