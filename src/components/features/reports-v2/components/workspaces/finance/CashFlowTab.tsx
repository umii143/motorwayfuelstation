/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CashFlowTab — Operating, Investing, Financing Cash Flow Statement
 */

import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface CashFlowTabProps {
  lang: 'en' | 'ur';
}

export const CashFlowTab: React.FC<CashFlowTabProps> = ({ lang }) => {
  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <DollarSign size={18} className="text-[#0B5C3D]" />
            <span>Cash Flow Statement</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Operating activities, capital investments, financing cash flow, and net cash position
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
          Net Cash Increase: +Rs 39,130,000
        </span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs font-bold">
        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-900 font-black">
          <span>OPERATING CASH FLOW</span>
          <span className="text-emerald-700">Rs 41,630,000</span>
        </div>
        <div className="flex justify-between pl-4 text-slate-600">
          <span>Cash Received from Fuel & Lube Sales</span>
          <span>Rs 128,450,000</span>
        </div>
        <div className="flex justify-between pl-4 text-slate-600">
          <span>Cash Paid to OMC Suppliers (PSO & Shell)</span>
          <span>Rs (80,000,000)</span>
        </div>
        <div className="flex justify-between pl-4 text-slate-600">
          <span>Cash Paid for Station Operating Expenses</span>
          <span>Rs (6,820,000)</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-900 font-black pt-4">
          <span>INVESTING CASH FLOW</span>
          <span className="text-rose-600">Rs (2,500,000)</span>
        </div>
        <div className="flex justify-between pl-4 text-slate-600">
          <span>Purchase of New Dispenser Nozzles & ATG Sensors</span>
          <span>Rs (2,500,000)</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-900 font-black pt-4">
          <span>FINANCING CASH FLOW</span>
          <span className="text-slate-600">Rs 0</span>
        </div>

        <div className="flex justify-between py-3 border-t-2 border-[#0B5C3D] text-slate-900 font-black text-sm bg-emerald-50 px-4 rounded-xl mt-4">
          <span>NET CASH POSITION AT END OF PERIOD</span>
          <span className="text-[#0B5C3D]">Rs 30,120,750</span>
        </div>
      </div>
    </div>
  );
};
