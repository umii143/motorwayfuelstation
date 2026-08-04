/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * GeneralLedgerTab — Universal Double-Entry Master Transaction History
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { BookOpen } from 'lucide-react';

interface GeneralLedgerTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const GeneralLedgerTab: React.FC<GeneralLedgerTabProps> = ({ lang, onOpenInspector }) => {
  const glTransactions = [
    { date: 'May 15, 2025 09:15 AM', voucherNo: 'JV-2025-0089', accountCode: '510101', accountName: 'Fuel COGS Expense', description: 'Fuel offloading cost shift #1', debit: 'Rs 1,050,000', credit: 'Rs 0', runningBalance: 'Rs 1,050,000' },
    { date: 'May 15, 2025 08:30 AM', voucherNo: 'JV-2025-0088', accountCode: '110101', accountName: 'Cash in Hand', description: 'Cash collected morning shift', debit: 'Rs 320,000', credit: 'Rs 0', runningBalance: 'Rs 320,000' },
    { date: 'May 15, 2025 07:45 AM', voucherNo: 'JV-2025-0087', accountCode: '110201', accountName: 'HBL Operating Account', description: 'POS Card settlement deposit', debit: 'Rs 120,000', credit: 'Rs 0', runningBalance: 'Rs 2,540,000' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-[#0B5C3D]" />
            <span>Universal General Ledger Transaction History</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Complete immutable transaction audit trail across all system ledger accounts
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'date', header: 'Date & Time', headerUr: 'تاریخ', accessor: 'date', sortable: true },
            { id: 'voucherNo', header: 'Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo' },
            { id: 'accountCode', header: 'Code', headerUr: 'کوڈ', accessor: 'accountCode' },
            { id: 'accountName', header: 'Account Name', headerUr: 'اکاؤنٹ', accessor: 'accountName' },
            { id: 'description', header: 'Description', headerUr: 'تفصیل', accessor: 'description' },
            { id: 'debit', header: 'Debit (₨)', headerUr: 'ڈبیٹ', accessor: 'debit' },
            { id: 'credit', header: 'Credit (₨)', headerUr: 'کریڈٹ', accessor: 'credit' },
            { id: 'runningBalance', header: 'Running Balance', headerUr: 'بیلنس', accessor: 'runningBalance' },
          ]}
          data={glTransactions}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
