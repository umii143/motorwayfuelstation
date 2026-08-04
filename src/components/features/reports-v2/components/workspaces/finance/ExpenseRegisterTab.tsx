/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ExpenseRegisterTab — Operational Expense Register & Vouchers
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ArrowDownRight, Plus } from 'lucide-react';

interface ExpenseRegisterTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const ExpenseRegisterTab: React.FC<ExpenseRegisterTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const expenseRecords = [
    { expNo: 'PV-2025-0515-045', date: 'May 15, 2025', category: 'Fuel Purchase COGS', vendor: 'PSO Bowser Delivery Invoice #INV-515', amount: 'Rs 850,000', payingAccount: 'HBL Main Account', status: 'VERIFIED' },
    { expNo: 'PV-2025-0515-044', date: 'May 15, 2025', category: 'Station Electricity Utility', vendor: 'LESCO Commercial Bill #EB-7788', amount: 'Rs 125,500', payingAccount: 'Bank Alfalah Account', status: 'VERIFIED' },
    { expNo: 'PV-2025-0514-043', date: 'May 14, 2025', category: 'Generator Diesel Maintenance', vendor: 'Local Lubricant Supplier', amount: 'Rs 45,000', payingAccount: 'Cash In Hand', status: 'APPROVED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ArrowDownRight size={18} className="text-rose-600" />
            <span>Station Operational Expense Vouchers Register</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Fuel COGS, electricity utilities, generator maintenance, staff salaries, and petty cash
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Expense Voucher</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'expNo', header: 'Voucher #', headerUr: 'واؤچر #', accessor: 'expNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'category', header: 'Expense Category', headerUr: 'کیٹیگری', accessor: 'category' },
            { id: 'vendor', header: 'Payee / Vendor', headerUr: 'وینڈر', accessor: 'vendor' },
            { id: 'amount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'amount' },
            { id: 'payingAccount', header: 'Paying Account', headerUr: 'اکاؤنٹ', accessor: 'payingAccount' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={expenseRecords}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
