/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * TrialBalanceTab — Period-Closing Audit Sheet with BALANCED Verification Badge
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TrialBalanceTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const TrialBalanceTab: React.FC<TrialBalanceTabProps> = ({ lang, onOpenInspector }) => {
  const trialBalanceData = [
    { code: '110101', name: 'Cash in Hand (Physical Drawer)', category: 'ASSET', debit: 'Rs 320,000', credit: 'Rs 0' },
    { code: '110201', name: 'HBL Main Operating Account', category: 'ASSET', debit: 'Rs 2,540,000', credit: 'Rs 0' },
    { code: '120101', name: 'Accounts Receivable (Trade Debtors)', category: 'ASSET', debit: 'Rs 1,350,000', credit: 'Rs 0' },
    { code: '130101', name: 'Fuel Inventory (Super & Diesel)', category: 'ASSET', debit: 'Rs 22,268,000', credit: 'Rs 0' },
    { code: '210101', name: 'Accounts Payable (PSO Vendors)', category: 'LIABILITY', debit: 'Rs 0', credit: 'Rs 7,950,000' },
    { code: '310101', name: 'Owner Capital Account', category: 'EQUITY', debit: 'Rs 0', credit: 'Rs 15,000,000' },
    { code: '410101', name: 'Fuel Dispense Sales Revenue', category: 'INCOME', debit: 'Rs 0', credit: 'Rs 4,623,000' },
    { code: '510101', name: 'Cost of Goods Sold (Fuel COGS)', category: 'EXPENSE', debit: 'Rs 1,050,000', credit: 'Rs 0' },
    { code: '520101', name: 'Station Electricity & Utility Expense', category: 'EXPENSE', debit: 'Rs 45,000', credit: 'Rs 0' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0B5C3D]" />
            <span>Trial Balance General Accounting Audit Sheet</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Balanced double-entry trial balance ledger report for shift & month closing audit
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 flex items-center gap-1.5 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-700" />
          <span>✓ BALANCED (Total Debit = Total Credit)</span>
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <EnterpriseRegisterTable
          columns={[
            { id: 'code', header: 'Account Code', headerUr: 'کوڈ', accessor: 'code', sortable: true },
            { id: 'name', header: 'Account Name', headerUr: 'نام', accessor: 'name' },
            { id: 'category', header: 'Category', headerUr: 'قسم', accessor: 'category' },
            { id: 'debit', header: 'Debit Total (₨)', headerUr: 'ڈبیٹ', accessor: 'debit' },
            { id: 'credit', header: 'Credit Total (₨)', headerUr: 'کریڈٹ', accessor: 'credit' },
          ]}
          data={trialBalanceData}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />

        <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl font-black text-sm">
          <span>TOTAL TRIAL BALANCE (DEBIT = CREDIT)</span>
          <div className="flex items-center gap-6">
            <span className="text-emerald-400">Debit: Rs 27,573,000</span>
            <span className="text-emerald-400">Credit: Rs 27,573,000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
