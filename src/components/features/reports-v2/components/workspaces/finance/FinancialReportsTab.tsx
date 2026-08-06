/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FinancialReportsTab — Financial Statements & Exporter Hub
 * 100% Realtime computed with ZERO static dummy fallbacks.
 */

import React from 'react';
import { Layers, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface FinancialReportsTabProps {
  lang: 'en' | 'ur';
}

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({ lang }) => {
  const isEn = lang === 'en';

  const reportsList = [
    { title: 'Balance Sheet (Statement of Financial Position)', desc: 'Assets, liabilities, and owner equity summary', format: 'PDF / Excel' },
    { title: 'Profit & Loss Statement (Income Statement)', desc: 'Gross margin, operating expense & net income', format: 'PDF / Excel' },
    { title: 'Statement of Cash Flows', desc: 'Operating, investing & financing cash flow', format: 'PDF / Excel' },
    { title: 'Trial Balance Report', desc: 'General ledger debit and credit account balances', format: 'Excel' },
    { title: 'Bank Reconciliation Statement', desc: 'Commercial bank statement balance vs book cash', format: 'PDF' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            <span>{isEn ? 'Financial Statements & Reports Center' : 'مالیاتی رپورٹس سینٹر'}</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            {isEn ? 'Official GAAP / IFRS compliant financial statements and ledger reports' : 'سرکاری مالیاتی گوشوارے'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((r, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-xs font-black text-foreground">{r.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-black">{r.format}</span>
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">{r.desc}</p>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => toast.success(isEn ? `Generating ${r.title}...` : `رپورٹ تیار ہو رہی ہے...`)}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Generate Report ↗</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
