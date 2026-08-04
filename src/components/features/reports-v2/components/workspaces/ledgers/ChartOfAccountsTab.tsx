/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ChartOfAccountsTab — 6-Digit Master COA Tree & Category Register
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Layers, Plus } from 'lucide-react';

interface ChartOfAccountsTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const ChartOfAccountsTab: React.FC<ChartOfAccountsTabProps> = ({ lang, onOpenInspector }) => {
  const coaData = [
    { code: '110101', name: 'Cash in Hand (Physical Drawer)', category: 'ASSET', opening: 'Rs 150,000', debit: 'Rs 320,000', credit: 'Rs 150,000', closing: 'Rs 320,000', status: 'ACTIVE' },
    { code: '110201', name: 'HBL Main Operating Account', category: 'ASSET', opening: 'Rs 2,450,000', debit: 'Rs 140,000', credit: 'Rs 50,000', closing: 'Rs 2,540,000', status: 'ACTIVE' },
    { code: '120101', name: 'Accounts Receivable (Trade Debtors)', category: 'ASSET', opening: 'Rs 1,250,000', debit: 'Rs 150,000', credit: 'Rs 50,000', closing: 'Rs 1,350,000', status: 'ACTIVE' },
    { code: '130101', name: 'Fuel Inventory (Super & Diesel)', category: 'ASSET', opening: 'Rs 18,500,000', debit: 'Rs 5,000,000', credit: 'Rs 1,232,000', closing: 'Rs 22,268,000', status: 'ACTIVE' },
    { code: '210101', name: 'Accounts Payable (PSO Bowser Vendors)', category: 'LIABILITY', opening: 'Rs 3,450,000', debit: 'Rs 500,000', credit: 'Rs 5,000,000', closing: 'Rs 7,950,000', status: 'ACTIVE' },
    { code: '310101', name: 'Owner Capital Account', category: 'EQUITY', opening: 'Rs 15,000,000', debit: 'Rs 0', credit: 'Rs 0', closing: 'Rs 15,000,000', status: 'ACTIVE' },
    { code: '410101', name: 'Fuel Dispense Sales Revenue', category: 'INCOME', opening: 'Rs 0', debit: 'Rs 0', credit: 'Rs 1,232,000', closing: 'Rs 1,232,000', status: 'ACTIVE' },
    { code: '510101', name: 'Cost of Goods Sold (Fuel COGS)', category: 'EXPENSE', opening: 'Rs 0', debit: 'Rs 1,050,000', credit: 'Rs 0', closing: 'Rs 1,050,000', status: 'ACTIVE' },
    { code: '520101', name: 'Station Electricity & Utility Expense', category: 'EXPENSE', opening: 'Rs 0', debit: 'Rs 45,000', credit: 'Rs 0', closing: 'Rs 45,000', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-[#0B5C3D]" />
            <span>6-Digit Chart of Accounts Master Tree & Codes</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Standard SAP / NetSuite 5-Category Account Classification System
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Add Account</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'code', header: 'Account Code', headerUr: 'کوڈ', accessor: 'code', sortable: true },
            { id: 'name', header: 'Account Name', headerUr: 'نام', accessor: 'name' },
            { id: 'category', header: 'Category', headerUr: 'قسم', accessor: 'category' },
            { id: 'opening', header: 'Opening (₨)', headerUr: 'اوپننگ', accessor: 'opening' },
            { id: 'debit', header: 'Total Debit (₨)', headerUr: 'ڈبیٹ', accessor: 'debit' },
            { id: 'credit', header: 'Total Credit (₨)', headerUr: 'کریڈٹ', accessor: 'credit' },
            { id: 'closing', header: 'Closing Balance (₨)', headerUr: 'بیلنس', accessor: 'closing' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={coaData}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
