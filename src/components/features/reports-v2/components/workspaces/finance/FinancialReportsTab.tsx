/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FinancialReportsTab — Audit-Ready PDF/Excel Financial Reports
 */

import React from 'react';
import { FileText, Download, Printer, ShieldCheck } from 'lucide-react';

interface FinancialReportsTabProps {
  lang: 'en' | 'ur';
}

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({ lang }) => {
  const reportsList = [
    { title: 'Daily Cash & Bank Closing Summary', desc: 'Combined daily cash register, bank balances, and digital wallet positions', format: 'PDF & Excel' },
    { title: 'Profit & Loss Statement (P&L)', desc: 'Official station revenue, fuel COGS, overhead expenses, and net profit', format: 'PDF & Excel' },
    { title: 'Trial Balance Verification Sheet', desc: 'Double-entry general accounting trial balance with debit = credit verification', format: 'PDF & Excel' },
    { title: 'Supplier Accounts Payable Aging Report', desc: 'Outstanding OMC supplier payables, invoice due dates, and settlement schedules', format: 'PDF & Excel' },
    { title: 'Customer Credit Receivables Ledger', desc: 'Accounts receivable credit limits, customer balances, and overdue recovery list', format: 'PDF & Excel' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-sky-600" />
            <span>Audit-Ready Financial Reports Center</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Export certified PDF, Excel, and CSV financial statements for tax audit and executive review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center hover:border-slate-300 transition-all">
            <div className="space-y-1 pr-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>{rep.title}</span>
              </h3>
              <p className="text-xs font-bold text-slate-500">{rep.desc}</p>
              <span className="text-[10px] font-extrabold text-slate-400 block pt-1">Format: {rep.format}</span>
            </div>
            <button className="px-3 py-2 bg-slate-100 hover:bg-[#0B5C3D] text-slate-700 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap">
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
