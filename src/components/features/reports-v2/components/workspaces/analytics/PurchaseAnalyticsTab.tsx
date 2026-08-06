/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseAnalyticsTab — Dedicated Purchase, Procurement & Supplier Procurement Tab
 */

import React from 'react';
import { ShoppingCart, Building2, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../../../../lib/currency';

interface TabProps {
  metrics: any;
  lang?: 'en' | 'ur';
}

export const PurchaseAnalyticsTab: React.FC<TabProps> = ({ metrics, lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. PURCHASE SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Outstanding Supplier Payables</div>
          <div className="text-2xl font-black text-[var(--text-main)] font-mono mt-1">{formatCurrency(metrics.payables)}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold mt-1">3 Active Supplier Accounts</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">OMC On-Time Delivery Rate</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">98.4%</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">PSO & Shell Verified</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Avg Order Lead Time</div>
          <div className="text-2xl font-black text-[var(--text-main)] font-mono mt-1">4.2 Hours</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Bowser Dispatch Verified</div>
        </div>
      </div>

      {/* 2. RECENT BULK FUEL PURCHASES MATRIX */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          {t('Bulk Fuel Purchases & OMC Deliveries', 'بلک فیول خریداری اور او ایم سی ڈلیوریز')}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            { po: 'PO-8842', supplier: 'Pakistan State Oil (PSO)', product: 'Super Petrol (MS 92)', volume: '10,000 Liters', amount: 'Rs. 2,750,000', status: 'Delivered' },
            { po: 'PO-8843', supplier: 'Shell Pakistan Ltd', product: 'HSD High Speed Diesel', volume: '15,000 Liters', amount: 'Rs. 4,120,000', status: 'In Transit' },
            { po: 'PO-8844', supplier: 'Total PARCO Pakistan', product: 'HOBC Hi-Octane 97', volume: '5,000 Liters', amount: 'Rs. 1,450,000', status: 'Approved' }
          ].map((pur) => (
            <div key={pur.po} className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 font-sans font-bold text-[var(--text-main)]">
                  <span>{pur.po}</span>
                  <span className="text-[var(--text-muted)]">• {pur.supplier}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{pur.product} ({pur.volume})</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-[var(--text-main)] block">{pur.amount}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-800">{pur.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
