/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CashReconciliationTab — Dedicated Shift Cash Reconciliation & Settlement Sub-Workspace
 *
 * Implements Enterprise Rule #137 & Rule #144
 */

import React, { useState } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { DollarSign, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface CashReconciliationTabProps {
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const CashReconciliationTab: React.FC<CashReconciliationTabProps> = ({
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';
  const [actualCashInput, setActualCashInput] = useState('320000');

  const expectedCash = 320000;
  const actualCash = Number(actualCashInput) || 0;
  const cashDifference = actualCash - expectedCash;

  const reconciliationLogs = [
    { shiftId: 'SHIFT-2025-0515-M', date: 'May 15, 2025', cashier: 'Ali Raza', expectedCash: 'Rs 320,000', physicalCash: 'Rs 320,000', difference: 'Rs 0', status: 'VERIFIED_BALANCED' },
    { shiftId: 'SHIFT-2025-0514-N', date: 'May 14, 2025', cashier: 'Umer Farooq', expectedCash: 'Rs 280,000', physicalCash: 'Rs 280,000', difference: 'Rs 0', status: 'VERIFIED_BALANCED' },
  ];

  return (
    <div className="space-y-4">
      {/* CASH RECONCILIATION SUMMARY CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-700" />
              <span>Shift Cash Reconciliation & Physical Cash Count</span>
            </h2>
            <p className="text-xs font-bold text-slate-400">Reconcile physical cash drawer balance against expected system sales</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
            ✓ BALANCED MATCH
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-bold">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Expected Cash (System)</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">Rs {expectedCash.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <label className="text-emerald-800 block text-[11px] font-black mb-1">Physical Cash Count (₨)</label>
            <input
              type="number"
              value={actualCashInput}
              onChange={(e) => setActualCashInput(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-sm font-black text-slate-900 focus:outline-none"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Cash Difference</span>
            <span className={`text-lg font-black mt-1 block ${cashDifference === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              Rs {cashDifference.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <button className="w-full py-2.5 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <ShieldCheck size={16} />
              <span>Verify & Settle Shift Cash</span>
            </button>
          </div>
        </div>
      </div>

      {/* RECONCILIATION AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Shift Cash Reconciliation Audit Ledger
        </h3>

        <EnterpriseRegisterTable
          columns={[
            { id: 'shiftId', header: 'Shift Session ID', headerUr: 'شفٹ سیشن', accessor: 'shiftId', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'cashier', header: 'Cashier / Operator', headerUr: 'کیشیئر', accessor: 'cashier' },
            { id: 'expectedCash', header: 'Expected Cash', headerUr: 'ایکسپیکٹڈ کیش', accessor: 'expectedCash' },
            { id: 'physicalCash', header: 'Physical Cash', headerUr: 'فزیکل کیش', accessor: 'physicalCash' },
            { id: 'difference', header: 'Difference', headerUr: 'فرق', accessor: 'difference' },
            { id: 'status', header: 'Audit Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={reconciliationLogs}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
