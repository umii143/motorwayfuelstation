/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * OverviewTab — General Accounting Control Room Dashboard & COA Master Summary
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Layers, DollarSign, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';

interface OverviewTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ lang, onOpenInspector }) => {
  const chartOfAccounts = [
    { code: '110101', name: 'Cash in Hand (Physical Drawer)', category: 'ASSET', closing: 'Rs 320,000' },
    { code: '110201', name: 'HBL Main Operating Account', category: 'ASSET', closing: 'Rs 2,540,000' },
    { code: '120101', name: 'Accounts Receivable (Trade Debtors)', category: 'ASSET', closing: 'Rs 1,350,000' },
    { code: '130101', name: 'Fuel Inventory (Super & Diesel)', category: 'ASSET', closing: 'Rs 22,268,000' },
    { code: '210101', name: 'Accounts Payable (PSO Bowser Vendors)', category: 'LIABILITY', closing: 'Rs 7,950,000' },
    { code: '310101', name: 'Owner Capital Account', category: 'EQUITY', closing: 'Rs 15,000,000' },
    { code: '410101', name: 'Fuel Dispense Sales Revenue', category: 'INCOME', closing: 'Rs 1,232,000' },
    { code: '510101', name: 'Cost of Goods Sold (Fuel COGS)', category: 'EXPENSE', closing: 'Rs 1,050,000' },
    { code: '520101', name: 'Station Electricity & Utility Expense', category: 'EXPENSE', closing: 'Rs 45,000' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* 5 Financial Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-900">ASSETS (100000)</span>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">Rs 26,478,000</div>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">Cash, Bank, Receivables, Stock</span>
        </div>

        <div className="bg-red-50/80 border border-red-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-red-900">LIABILITIES (200000)</span>
          <div className="text-2xl font-black text-red-900 tracking-tight">Rs 7,950,000</div>
          <span className="text-[10px] font-extrabold text-red-700 mt-1">Supplier Payables (PSO)</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">EQUITY (300000)</span>
          <div className="text-2xl font-black text-blue-900 tracking-tight">Rs 15,000,000</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">Owner Capital</span>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-amber-900">INCOME (400000)</span>
          <div className="text-2xl font-black text-amber-900 tracking-tight">Rs 1,232,000</div>
          <span className="text-[10px] font-extrabold text-amber-700 mt-1">Fuel Sales Revenue</span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-purple-900">EXPENSES (500000)</span>
          <div className="text-2xl font-black text-purple-900 tracking-tight">Rs 1,095,000</div>
          <span className="text-[10px] font-extrabold text-purple-700 mt-1">COGS + Utilities</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Chart of Accounts (COA) Master Summary
        </h2>
        <EnterpriseRegisterTable
          columns={[
            { id: 'code', header: 'Account Code', headerUr: 'کوڈ', accessor: 'code', sortable: true },
            { id: 'name', header: 'Account Name', headerUr: 'نام', accessor: 'name' },
            { id: 'category', header: 'Category', headerUr: 'قسم', accessor: 'category' },
            { id: 'closing', header: 'Closing Balance (₨)', headerUr: 'بیلنس', accessor: 'closing' },
          ]}
          data={chartOfAccounts}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
