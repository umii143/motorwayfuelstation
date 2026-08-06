/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * ExecutiveDashboardTab — CEO Cockpit & Multi-Branch Network Grid Tab
 */

import React from 'react';
import { Building2, MapPin, Gauge, Droplets, ShieldCheck, Award } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  branches: any[];
  pumps: any[];
  tankTelemetry: any[];
  lang?: 'en' | 'ur';
}

export const ExecutiveDashboardTab: React.FC<TabProps> = ({ branches, pumps, tankTelemetry, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. MULTI-BRANCH STATION NETWORK GRID */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-main)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              {t('Multi-Branch Enterprise Network Cockpit', 'ملٹی برانچ نیٹ ورک کاک پٹ')}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Realtime telemetry across national station branches', 'تمام فیول اسٹیشن برانچز کا لائیو اسٹیٹس')}
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary dark:text-primary border border-primary/20 font-bold text-xs font-mono">
            4 / 4 Stations Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {branches.map((st) => (
            <div key={st.name} className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-main)] text-xs truncate max-w-[170px]">{st.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary dark:text-primary border border-primary/20">
                  🟢 {st.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Today Sales</span>
                  <span className="font-bold text-[var(--text-main)]">{formatCurrency(st.sales)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block">Net Profit</span>
                  <span className="font-bold text-primary dark:text-primary">{formatCurrency(st.profit)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono pt-2 border-t border-[var(--border-muted)] text-[var(--text-muted)]">
                <div>Stock: <strong className="text-[var(--text-main)]">{st.stockPct}%</strong></div>
                <div>Cash: <strong className="text-[var(--text-main)]">Rs {(st.cash / 1000).toFixed(0)}K</strong></div>
                <div className="text-right">Staff: <strong className="text-[var(--text-main)]">{st.staffCount}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. PUMPS & TANK TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-600" />
            {t('Fuel Dispensers Live Status', 'ڈسپینسر لائیو ٹیلی میٹری')}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {pumps.map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[var(--text-main)] font-sans">{p.id} ({p.fuel})</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-900'}`}>{p.status}</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Flow: <strong className="text-[var(--text-main)]">{p.flowRate} L/min</strong></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            {t('ATG Tank Telemetry Sensors', 'ٹینک سینسر ٹیلی میٹری')}
          </h3>
          <div className="space-y-2 text-xs font-mono">
            {tankTelemetry.map((t) => (
              <div key={t.id} className={`p-3 rounded-xl border ${t.isReorderRisk ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--bg-subtle)] border-[var(--border-main)]'} flex justify-between items-center`}>
                <div>
                  <span className="font-bold text-[var(--text-main)] font-sans block">{t.name} ({t.productName})</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Water: {t.waterDepthMm}mm • Temp: {t.temperatureC}°C</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[var(--text-main)] block">{t.currentStock.toLocaleString()} L ({t.stockPct}%)</span>
                  <span className="text-[10px] font-bold text-primary dark:text-primary">{t.daysRemaining} Days Remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
