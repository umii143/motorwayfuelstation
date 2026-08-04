/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * IncomeRegisterTab — Income Sources Register & Categorization
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ArrowUpRight, Plus } from 'lucide-react';

interface IncomeRegisterTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const IncomeRegisterTab: React.FC<IncomeRegisterTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const incomeRecords = [
    { incNo: 'INC-2025-0515-01', date: 'May 15, 2025', category: 'Fuel Sales Revenue', source: 'Nozzles Morning Shift', amount: 'Rs 5,740,000', receivingAccount: 'Cash In Hand', status: 'VERIFIED' },
    { incNo: 'INC-2025-0515-02', date: 'May 15, 2025', category: 'Lubricants & Oil Sales', source: 'Mart Lube Counter', amount: 'Rs 480,000', receivingAccount: 'Cash In Hand', status: 'VERIFIED' },
    { incNo: 'INC-2025-0515-03', date: 'May 15, 2025', category: 'Mart & Retail Revenue', source: 'Convenience Mart POS', amount: 'Rs 320,300', receivingAccount: 'EasyPaisa Wallet', status: 'VERIFIED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-emerald-600" />
            <span>Income & Revenue Sources Register</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Fuel sales collections, lubricant shop sales, mart revenue, and miscellaneous income
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Record Income</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'incNo', header: 'Income #', headerUr: 'آمدن #', accessor: 'incNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'category', header: 'Income Category', headerUr: 'کیٹیگری', accessor: 'category' },
            { id: 'source', header: 'Source / Shift', headerUr: 'ذریعہ', accessor: 'source' },
            { id: 'amount', header: 'Total Income (₨)', headerUr: 'کل آمدن', accessor: 'amount' },
            { id: 'receivingAccount', header: 'Receiving Account', headerUr: 'اکاؤنٹ', accessor: 'receivingAccount' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={incomeRecords}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
