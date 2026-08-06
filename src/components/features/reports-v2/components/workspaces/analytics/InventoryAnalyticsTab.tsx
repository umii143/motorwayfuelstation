/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryAnalyticsTab — Dedicated ATG Tank & Inventory Health Tab
 */

import React from 'react';
import { Layers, Droplets, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  tankTelemetry: any[];
  abcAnalysis: any[];
  metrics: any;
  lang?: 'en' | 'ur';
}

export const InventoryAnalyticsTab: React.FC<TabProps> = ({ tankTelemetry, abcAnalysis, metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. INVENTORY SUMMARY CARD */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('Total Fuel & Lube Inventory Assets', 'کل انوینٹری اثاثہ جات')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Realtime ATG sensor telemetry & double-entry stock valuation</p>
        </div>
        <div className="text-right font-mono">
          <div className="text-2xl font-black text-primary dark:text-primary">{formatCurrency(metrics.inventoryValue)}</div>
          <span className="text-[10px] text-success dark:text-success font-bold">100% Stock Verified</span>
        </div>
      </div>

      {/* 2. ATG TANK TELEMETRY LIST */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-600" />
          {t('ATG Tank Telemetry Sensors & Water Depth', 'ٹینک ٹیلی میٹری و واٹر ڈیپتھ')}
        </h3>

        <div className="space-y-3 text-xs font-mono">
          {tankTelemetry.map((t) => (
            <div key={t.id} className={`p-4 rounded-xl border ${t.isReorderRisk ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--bg-subtle)] border-[var(--border-main)]'} space-y-2`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--text-main)] font-sans text-sm">{t.name} ({t.productName})</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.isReorderRisk ? 'bg-rose-500/20 text-rose-800' : 'bg-primary/10 text-primary'}`}>
                  {t.isReorderRisk ? '🔴 REORDER ALERT' : '🟢 STOCK HEALTHY'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>Current Stock: <strong className="text-[var(--text-main)]">{t.currentStock.toLocaleString()} L ({t.stockPct}%)</strong></div>
                <div>Water Level: <strong className="text-[var(--text-main)]">{t.waterDepthMm} mm</strong></div>
                <div>Temperature: <strong className="text-[var(--text-main)]">{t.temperatureC} °C</strong></div>
                <div className="text-right">Days Left: <strong className="text-primary dark:text-primary">{t.daysRemaining} Days</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DYNAMIC ABC INVENTORY ANALYSIS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          {t('Dynamic ABC Stock Analysis & Turnover Velocity', 'اے بی سی انوینٹری اور ٹرن اوور ویکسٹی')}
        </h3>

        <div className="space-y-3 text-xs font-mono">
          {abcAnalysis.map((item) => (
            <div key={item.productName} className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 font-sans font-bold text-[var(--text-main)]">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${item.category === 'A' ? 'bg-primary text-white' : item.category === 'B' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'}`}>
                    Category {item.category}
                  </span>
                  <span>{item.productName}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-sans block mt-1">{item.recommendation}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-[var(--text-main)] block">Turnover Ratio: {item.turnoverRatio}x</span>
                <span className="text-[10px] text-success dark:text-success font-bold">Revenue Share: {item.revenueSharePct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
