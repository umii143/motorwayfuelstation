/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * KPIScorecardsAnalyticsTab — Dedicated Executive Scorecards Matrix Tab
 */

import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  lang?: 'en' | 'ur';
}

export const KPIScorecardsAnalyticsTab: React.FC<TabProps> = ({ metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. SCORECARDS MATRIX */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          {t('Executive Target vs Actual KPI Scorecards Matrix', 'ایگزیکٹو کے پی آئی اسکور بورڈ میش')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {[
            { domain: 'Sales Revenue Target', actual: formatCurrency(metrics.grossRevenue), target: formatCurrency(metrics.targetRevenue), achieve: `${metrics.revenueAchievePct}%`, status: 'Exceeding' },
            { domain: 'Gross Profit Target', actual: formatCurrency(metrics.grossProfit), target: formatCurrency(metrics.targetGrossProfit), achieve: `${metrics.grossProfitAchievePct}%`, status: 'Exceeding' },
            { domain: 'Net Profit Target', actual: formatCurrency(metrics.netProfit), target: formatCurrency(metrics.targetNetProfit), achieve: `${metrics.netProfitAchievePct}%`, status: 'Exceeding' },
            { domain: 'Fuel Dispensed Volume', actual: `${metrics.fuelVolume.toLocaleString()} L`, target: '10,000 L', achieve: '104.5%', status: 'Optimal' },
            { domain: 'Credit Recovery Target', actual: '95.9%', target: '100%', achieve: '95.9%', status: 'Warning' },
            { domain: 'Audit & Compliance Score', actual: '99.8%', target: '100%', achieve: '99.8%', status: 'Verified' }
          ].map((sc) => (
            <div key={sc.domain} className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
              <div className="flex justify-between items-center font-sans font-bold text-[var(--text-main)] text-xs">
                <span>{sc.domain}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-800">{sc.status}</span>
              </div>
              <div className="flex justify-between items-baseline font-bold">
                <span className="text-lg text-[var(--text-main)]">{sc.actual}</span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">{sc.achieve}</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-muted)]">Target: {sc.target}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
