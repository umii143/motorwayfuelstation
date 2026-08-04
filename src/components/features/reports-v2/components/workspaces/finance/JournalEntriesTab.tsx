/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * JournalEntriesTab — Double-Entry Journal Vouchers & Postings
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { RefreshCw, Plus } from 'lucide-react';

interface JournalEntriesTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const JournalEntriesTab: React.FC<JournalEntriesTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const journalEntries = [
    { jvNo: 'JV-2025-0089', date: 'May 15, 2025', debitAccount: '510101 Fuel COGS Expense', creditAccount: '130101 Fuel Inventory', amount: 'Rs 1,050,000', narration: 'Cost of fuel dispensed shift #1', status: 'POSTED' },
    { jvNo: 'JV-2025-0088', date: 'May 15, 2025', debitAccount: '110101 Cash in Hand', creditAccount: '410101 Fuel Sales Revenue', amount: 'Rs 320,000', narration: 'Cash collected morning shift', status: 'POSTED' },
    { jvNo: 'JV-2025-0087', date: 'May 15, 2025', debitAccount: '110201 HBL Main Account', creditAccount: '410101 Fuel Sales Revenue', amount: 'Rs 120,000', narration: 'POS card payments settled', status: 'POSTED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <RefreshCw size={18} className="text-purple-600" />
            <span>Double-Entry Journal Vouchers Ledger</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Manual and automatic general journal vouchers, debits, credits, and postings
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ New Journal Entry</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'jvNo', header: 'Voucher #', headerUr: 'واؤچر #', accessor: 'jvNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'debitAccount', header: 'Debit Account', headerUr: 'ڈبیٹ اکاؤنٹ', accessor: 'debitAccount' },
            { id: 'creditAccount', header: 'Credit Account', headerUr: 'کریڈٹ اکاؤنٹ', accessor: 'creditAccount' },
            { id: 'amount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'amount' },
            { id: 'narration', header: 'Narration', headerUr: 'تفصیل', accessor: 'narration' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={journalEntries}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
