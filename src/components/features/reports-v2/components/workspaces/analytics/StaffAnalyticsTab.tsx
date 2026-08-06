/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * StaffAnalyticsTab — Dedicated Workforce & Staff Analytics Tab
 */

import React from 'react';
import { Users, Award, Clock } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  branches: any[];
  lang?: 'en' | 'ur';
}

export const StaffAnalyticsTab: React.FC<TabProps> = ({ branches, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. WORKFORCE SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Active Workforce Count</div>
          <div className="text-2xl font-black text-[var(--text-main)] font-mono mt-1">50 Employees</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">4 Station Branches</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Attendance Rate Today</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">96.0%</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">48 Present / 2 On Leave</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Staff Cash Accuracy Score</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">99.8%</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Zero Shift Shortage</div>
        </div>
      </div>

      {/* 2. TOP PERFORMING CASHIERS & SALESMEN */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-600" />
          {t('Staff Sales Performance & Shift Efficiency', 'اسٹاف کارکردگی اور شفٹ ایفیشنسی')}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            { name: 'Zahid Khan', role: 'Head Cashier', sales: 'Rs 850,000', shift: 'Morning Shift 1', accuracy: '100%' },
            { name: 'Ali Raza', role: 'Senior Salesman', sales: 'Rs 620,000', shift: 'Evening Shift 2', accuracy: '99.9%' },
            { name: 'Usman Ahmad', role: 'Nozzle Attendant', sales: 'Rs 480,000', shift: 'Night Shift 3', accuracy: '99.7%' }
          ].map((st) => (
            <div key={st.name} className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--text-main)] font-sans block">{st.name} ({st.role})</span>
                <span className="text-[10px] text-[var(--text-muted)]">{st.shift} • Accuracy: {st.accuracy}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">{st.sales}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-800">Top Performer</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
