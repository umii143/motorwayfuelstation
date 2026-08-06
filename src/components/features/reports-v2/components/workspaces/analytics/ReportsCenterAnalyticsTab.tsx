/**
 * @license SPDX-License-Identifier: Apache-2.0
 * FuelPro Enterprise Business Operating System v4.0
 * ReportsCenterAnalyticsTab — Dedicated Reports Center & Snapshot Exporter Tab
 */

import React from 'react';
import { FileText, Download, Printer, Send, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

interface TabProps {
  lang?: 'en' | 'ur';
}

export const ReportsCenterAnalyticsTab: React.FC<TabProps> = ({ lang = 'en' }) => {
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      {/* 1. REPORTS GENERATOR MATRIX */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          {t('Executive Reports Center & Snapshot Exporters', 'ایگزیکٹو رپورٹس سینٹر و ایکسپورٹرز')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          {[
            { title: 'Daily Executive Briefing Deck (PDF)', desc: 'Complete summary of daily revenue, profit, fuel volume, and tank stock.', format: 'PDF', icon: Download },
            { title: 'Weekly Multi-Station Operating Matrix', desc: 'Comparative operating performance across all 4 national station branches.', format: 'Excel', icon: FileSpreadsheet },
            { title: 'Monthly P&L & Balance Sheet Vault', desc: 'Double-entry verified monthly financial statement deck for board review.', format: 'PDF', icon: Download },
            { title: 'Power BI Realtime Data Stream URL', desc: 'Live REST API endpoint URL for Power BI & Microsoft Fabric integration.', format: 'Stream', icon: Send },
            { title: 'OGRA Pricing & Tax Audit Export', desc: 'Audit compliance certificate formatted for OGRA & FBR inspection.', format: 'CSV', icon: Printer }
          ].map((rep) => (
            <div key={rep.title} className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-[var(--text-main)] font-sans text-xs">{rep.title}</div>
                <p className="text-[10px] text-[var(--text-muted)] font-sans mt-1">{rep.desc}</p>
              </div>
              <div className="pt-2 flex justify-between items-center border-t border-[var(--border-muted)]">
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-800 font-bold">{rep.format}</span>
                <button onClick={() => toast.success(`Exporting ${rep.title}...`)} className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors">
                  {t('Export Now', 'ایکسپورٹ کریں')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
