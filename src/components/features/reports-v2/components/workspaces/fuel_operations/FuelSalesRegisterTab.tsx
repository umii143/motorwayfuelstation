/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FuelSalesRegisterTab — Dedicated Fuel Dispense Register Sub-Workspace
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React, { useState, useMemo } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { SlidersHorizontal, Download } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';

interface FuelSalesRegisterTabProps {
  salesRows: Record<string, any>[];
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const FuelSalesRegisterTab: React.FC<FuelSalesRegisterTabProps> = ({
  salesRows,
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    if (!search.trim()) return salesRows;
    const q = search.toLowerCase();
    return salesRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [salesRows, search]);

  if (salesRows.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No Fuel Sales Records Found"
        description="Fuel sales dispense records will automatically populate here once transactions are recorded through POS or shift operations."
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            📋 Live Fuel Sales Dispense Register
          </h2>
          <p className="text-xs font-bold text-slate-400">
            Realtime invoice records, quantities, unit rates, and payment methods
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder={isEn ? '🔍 Search invoice, operator, mode...' : '🔍 تلاش کریں...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs focus:outline-none placeholder:text-slate-400 min-w-[220px]"
          />
          <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold flex items-center gap-1 hover:bg-slate-50 cursor-pointer">
            <SlidersHorizontal size={14} />
            <span>Filter</span>
          </button>
          <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold flex items-center gap-1 hover:bg-slate-50 cursor-pointer">
            <Download size={14} />
            <span>Export ▾</span>
          </button>
        </div>
      </div>

      <EnterpriseRegisterTable
        columns={[
          { id: 'invoiceNo', header: 'Invoice #', headerUr: 'انوائس #', accessor: 'invoiceNo', sortable: true },
          { id: 'productName', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'productName' },
          { id: 'quantity', header: 'Quantity (L)', headerUr: 'مقدار (لیٹر)', accessor: 'quantity', isNumeric: true, sortable: true },
          { id: 'rate', header: 'Rate (₨)', headerUr: 'قیمت', accessor: 'rate', isCurrency: true },
          { id: 'totalAmount', header: 'Total (₨)', headerUr: 'کل رقم', accessor: 'totalAmount', isCurrency: true, sortable: true },
          { id: 'paymentMode', header: 'Payment Mode', headerUr: 'ادائیگی کا طریقہ', accessor: 'paymentMode' },
        ]}
        data={filteredRows}
        language={lang}
        onRowClick={(row) => onSelectRecord?.(row)}
      />
    </div>
  );
};
