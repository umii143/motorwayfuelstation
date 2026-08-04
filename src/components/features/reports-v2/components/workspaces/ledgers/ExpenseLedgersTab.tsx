/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ExpenseLedgersTab — Station Operational Expense Vouchers Ledger
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ArrowDownRight, Plus } from 'lucide-react';

interface ExpenseLedgersTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const ExpenseLedgersTab: React.FC<ExpenseLedgersTabProps> = ({ lang, onOpenInspector }) => {
  const expenseLedgers = [
    { voucherNo: 'PV-2025-0515-045', date: 'May 15, 2025', category: 'Fuel Purchase COGS (510101)', payee: 'PSO Bowser Delivery Invoice #INV-515', amount: 'Rs 850,000', payingAccount: 'HBL Account', status: 'VERIFIED' },
    { voucherNo: 'PV-2025-0515-044', date: 'May 15, 2025', category: 'Station Electricity Utility (520101)', payee: 'LESCO Commercial Bill #EB-7788', amount: 'Rs 125,500', payingAccount: 'Bank Alfalah', status: 'VERIFIED' },
    { voucherNo: 'PV-2025-0514-043', date: 'May 14, 2025', category: 'Generator Diesel Maintenance (530101)', payee: 'Local Lubricant Supplier', amount: 'Rs 45,000', payingAccount: 'Cash In Hand', status: 'APPROVED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ArrowDownRight size={18} className="text-rose-600" />
            <span>Station Operational Expenses Accounts Ledger</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Fuel COGS, electricity utilities, generator maintenance, staff salaries, and petty cash
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Record Expense</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'voucherNo', header: 'Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'category', header: 'Expense Category & Code', headerUr: 'کیٹیگری', accessor: 'category' },
            { id: 'payee', header: 'Payee / Vendor', headerUr: 'وینڈر', accessor: 'payee' },
            { id: 'amount', header: 'Expense Amount (₨)', headerUr: 'رقم', accessor: 'amount' },
            { id: 'payingAccount', header: 'Paying Account', headerUr: 'اکاؤنٹ', accessor: 'payingAccount' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={expenseLedgers}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
