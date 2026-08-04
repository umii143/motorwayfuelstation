/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ProfitLossTab — Income, COGS, Operating Expenses & Net Profit
 */

import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface ProfitLossTabProps {
  lang: 'en' | 'ur';
}

export const ProfitLossTab: React.FC<ProfitLossTabProps> = ({ lang }) => {
  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span>Profit & Loss Statement (P&L)</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Operational revenue, fuel cost of goods sold, overhead expenses, and net profit margin
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
          Net Profit Margin: 30.5%
        </span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="space-y-2 text-xs font-bold">
          <div className="flex justify-between py-2 border-b border-slate-100 text-slate-900 font-black">
            <span>REVENUE & INCOME</span>
            <span className="text-emerald-700">Rs 128,450,000</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Fuel Sales Revenue (Super & Diesel)</span>
            <span>Rs 120,500,000</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Lubricant & Oil Sales</span>
            <span>Rs 5,450,000</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Convenience Mart Sales</span>
            <span>Rs 2,500,000</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-100 text-slate-900 font-black pt-4">
            <span>COST OF GOODS SOLD (COGS)</span>
            <span className="text-rose-600">Rs (82,500,000)</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Fuel Wholesale Cost (PSO & Shell Invoices)</span>
            <span>Rs (80,000,000)</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Freight & Transportation Fees</span>
            <span>Rs (2,500,000)</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200 text-slate-900 font-black text-sm bg-slate-50 px-3 rounded-xl my-2">
            <span>GROSS PROFIT</span>
            <span className="text-[#0B5C3D]">Rs 45,950,000</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-100 text-slate-900 font-black pt-2">
            <span>OPERATING EXPENSES</span>
            <span className="text-rose-600">Rs (6,820,000)</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Electricity Utility & Fuel Generator</span>
            <span>Rs (1,820,000)</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Staff Salaries & Shift Commissions</span>
            <span>Rs (3,500,000)</span>
          </div>
          <div className="flex justify-between pl-4 text-slate-600">
            <span>Station Maintenance & Repairs</span>
            <span>Rs (1,500,000)</span>
          </div>

          <div className="flex justify-between py-3 border-t-2 border-emerald-500 text-slate-900 font-black text-base bg-emerald-50 px-4 rounded-xl mt-4">
            <span>NET OPERATING PROFIT</span>
            <span className="text-[#0B5C3D]">Rs 39,130,000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
