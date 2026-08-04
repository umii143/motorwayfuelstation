/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CashBookTab — Physical Cash Drawer Register & Petty Cash Vouchers
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { DollarSign, Plus } from 'lucide-react';

interface CashBookTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const CashBookTab: React.FC<CashBookTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const cashRecords = [
    { voucherNo: 'CV-2025-0515-001', date: 'May 15, 2025', description: 'Fuel Sales Cash Collection (Morning Shift)', cashIn: 'Rs 1,250,000', cashOut: '—', closingCash: 'Rs 2,450,000', status: 'VERIFIED' },
    { voucherNo: 'CV-2025-0515-002', date: 'May 15, 2025', description: 'Lubricants Store Cash Sales', cashIn: 'Rs 320,000', cashOut: '—', closingCash: 'Rs 1,200,000', status: 'VERIFIED' },
    { voucherNo: 'TR-2025-0515-012', date: 'May 15, 2025', description: 'Bank Cash Deposit to HBL Main Account', cashIn: '—', cashOut: 'Rs 500,000', closingCash: 'Rs 880,000', status: 'POSTED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <DollarSign size={18} className="text-[#0B5C3D]" />
            <span>Physical Cash Book & Drawer Register</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Shift cash collections, petty cash vouchers, and physical drawer balances
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Record Cash Voucher</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'voucherNo', header: 'Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'description', header: 'Description', headerUr: 'تفصیل', accessor: 'description' },
            { id: 'cashIn', header: 'Cash In (₨)', headerUr: 'کیش آمد', accessor: 'cashIn' },
            { id: 'cashOut', header: 'Cash Out (₨)', headerUr: 'کیش اخراجات', accessor: 'cashOut' },
            { id: 'closingCash', header: 'Closing Cash (₨)', headerUr: 'کل کیش', accessor: 'closingCash' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={cashRecords}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
