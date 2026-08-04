/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CashTransfersTab — Inter-Account Cash/Bank/Wallet Fund Transfers
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { RefreshCw, Plus } from 'lucide-react';

interface CashTransfersTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const CashTransfersTab: React.FC<CashTransfersTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const transfers = [
    { transferNo: 'TR-2025-0515-012', date: 'May 15, 2025', fromAccount: 'Cash In Hand', toAccount: 'HBL Main Operating Account', amount: 'Rs 500,000', reference: 'Deposit Slip #78190', status: 'COMPLETED' },
    { transferNo: 'TR-2025-0514-011', date: 'May 14, 2025', fromAccount: 'EasyPaisa Wallet', toAccount: 'MCB Current Account', amount: 'Rs 120,000', reference: 'Bank Transfer #EP-9988', status: 'COMPLETED' },
    { transferNo: 'TR-2025-0513-010', date: 'May 13, 2025', fromAccount: 'HBL Account', toAccount: 'Bank Alfalah Account', amount: 'Rs 1,000,000', reference: 'Interbank Transfer #HBL-5544', status: 'COMPLETED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <RefreshCw size={18} className="text-purple-600" />
            <span>Inter-Account Fund Transfers (Cash ↔ Bank ↔ Wallet)</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Internal cash deposits, bank transfers, and digital wallet settlements
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Transfer Funds</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'transferNo', header: 'Transfer #', headerUr: 'منتقلی #', accessor: 'transferNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'fromAccount', header: 'From Account', headerUr: 'از اکاؤنٹ', accessor: 'fromAccount' },
            { id: 'toAccount', header: 'To Account', headerUr: 'بہ اکاؤنٹ', accessor: 'toAccount' },
            { id: 'amount', header: 'Transferred Amount (₨)', headerUr: 'رقم', accessor: 'amount' },
            { id: 'reference', header: 'Deposit Ref #', headerUr: 'ریفرینس', accessor: 'reference' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={transfers}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
